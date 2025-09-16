import globalState from '/js/globalState.js';
import { bitMap, freeBlockList } from '/js/space/freeSpaceManager.js';
import { reinitializeBlockVisualization } from '/js/blockVisualization.js';

export default function updateAll() {
    updateStats();
    updatePartitionsList();
    updateBrowser();
    updateDiskBlocks();
    updateSpaceManagementVisualizer();
    updatePathDisplay();
    updateFileBrowserSidebar();
    updateModalInfo();
}

export function updateStats() {
    // Update block quantity and disk size from the global stats
    const blockQuantityElem = document.getElementById('stat-global-block-quantity');
    const diskSizeElem = document.getElementById('stat-global-disk-size');
    const blockUsageProgress = document.getElementById('stat-global-block-usage-progress');
    const blockUsageText = document.getElementById('stat-global-block-usage');
    const diskUsageProgress = document.getElementById('stat-global-disk-usage-progress');
    const diskUsageText = document.getElementById('stat-global-disk-usage');
    const filesCounts = document.getElementById('stat-global-files-count');
    const directoriesCounts = document.getElementById('stat-global-directories-count');
    const internalFragmentationElem = document.getElementById('stat-global-internal-fragmentation');
    const internalFragmentationPercent = document.getElementById('stat-global-internal-fragmentation-percent');

    const diskConfig = globalState.getDiskConfig();
    const disk = globalState.getDisk();

    // Calculate used blocks
    const usedBlocks = disk.partitions.reduce((sum, partition) => sum + partition.usedBlocks, 0);
    const totalBlocks = diskConfig.blockQuantity || 1; // Avoid division by zero

    const blockUsagePercent = ((usedBlocks / totalBlocks) * 100).toFixed(2);
    if (blockUsageProgress) {
        blockUsageProgress.value = blockUsagePercent;
    }
    if (blockUsageText) {
        blockUsageText.textContent = `${blockUsagePercent}% usado`;
    }

    const usedSpace = disk.files.reduce((sum, file) => sum + file.sizeInKB, 0);
    const totalSpace = diskConfig.totalCapacity || 1; // Avoid division by zero

    const diskUsagePercent = ((usedSpace / totalSpace) * 100).toFixed(2);
    if (diskUsageProgress) {
        diskUsageProgress.value = diskUsagePercent;
    }
    if (diskUsageText) {
        diskUsageText.textContent = `${diskUsagePercent}% usado`;
    }

    if (blockQuantityElem) {
        blockQuantityElem.textContent = globalState.getDiskConfig().blockQuantity || '0';
    }

    if (diskSizeElem) {
        diskSizeElem.innerHTML = (globalState.getDiskConfig().totalCapacity / 1024).toFixed(2) + "MB" || '0'; // In MB
    }

    if (filesCounts) {
        filesCounts.textContent = disk.files.length || '0';
    }

    if (directoriesCounts) {
        directoriesCounts.textContent = disk.directories.length || '0';
    }

    const blockSize = diskConfig.blockSize || 1; // Avoid division by zero
    const internalFragmentation = (usedBlocks * blockSize) - usedSpace;

    if (internalFragmentationElem) {
       internalFragmentationElem.textContent = `${internalFragmentation} KB`;
    }

    if (internalFragmentationPercent) {
        let internalFragmentationUsage = ((internalFragmentation / usedSpace) * 100).toFixed(2);
        if (usedSpace === 0) internalFragmentationUsage = '0.00';
        internalFragmentationPercent.textContent = `${internalFragmentationUsage}%`;
    }
}

export function updatePartitionsList() {
    const partitionsListElem = document.getElementById('partitions-list');
    if (!partitionsListElem) return;

    const partitions = globalState.getDisk().partitions || [];
    
    partitionsListElem.innerHTML = '';
    
    partitions.forEach((partition) => {
        const partitionElement = createPartitionElement(partition);
        partitionsListElem.appendChild(partitionElement);
    });
    
    if (partitions.length === 0) {
        partitionsListElem.innerHTML = '<div class="text-center text-gray-500 py-4">Nenhuma partição criada ainda</div>';
    }

    // Dispatch event to notify partition selector of updates
    document.dispatchEvent(new CustomEvent('partitionsUpdated'));
}

function createPartitionElement(partition) {
    const div = document.createElement('div');
    div.className = 'border p-2 rounded-lg space-y-2 cursor-pointer hover:bg-primary/15 transition-colors';
    div.dataset.partitionId = partition.id;
    
    const usagePercentage = partition.getUsagePercentage();
    
    div.innerHTML = `
        <span class="font-bold mb-2">${partition.name}</span>

        <div class="flex flex-wrap justify-around gap-2 mt-2">
            <div class="stats shadow">
                <div class="stat text-center p-2">
                    <div class="stat-title flex-1">Blocos</div>
                    <div class="stat-value text-xl">
                        ${partition.startBlock} - ${partition.endBlock}
                    </div>
                    <div class="stat-desc">${partition.totalBlocks} total</div>
                </div>
            </div>

            <div class="stats shadow">
                <div class="stat text-center p-2">
                    <div class="stat-title flex-1">Tamanho</div>
                    <div class="stat-value text-xl">
                        ${partition.sizeInMB.toFixed(2)} MB
                    </div>
                </div>
            </div>

            <div class="stats shadow">
                <div class="stat text-center p-2">
                    <div class="stat-title flex-1">Alocação</div>
                    <div class="stat-value text-xl">
                        ${partition.allocationMethod}
                    </div>
                </div>
            </div>

            <div class="stats shadow">
                <div class="stat text-center p-2">
                    <div class="stat-title flex-1">Diretórios</div>
                    <div class="stat-value text-xl">
                        ${partition.directoryMethod}
                    </div>
                </div>
            </div>

            <div class="stats shadow">
                <div class="stat text-center p-2">
                    <div class="stat-title flex-1">Espaço livre</div>
                    <div class="stat-value text-xl">
                        ${partition.spaceManagementMethod}
                    </div>
                </div>
            </div>
        </div>

        <div>
            <progress class="progress w-full" value="${usagePercentage}" max="100"></progress>
            <div class="flex justify-between">
                <span>${partition.usedBlocks} / ${partition.totalBlocks} blocos utilizados (${usagePercentage}%)</span>
                <button onclick="showDeletePartitionModal('${partition.id}')">
                    <svg class="text-error/30 hover:text-error cursor-pointer transition" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        </div>
    `;
    
    return div;
}


export function updateBrowser() {
    // Get the current select partatition and all the related files
    const selectedPartition = globalState.getSelectedPartition();
    if (!selectedPartition) return;

    const currentPath = globalState.getCurrentPath();
    const files = globalState.getFilesInDirectory(selectedPartition.id, currentPath);
    const directories = globalState.getDirectoriesInPath(selectedPartition.id, currentPath);

    // Update file list in the UI
    const fileListElem = document.getElementById('file-browser-items');
    if (!fileListElem) return;
    fileListElem.innerHTML = '';

    // Add directories
    directories.forEach(directory => {
        const dirElem = document.createElement('div');
        dirElem.className = 'border p-2 rounded-lg cursor-pointer hover:bg-warning/15 transition-colors max-w-fit max-h-fit';
        dirElem.innerHTML = `
            <div class="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-folder"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2l5 0 2 3h9a2 2 0 0 1 2 2z"></path></svg>
                <span class="font-medium">${directory.name}</span>
            </div>
        `;
        dirElem.onclick = () => {
            globalState.navigateToDirectory(directory.name);
            updateBrowser();
            updatePathDisplay();
            updateFileBrowserSidebar();
        };
        fileListElem.appendChild(dirElem);
    });

    // Add files
    files.forEach(file => {
        const fileElem = document.createElement('div');
        fileElem.className = 'border p-2 rounded-lg space-y-2 cursor-pointer hover:bg-primary/15 transition-colors max-w-fit max-h-fit';
        fileElem.dataset.fileId = file.id;
        fileElem.innerHTML = `
            <div class="flex justify-between items-center">
                <div class="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-file"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    <span class="font-medium">${file.name}</span>
                </div>
                <button onclick="confirmDeleteFile('${file.id}', '${file.name}')">
                    <svg class="text-error/30 hover:text-error cursor-pointer transition" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
            <div class="text-sm text-gray-600">Tamanho: ${(file.sizeInKB)} KB (${file.allocatedBlocks.length} blocos)</div>
        `;
        fileListElem.appendChild(fileElem);
    });

    if (files.length === 0 && directories.length === 0 && currentPath === '/') {
        fileListElem.innerHTML = '<div class="text-center text-gray-500 py-4">Nenhum arquivo nesta partição</div>';
    } else if (files.length === 0 && directories.length === 0) {
        fileListElem.innerHTML = '<div class="text-center text-gray-500 py-4">Diretório vazio</div>';
    }
}

export function updateDiskBlocks() {
    const diskBlocksContainer = document.getElementById('disk-blocks');
    if (!diskBlocksContainer) return;

    const diskConfig = globalState.getDiskConfig();
    const disk = globalState.getDisk();
    
    // Clear existing blocks
    diskBlocksContainer.innerHTML = '';
    
    // If no disk is configured, show message
    if (!diskConfig.blockQuantity) {
        diskBlocksContainer.innerHTML = '<div class="text-center text-gray-500 py-4">Configure o disco primeiro</div>';
        return;
    }

    // Create blocks
    for (let i = 0; i < diskConfig.blockQuantity; i++) {
        const blockWrapper = document.createElement('div');
        blockWrapper.className = 'relative group';
        
        const block = document.createElement('div');
        block.className = getBlockClassName(i);
        block.dataset.blockIndex = i;
        
        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap';
        tooltip.innerHTML = getBlockTooltip(i);
        
        blockWrapper.appendChild(block);
        blockWrapper.appendChild(tooltip);
        diskBlocksContainer.appendChild(blockWrapper);
    }
    
    // Initialize blocks array in disk if it doesn't exist or if size changed
    if (!disk.blocks || disk.blocks.length !== diskConfig.blockQuantity) {
        disk.blocks = new Array(diskConfig.blockQuantity).fill(null).map((_, index) => ({
            index: index,
            isAllocated: false,
            fileId: null,
            isUsed: false,
            partitionId: null,
            nextBlock: null,
            dataset: {
                status: 'unallocated',
                partitionId: null,
                partitionName: null,
                nextBlock: null,
                indexedBlocks: null
            }
        }));
    }
    
    // Reinitialize block visualization after blocks are updated
    setTimeout(() => {
        reinitializeBlockVisualization();
    }, 100);
}

function getBlockClassName(blockIndex) {
    const status = getBlockStatus(blockIndex);
    const baseClass = 'w-4 h-4 inline-block rounded-sm border border-gray-200 cursor-pointer m-0.5';
    
    switch (status.type) {
        case 'unallocated':
            return `${baseClass} bg-neutral-content`;
        case 'free':
            return `${baseClass} bg-success`;
        case 'used':
            return `${baseClass} bg-info`;
        case 'directory':
            return `${baseClass} bg-warning`;
        default:
            return `${baseClass} bg-neutral-content`;
    }
}

function getBlockStatus(blockIndex) {
    const disk = globalState.getDisk();
    const partitions = disk.partitions || [];
    const files = disk.files || [];
    const directories = disk.directories || [];
    const blocks = disk.blocks || [];
    
    // If blocks array exists and has dataset info, use it
    if (blocks[blockIndex] && blocks[blockIndex].dataset) {
        const blockData = blocks[blockIndex];
        const status = blockData.dataset.status || 'unallocated';
        
        switch (status) {
            case 'used':
                // First check if this is a file block
                const file = files.find(f => f.allocatedBlocks && f.allocatedBlocks.includes(blockIndex));
                if (file) {
                    const partition = partitions.find(p => p.id == blockData.dataset.partitionId);
                    return { type: 'used', partition, file };
                }
                
                // If not a file, check if it's part of a directory (for indexed allocation)
                const relatedDirectory = directories.find(d => {
                    // Check if this is the main directory block
                    if (d.blockAllocated === blockIndex) return true;
                    
                    // For indexed directories, check if this is one of the data blocks
                    const dirPartition = partitions.find(p => p.id == d.partitionId);
                    if (dirPartition && dirPartition.allocationMethod === 'Indexada') {
                        const indexBlock = blocks[d.blockAllocated];
                        if (indexBlock && indexBlock.dataset.indexedBlocks) {
                            try {
                                const indexedBlocks = JSON.parse(indexBlock.dataset.indexedBlocks);
                                return indexedBlocks.includes(blockIndex);
                            } catch (e) {
                                return false;
                            }
                        }
                    }
                    return false;
                });
                
                if (relatedDirectory) {
                    const dirPartition = partitions.find(p => p.id == blockData.dataset.partitionId);
                    return { type: 'directory', partition: dirPartition, directory: relatedDirectory, file: null };
                }
                
                // If neither file nor directory, return as used
                const partition = partitions.find(p => p.id == blockData.dataset.partitionId);
                return { type: 'used', partition, file: null };
                
            case 'directory':
                // First check if this is the main directory block
                let directory = directories.find(d => d.blockAllocated === blockIndex);
                
                // If not found, check if this is a data block of an indexed directory
                if (!directory) {
                    directory = directories.find(d => {
                        const dirPartition = partitions.find(p => p.id == d.partitionId);
                        if (dirPartition && dirPartition.allocationMethod === 'Indexada') {
                            const indexBlock = blocks[d.blockAllocated];
                            if (indexBlock && indexBlock.dataset.indexedBlocks) {
                                try {
                                    const indexedBlocks = JSON.parse(indexBlock.dataset.indexedBlocks);
                                    return indexedBlocks.includes(blockIndex);
                                } catch (e) {
                                    return false;
                                }
                            }
                        }
                        return false;
                    });
                }
                
                const dirPartition = partitions.find(p => p.id == blockData.dataset.partitionId);
                return { type: 'directory', partition: dirPartition, directory, file: null };
                
            case 'free':
                const freePartition = partitions.find(p => p.id == blockData.dataset.partitionId);
                return { type: 'free', partition: freePartition, file: null };
                
            case 'unallocated':
            default:
                return { type: 'unallocated', partition: null, file: null };
        }
    }
}

function getBlockTooltip(blockIndex) {
    const status = getBlockStatus(blockIndex);
    
    let tooltip = `<div class="text-center"><div class="font-bold">Bloco ${blockIndex}</div>`;
    
    switch (status.type) {
        case 'unallocated':
            tooltip += '<div class="text-gray-300">Não alocado</div>';
            break;
            
        case 'free':
            tooltip += `<div class="text-green-300">Livre</div>`;
            if (status.partition && status.partition.name) {
                tooltip += `<div class="text-xs">Partição: ${status.partition.name}</div>`;
            }
            break;
            
        case 'used':
            tooltip += `<div class="text-blue-300">Usado</div>`;
            if (status.file && status.file.name) {
                tooltip += `<div class="text-xs">Arquivo: ${status.file.name}</div>`;
                tooltip += `<div class="text-xs">Caminho: ${status.file.directoryPath || '/'}</div>`;
                tooltip += `<div class="text-xs">Tamanho: ${status.file.sizeInKB} KB</div>`;
            }
            if (status.partition && status.partition.name) {
                tooltip += `<div class="text-xs">Partição: ${status.partition.name}</div>`;
            }
            
            // Add allocation-specific information
            if (status.file && status.file.allocationInfo) {
                switch (status.file.allocationInfo.type) {
                    case 'contiguous':
                        if (status.file.allocatedBlocks) {
                            const position = status.file.allocatedBlocks.indexOf(blockIndex) + 1;
                            tooltip += `<div class="text-xs text-green-300">Alocação: Contígua</div>`;
                            tooltip += `<div class="text-xs text-green-300">Posição: ${position}/${status.file.allocationInfo.totalBlocks}</div>`;
                        }
                        break;
                        
                    case 'linked':
                        // Find next block in chain
                        if (status.file.allocatedBlocks) {
                            const currentIndex = status.file.allocatedBlocks.indexOf(blockIndex);
                            const nextBlock = currentIndex < status.file.allocatedBlocks.length - 1 
                                ? status.file.allocatedBlocks[currentIndex + 1] 
                                : null;
                            tooltip += `<div class="text-xs text-yellow-300">Alocação: Encadeada</div>`;
                            tooltip += `<div class="text-xs text-yellow-300">Próximo: ${nextBlock || 'Último'}</div>`;
                        }
                        break;
                        
                    case 'indexed':
                        if (blockIndex === status.file.allocationInfo.indexBlock) {
                            tooltip += `<div class="text-xs text-purple-300">Bloco de Índice</div>`;
                            if (status.file.allocationInfo.fileBlocks) {
                                tooltip += `<div class="text-xs text-purple-300">Ponteiros: ${status.file.allocationInfo.fileBlocks.join(', ')}</div>`;
                            }
                        } else if (status.file.allocationInfo.fileBlocks) {
                            const dataIndex = status.file.allocationInfo.fileBlocks.indexOf(blockIndex);
                            tooltip += `<div class="text-xs text-purple-300">Alocação: Indexada</div>`;
                            tooltip += `<div class="text-xs text-purple-300">Dados: Bloco ${dataIndex + 1}/${status.file.allocationInfo.fileBlocks.length}</div>`;
                        }
                        break;
                }
            }
            break;
            
        case 'directory':
            tooltip += `<div class="text-yellow-300">Diretório</div>`;
            if (status.directory && status.directory.name) {
                tooltip += `<div class="text-xs">Nome: ${status.directory.name}</div>`;
                tooltip += `<div class="text-xs">Caminho: ${status.directory.fullPath}</div>`;
                
                // Show contained files/directories
                const disk = globalState.getDisk();
                const currentPath = status.directory.fullPath;
                const filesInDir = disk.files.filter(f => f.directoryPath === currentPath);
                const dirsInDir = disk.directories.filter(d => d.parentPath === currentPath);
                
                if (filesInDir.length > 0 || dirsInDir.length > 0) {
                    tooltip += `<div class="text-xs mt-1">Conteúdo:</div>`;
                    if (dirsInDir.length > 0) {
                        tooltip += `<div class="text-xs">${dirsInDir.length} diretório(s)</div>`;
                    }
                    if (filesInDir.length > 0) {
                        tooltip += `<div class="text-xs">${filesInDir.length} arquivo(s)</div>`;
                    }
                } else {
                    tooltip += `<div class="text-xs">Diretório vazio</div>`;
                }
            }
            if (status.partition && status.partition.name) {
                tooltip += `<div class="text-xs">Partição: ${status.partition.name}</div>`;
            }
            break;
    }
    
    tooltip += '</div>';
    return tooltip;
}

export function updateBlockStatus(blockIndex, status, options = {}) {
    const disk = globalState.getDisk();
    if (!disk.blocks || !disk.blocks[blockIndex]) return;
    
    const block = disk.blocks[blockIndex];
    block.dataset.status = status;
    
    if (options.partitionId !== undefined) {
        block.dataset.partitionId = options.partitionId;
    }
    if (options.partitionName !== undefined) {
        block.dataset.partitionName = options.partitionName;
    }
    if (options.nextBlock !== undefined) {
        block.dataset.nextBlock = options.nextBlock;
    }
    if (options.indexedBlocks !== undefined) {
        block.dataset.indexedBlocks = options.indexedBlocks;
    }
}

export function updateSpaceManagementVisualizer() {
    const visualizerContainer = document.getElementById('space-management-visualizer');
    if (!visualizerContainer) return;
    console.log("Updating free space visualization")

    const selectedPartition = globalState.getSelectedPartition();
    
    if (!selectedPartition) {
        visualizerContainer.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <p class="text-lg mb-2">Demonstração do método de gerenciamento de espaço</p>
                <p class="text-sm">Selecione uma partição para ver como o espaço livre é gerenciado</p>
            </div>
        `;
        return;
    }

    visualizerContainer.innerHTML = '';

    // Create header with partition info
    const header = document.createElement('div');
    header.className = 'mb-4 p-2 bg-primary/10 rounded-lg';
    header.innerHTML = `
        <h3 class="font-bold text-lg">${selectedPartition.spaceManagementMethod === 'bitmap' ? 'Bitmap' : 'Lista de Blocos Livres'}</h3>
    `;
    visualizerContainer.appendChild(header);

    if (selectedPartition.spaceManagementMethod === 'bitmap') {
        renderBitmapVisualization(selectedPartition, visualizerContainer);
    } else if (selectedPartition.spaceManagementMethod === 'freeBlockList') {
        renderFreeBlockListVisualization(selectedPartition, visualizerContainer);
    }
}

function renderBitmapVisualization(partition, container) {
    const bitmap = bitMap(partition);
    
    const content = document.createElement('div');
    content.className = 'space-y-4';
    
    // Legend
    const legend = document.createElement('div');
    legend.className = 'flex justify-center gap-4 mb-4';
    legend.innerHTML = `
        <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-success rounded border"></div>
            <span class="text-sm">0 = Livre</span>
        </div>
        <div class="flex items-center gap-2">
            <div class="w-4 h-4 bg-error rounded border"></div>
            <span class="text-sm">1 = Usado</span>
        </div>
    `;
    content.appendChild(legend);
    
    // Bitmap visualization
    const bitmapContainer = document.createElement('div');
    bitmapContainer.className = 'max-h-64 overflow-y-auto p-4 bg-base-200 rounded-lg';
    
    const bitmapGrid = document.createElement('div');
    bitmapGrid.className = 'flex flex-wrap gap-1';
    
    bitmap.forEach((bit, index) => {
        const actualBlockIndex = partition.startBlock + index;
        const bitElement = document.createElement('div');
        bitElement.className = `w-4 h-4 rounded-sm border border-gray-200 m-0.5 flex items-center justify-center text-xs font-mono ${
            bit === 0 ? 'bg-success text-white' : 'bg-error text-white'
        }`;
        bitElement.textContent = bit;
        bitElement.title = `Bloco ${actualBlockIndex}: ${bit === 0 ? 'Livre' : 'Usado'}`;
        bitmapGrid.appendChild(bitElement);
    });
    
    bitmapContainer.appendChild(bitmapGrid);
    content.appendChild(bitmapContainer);
    
    // Statistics
    const stats = document.createElement('div');
    stats.className = 'mt-4 p-3 bg-base-300 rounded-lg';
    const freeBlocks = bitmap.filter(bit => bit === 0).length;
    const usedBlocks = bitmap.filter(bit => bit === 1).length;
    stats.innerHTML = `
        <div class="text-center">
            <div class="flex justify-around">
                <span class="text-success">Livres: ${freeBlocks}</span>
                <span class="text-error">Usados: ${usedBlocks}</span>
                <span>Total: ${bitmap.length}</span>
            </div>
        </div>
    `;
    content.appendChild(stats);
    
    container.appendChild(content);
}

function renderFreeBlockListVisualization(partition, container) {
    const freeBlocks = freeBlockList(partition);
    
    const content = document.createElement('div');
    content.className = 'space-y-4';
    
    // Free blocks list
    const listContainer = document.createElement('div');
    listContainer.className = 'max-h-64 overflow-y-auto p-4 bg-base-200 rounded-lg';
    
    if (freeBlocks.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center text-base-100 py-8">
                <p class="text-lg">Nenhum bloco livre</p>
                <p class="text-sm">Todos os blocos da partição estão sendo utilizados</p>
            </div>
        `;
    } else {
        const listGrid = document.createElement('div');
        listGrid.className = 'flex flex-wrap gap-2';
        
        freeBlocks.forEach(blockIndex => {
            const blockElement = document.createElement('div');
            blockElement.className = 'p-2 bg-success text-white rounded text-center font-mono text-sm';
            blockElement.textContent = blockIndex;
            blockElement.title = `Bloco livre: ${blockIndex}`;
            listGrid.appendChild(blockElement);
        });
        
        listContainer.appendChild(listGrid);
    }
    
    content.appendChild(listContainer);
    
    // Statistics
    const stats = document.createElement('div');
    stats.className = 'mt-4 p-2 bg-base-300 rounded-lg';
    const totalBlocks = partition.totalBlocks;
    const usedBlocks = totalBlocks - freeBlocks.length;
    stats.innerHTML = `
        <div class="text-center">
            <div class="flex justify-around">
                <span class="text-success">Blocos Livres: ${freeBlocks.length}</span>
                <span class="text-error">Blocos Usados: ${usedBlocks}</span>
                <span>Total: ${totalBlocks}</span>
            </div>
        </div>
    `;
    content.appendChild(stats);
    
    container.appendChild(content);
}

export function updatePathDisplay() {
    const selectedPartition = globalState.getSelectedPartition();
    const pathElem = document.getElementById('file-browser-path');
    const backButton = document.getElementById('back-to-parent');
    
    if (!pathElem) return;
    
    if (!selectedPartition) {
        pathElem.textContent = 'Nenhuma partição selecionada';
        if (backButton) backButton.style.display = 'none';
        return;
    }
    
    const currentPath = globalState.getCurrentPath();
    pathElem.textContent = `${selectedPartition.name}:${currentPath}`;
    
    // Show/hide back button based on current path
    if (backButton) {
        backButton.style.display = currentPath === '/' ? 'none' : 'flex';
    }
}

export function updateFileBrowserSidebar() {
    const selectedPartition = globalState.getSelectedPartition();
    const sidebarElem = document.getElementById('file-browser-sidebar');
    
    if (!sidebarElem) return;
    
    if (!selectedPartition) {
        sidebarElem.innerHTML = '<li><span class="text-gray-500 text-sm">Selecione uma partição</span></li>';
        return;
    }
    
    // Get all directories in the partition
    const allDirectories = globalState.getDirectoriesInPartition(selectedPartition.id);
    const currentPath = globalState.getCurrentPath();
    
    // Build directory tree structure
    const tree = buildDirectoryTree(allDirectories);
    
    // Render the tree
    sidebarElem.innerHTML = '';
    
    // Add root entry
    const rootLi = document.createElement('li');
    const isRootActive = currentPath === '/';
    rootLi.innerHTML = `
        <a class="${isRootActive ? 'active' : ''}" onclick="navigateToPath('/')" style="cursor: pointer;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-home"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
            ${selectedPartition.name}
        </a>
    `;
    sidebarElem.appendChild(rootLi);
    
    // Add directories if any exist
    if (tree.children.length > 0) {
        const treeUl = document.createElement('ul');
        renderDirectoryTreeRecursive(tree.children, treeUl, currentPath);
        rootLi.appendChild(treeUl);
    }
}

function buildDirectoryTree(directories) {
    const tree = { path: '/', children: [] };
    const pathMap = { '/': tree };
    
    // Sort directories by path depth to ensure parents are processed first
    const sortedDirs = directories.sort((a, b) => a.parentPath.split('/').length - b.parentPath.split('/').length);
    
    sortedDirs.forEach(dir => {
        const parentNode = pathMap[dir.parentPath] || tree;
        const dirNode = {
            name: dir.name,
            path: dir.fullPath,
            children: []
        };
        
        parentNode.children.push(dirNode);
        pathMap[dir.fullPath] = dirNode;
    });
    
    return tree;
}

function renderDirectoryTreeRecursive(nodes, parentUl, currentPath) {
    nodes.forEach(node => {
        const li = document.createElement('li');
        const isActive = currentPath === node.path;
        
        if (node.children.length > 0) {
            // Directory with children - create collapsible
            const isExpanded = currentPath.startsWith(node.path);
            li.innerHTML = `
                <details ${isExpanded ? 'open' : ''}>
                    <summary class="${isActive ? 'active' : ''}" onclick="navigateToPath('${node.path}')" style="cursor: pointer;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-folder"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2l5 0 2 3h9a2 2 0 0 1 2 2z"></path></svg>
                        ${node.name}
                    </summary>
                </details>
            `;
            
            const nestedUl = document.createElement('ul');
            renderDirectoryTreeRecursive(node.children, nestedUl, currentPath);
            li.querySelector('details').appendChild(nestedUl);
        } else {
            // Directory without children
            li.innerHTML = `
                <a class="${isActive ? 'active' : ''}" onclick="navigateToPath('${node.path}')" style="cursor: pointer;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-folder"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2l5 0 2 3h9a2 2 0 0 1 2 2v2"></path></svg>
                    ${node.name}
                </a>
            `;
        }
        
        parentUl.appendChild(li);
    });
}

// Modal update functions
export function updateModalInfo() {
    updateInternalFragmentationModal();
    updateDiskModal();
    updateBlocksModal();
}

export function updateBlocksModal() {
    const diskConfig = globalState.getDiskConfig();
    const disk = globalState.getDisk();
    
    // Calculate block usage
    const usedBlocks = disk.partitions.reduce((sum, partition) => sum + partition.usedBlocks, 0);
    const totalBlocks = diskConfig.blockQuantity || 1;
    const blockUsagePercent = ((usedBlocks / totalBlocks) * 100).toFixed(2);
    
    // Update modal elements
    const modalBlocksQuantity = document.getElementById('modal-blocks-quantity');
    const modalBlocksSize = document.getElementById('modal-blocks-size');
    const modalBlocksUsed = document.getElementById('modal-blocks-used');
    const modalBlocksUsagePercent = document.getElementById('modal-blocks-usage-percent');
    const modalBlocksProgress = document.getElementById('modal-blocks-progress');
    const modalBlocksProgressText = document.getElementById('modal-blocks-progress-text');
    
    if (modalBlocksQuantity) {
        modalBlocksQuantity.textContent = totalBlocks.toString();
    }
    
    if (modalBlocksSize) {
        modalBlocksSize.textContent = `${diskConfig.blockSize} KB`;
    }
    
    if (modalBlocksUsed) {
        modalBlocksUsed.textContent = usedBlocks.toString();
    }
    
    if (modalBlocksUsagePercent) {
        modalBlocksUsagePercent.textContent = `${blockUsagePercent}% do total`;
    }
    
    if (modalBlocksProgress) {
        modalBlocksProgress.value = parseFloat(blockUsagePercent);
    }
    
    if (modalBlocksProgressText) {
        modalBlocksProgressText.textContent = `${blockUsagePercent}%`;
    }
}

export function updateInternalFragmentationModal() {
    const diskConfig = globalState.getDiskConfig();
    const disk = globalState.getDisk();
    
    // Calculate internal fragmentation
    const usedBlocks = disk.partitions.reduce((sum, partition) => sum + partition.usedBlocks, 0);
    const usedSpace = disk.files.reduce((sum, file) => sum + file.sizeInKB, 0);
    const blockSize = diskConfig.blockSize || 1;
    const internalFragmentation = (usedBlocks * blockSize) - usedSpace;
    
    // Update modal elements
    const modalInternalFragmentation = document.getElementById('modal-internal-fragmentation');
    const modalInternalFragmentationPercent = document.getElementById('modal-internal-fragmentation-percent');
    const modalBlockSize = document.getElementById('modal-block-size');
    const modalFilesCount = document.getElementById('modal-files-count');
    
    if (modalInternalFragmentation) {
        modalInternalFragmentation.textContent = `${internalFragmentation} KB`;
    }
    
    if (modalInternalFragmentationPercent) {
        let fragmentationPercent = usedSpace > 0 ? ((internalFragmentation / usedSpace) * 100).toFixed(2) : '0.00';
        modalInternalFragmentationPercent.textContent = `${fragmentationPercent}% do espaço usado`;
    }
    
    if (modalBlockSize) {
        modalBlockSize.textContent = `${blockSize} KB`;
    }
    
    if (modalFilesCount) {
        modalFilesCount.textContent = disk.files.length.toString();
    }
}

export function updateDiskModal() {
    const diskConfig = globalState.getDiskConfig();
    const disk = globalState.getDisk();
    
    // Calculate disk usage
    const usedBlocks = disk.partitions.reduce((sum, partition) => sum + partition.usedBlocks, 0);
    const usedSpace = disk.files.reduce((sum, file) => sum + file.sizeInKB, 0);
    const totalCapacity = diskConfig.totalCapacity || 1;
    const diskUsagePercent = ((usedSpace / totalCapacity) * 100).toFixed(2);
    
    // Update modal elements
    const modalDiskSize = document.getElementById('modal-disk-size');
    const modalDiskUsed = document.getElementById('modal-disk-used');
    const modalDiskUsagePercent = document.getElementById('modal-disk-usage-percent');
    const modalTotalBlocks = document.getElementById('modal-total-blocks');
    const modalBlockSizeDisk = document.getElementById('modal-block-size-disk');
    const modalDiskProgress = document.getElementById('modal-disk-progress');
    const modalDiskProgressText = document.getElementById('modal-disk-progress-text');
    const modalPartitionsList = document.getElementById('modal-partitions-list');
    
    if (modalDiskSize) {
        modalDiskSize.textContent = `${(totalCapacity / 1024).toFixed(2)} MB`;
    }
    
    if (modalDiskUsed) {
        modalDiskUsed.textContent = `${usedSpace} KB`;
    }
    
    if (modalDiskUsagePercent) {
        modalDiskUsagePercent.textContent = `${diskUsagePercent}% utilizado`;
    }
    
    if (modalTotalBlocks) {
        modalTotalBlocks.textContent = diskConfig.blockQuantity.toString();
    }
    
    if (modalBlockSizeDisk) {
        modalBlockSizeDisk.textContent = `${diskConfig.blockSize} KB`;
    }
    
    if (modalDiskProgress) {
        modalDiskProgress.value = parseFloat(diskUsagePercent);
    }
    
    if (modalDiskProgressText) {
        modalDiskProgressText.textContent = `${diskUsagePercent}%`;
    }
    
    // Update partitions list in modal
    if (modalPartitionsList) {
        const partitions = disk.partitions || [];
        
        if (partitions.length === 0) {
            modalPartitionsList.innerHTML = '<div class="text-gray-500 text-sm">Nenhuma partição criada ainda</div>';
        } else {
            modalPartitionsList.innerHTML = partitions.map(partition => {
                const partitionSize = (partition.endBlock - partition.startBlock + 1) * diskConfig.blockSize;
                const usagePercent = partition.getUsagePercentage();
                
                return `
                    <div class="flex items-center justify-between p-2 bg-base-100 rounded border">
                        <div>
                            <div class="font-semibold">${partition.name}</div>
                            <div class="text-sm text-gray-600">
                                Blocos ${partition.startBlock}-${partition.endBlock} | 
                                ${(partitionSize / 1024).toFixed(2)} MB | 
                                ${partition.allocationMethod}
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="text-sm">${usagePercent}% usado</div>
                            <progress class="progress progress-primary w-20" value="${usagePercent}" max="100"></progress>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

// Add event listeners to update modals when they are opened
document.addEventListener('DOMContentLoaded', function() {
    // Update blocks modal when opened
    const blocksModal = document.getElementById('info_blocks');
    if (blocksModal) {
        blocksModal.addEventListener('show', updateBlocksModal);
        // Also listen for when modal becomes visible (DaisyUI specific)
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target === blocksModal && blocksModal.open) {
                    updateBlocksModal();
                }
            });
        });
        observer.observe(blocksModal, { attributes: true, attributeFilter: ['open'] });
    }

    // Update internal fragmentation modal when opened
    const internalFragModal = document.getElementById('info_internal_fragmentation');
    if (internalFragModal) {
        internalFragModal.addEventListener('show', updateInternalFragmentationModal);
        // Also listen for when modal becomes visible (DaisyUI specific)
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target === internalFragModal && internalFragModal.open) {
                    updateInternalFragmentationModal();
                }
            });
        });
        observer.observe(internalFragModal, { attributes: true, attributeFilter: ['open'] });
    }
    
    // Update disk modal when opened
    const diskModal = document.getElementById('info_disk');
    if (diskModal) {
        diskModal.addEventListener('show', updateDiskModal);
        // Also listen for when modal becomes visible (DaisyUI specific)
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target === diskModal && diskModal.open) {
                    updateDiskModal();
                }
            });
        });
        observer.observe(diskModal, { attributes: true, attributeFilter: ['open'] });
    }
});

// Expose functions globally for onclick handlers
window.updateFilesList = updateBrowser;
window.updateBrowser = updateBrowser;
window.updatePathDisplay = updatePathDisplay;
window.navigateToParent = function() {
    globalState.navigateToParent();
    updateBrowser();
    updatePathDisplay();
    updateFileBrowserSidebar();
};
window.navigateToPath = function(path) {
    globalState.setCurrentPath(path);
    updateBrowser();
    updatePathDisplay();
    updateFileBrowserSidebar();
};