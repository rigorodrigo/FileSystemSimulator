import globalState from '/js/globalState.js';
import updateAll, { updateBlockStatus } from '/js/updater.js';

function deallocateFileBlocks(file, partition) {
    file.allocatedBlocks.forEach(blockIndex => {
        updateBlockStatus(blockIndex, 'free', {
            partitionId: partition.id,
            partitionName: partition.name,
            nextBlock: null
        });
    });

    // Handle specific allocation method cleanup
    switch (file.allocationMethod) {
        case 'Contígua':
            break;
            
        case 'Encadeada':
            break;
            
        case 'FAT':
            // TODO
            break;
            
        case 'Indexada':
            // For indexed allocation, we need to free the index block and all data blocks
            // The allocatedBlocks array contains all blocks (index + data), but we need
            // to handle them specifically to ensure proper cleanup
            if (file.allocationInfo && file.allocationInfo.type === 'indexed') {
                const indexBlock = file.allocationInfo.indexBlock;
                if (indexBlock !== undefined && indexBlock !== null) {
                    updateBlockStatus(indexBlock, 'free', {
                        partitionId: partition.id,
                        partitionName: partition.name,
                        nextBlock: null
                    });
                }
                
                // Also free any data blocks referenced in the index
                if (file.allocationInfo.fileBlocks && Array.isArray(file.allocationInfo.fileBlocks)) {
                    file.allocationInfo.fileBlocks.forEach(dataBlockIndex => {
                        updateBlockStatus(dataBlockIndex, 'free', {
                            partitionId: partition.id,
                            partitionName: partition.name,
                            nextBlock: null
                        });
                    });
                }
            }
            break;
            
        default:
            console.warn(`Método de alocação desconhecido: ${file.allocationMethod}`);
    }
}

function deleteDirectory(directoryId) {
    try {
        const directory = globalState.getDirectoryById(directoryId);
        if (!directory) {
            throw new Error(`Diretório com ID ${directoryId} não encontrado!`);
        }

        const partition = globalState.getDisk().partitions.find(p => p.id == directory.partitionId);
        if (!partition) {
            throw new Error(`Partição do diretório não encontrada!`);
        }

        // Check if it's the root directory
        if (directory.fullPath === '/' || directory.name === '/') {
            throw new Error('Não é possível excluir o diretório raiz!');
        }

        // Get all files and subdirectories within this directory (recursive)
        const filesInDirectory = globalState.getDisk().files.filter(f => 
            f.directoryPath === directory.fullPath || 
            f.directoryPath?.startsWith(directory.fullPath + '/')
        );
        
        const subdirectories = globalState.getDisk().directories.filter(d => 
            d.parentPath === directory.fullPath ||
            d.fullPath.startsWith(directory.fullPath + '/')
        );

        // Recursively delete all files in this directory and subdirectories
        filesInDirectory.forEach(file => {
            try {
                deallocateFileBlocks(file, partition);
                globalState.removeFile(file.id);
                console.log(`Arquivo "${file.name}" deletado automaticamente com o diretório.`);
            } catch (error) {
                console.warn(`Erro ao deletar arquivo "${file.name}":`, error.message);
            }
        });

        // Recursively delete all subdirectories (process from deepest to shallowest)
        const sortedSubdirectories = subdirectories.sort((a, b) => b.fullPath.length - a.fullPath.length);
        sortedSubdirectories.forEach(subdir => {
            try {
                if (subdir.blockAllocated !== undefined && subdir.blockAllocated !== null) {
                    updateBlockStatus(subdir.blockAllocated, 'free', {
                        partitionId: partition.id,
                        partitionName: partition.name,
                        nextBlock: null
                    });
                }
                
                // For indexed directories, also free any additional blocks referenced in the index
                if (partition.allocationMethod === 'Indexada' && subdir.blockAllocated !== undefined) {
                    const disk = globalState.getDisk();
                    const indexBlock = disk.blocks[subdir.blockAllocated];
                    if (indexBlock && indexBlock.dataset && indexBlock.dataset.indexedBlocks) {
                        try {
                            const indexedBlocks = JSON.parse(indexBlock.dataset.indexedBlocks);
                            indexedBlocks.forEach(blockIndex => {
                                updateBlockStatus(blockIndex, 'free', {
                                    partitionId: partition.id,
                                    partitionName: partition.name,
                                    nextBlock: null
                                });
                            });
                        } catch (error) {
                            console.warn(`Erro ao liberar blocos indexados do diretório "${subdir.name}":`, error.message);
                        }
                    }
                }
                
                globalState.removeDirectory(subdir.id);
                console.log(`Subdiretório "${subdir.name}" deletado automaticamente.`);
            } catch (error) {
                console.warn(`Erro ao deletar subdiretório "${subdir.name}":`, error.message);
            }
        });

        // Update partition usage for deleted files and directories
        let totalDeletedBlocks = 0;
        
        // Count blocks from deleted files
        filesInDirectory.forEach(file => {
            let fileBlocks = file.requiredBlocks || file.allocatedBlocks?.length || 0;
            
            // For indexed allocation, also count the index block and any additional data blocks
            if (file.allocationMethod === 'Indexada' && file.allocationInfo && file.allocationInfo.type === 'indexed') {
                // Add index block
                fileBlocks += 1;
                // Add data blocks if they exist and are different from allocatedBlocks
                if (file.allocationInfo.fileBlocks && Array.isArray(file.allocationInfo.fileBlocks)) {
                    fileBlocks += file.allocationInfo.fileBlocks.length;
                }
            }
            
            totalDeletedBlocks += fileBlocks;
        });
        
        // Count blocks from deleted subdirectories
        subdirectories.forEach(subdir => {
            let dirBlocks = 1; // Each directory uses at least 1 block
            
            // For indexed directories, also count any additional data blocks
            if (partition.allocationMethod === 'Indexada' && subdir.blockAllocated !== undefined) {
                const disk = globalState.getDisk();
                const indexBlock = disk.blocks[subdir.blockAllocated];
                if (indexBlock && indexBlock.dataset && indexBlock.dataset.indexedBlocks) {
                    try {
                        const indexedBlocks = JSON.parse(indexBlock.dataset.indexedBlocks);
                        dirBlocks += indexedBlocks.length;
                    } catch (error) {
                        // If we can't parse, just use the base block count
                    }
                }
            }
            
            totalDeletedBlocks += dirBlocks;
        });
        
        partition.usedBlocks -= totalDeletedBlocks;

        // Free the directory's allocated block
        if (directory.blockAllocated !== undefined && directory.blockAllocated !== null) {
            updateBlockStatus(directory.blockAllocated, 'free', {
                partitionId: partition.id,
                partitionName: partition.name,
                nextBlock: null
            });

            // For indexed directories, also free any additional blocks referenced in the index
            if (partition.allocationMethod === 'Indexada') {
                const disk = globalState.getDisk();
                const indexBlock = disk.blocks[directory.blockAllocated];
                if (indexBlock && indexBlock.dataset && indexBlock.dataset.indexedBlocks) {
                    try {
                        const indexedBlocks = JSON.parse(indexBlock.dataset.indexedBlocks);
                        indexedBlocks.forEach(blockIndex => {
                            updateBlockStatus(blockIndex, 'free', {
                                partitionId: partition.id,
                                partitionName: partition.name,
                                nextBlock: null
                            });
                        });
                    } catch (error) {
                        console.warn(`Erro ao liberar blocos indexados do diretório "${directory.name}":`, error.message);
                    }
                }
            }

            // Update partition usage for the main directory block
            let mainDirBlocks = 1; // Base directory block
            
            // For indexed directories, also count any additional data blocks
            if (partition.allocationMethod === 'Indexada') {
                const disk = globalState.getDisk();
                const indexBlock = disk.blocks[directory.blockAllocated];
                if (indexBlock && indexBlock.dataset && indexBlock.dataset.indexedBlocks) {
                    try {
                        const indexedBlocks = JSON.parse(indexBlock.dataset.indexedBlocks);
                        mainDirBlocks += indexedBlocks.length;
                    } catch (error) {
                        // If we can't parse, just use the base block count
                    }
                }
            }
            
            partition.usedBlocks -= mainDirBlocks;
        }

        // Remove directory from global state
        globalState.removeDirectory(directoryId);

        // If user is currently in this directory or a subdirectory, navigate to parent
        const currentPath = globalState.getCurrentPath();
        if (currentPath === directory.fullPath || currentPath.startsWith(directory.fullPath + '/')) {
            globalState.setCurrentPath(directory.parentPath || '/');
        }

        updateAll();

        const totalDeletedFiles = filesInDirectory.length;
        const totalDeletedDirs = subdirectories.length;
        let message = `Diretório "${directory.name}" deletado com sucesso!`;
        
        if (totalDeletedFiles > 0 || totalDeletedDirs > 0) {
            message += ` (${totalDeletedFiles} arquivo(s) e ${totalDeletedDirs} subdiretório(s) também foram removidos)`;
        }
        
        console.log(message);
        
    } catch (error) {
        console.error('Erro ao deletar diretório:', error.message);
        alert(`Erro ao deletar diretório: ${error.message}`);
    }
}

function confirmDeleteDirectory(directoryId, directoryName) {
    window.pendingDirectoryDeleteId = directoryId;
    
    const directoryNameElement = document.getElementById('delete-directory-name');
    if (directoryNameElement) {
        directoryNameElement.textContent = directoryName;
    }
    
    const modal = document.getElementById('delete_directory');
    if (modal) {
        modal.showModal();
    }
}

function executeDirectoryDelete() {
    if (window.pendingDirectoryDeleteId) {
        deleteDirectory(window.pendingDirectoryDeleteId);
        window.pendingDirectoryDeleteId = null;
        
        const modal = document.getElementById('delete_directory');
        if (modal) {
            modal.close();
        }
    }
}

// Make functions available globally
window.deleteDirectory = deleteDirectory;
window.confirmDeleteDirectory = confirmDeleteDirectory;
window.executeDirectoryDelete = executeDirectoryDelete;

export { deleteDirectory, confirmDeleteDirectory, executeDirectoryDelete };
