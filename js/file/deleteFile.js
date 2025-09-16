import globalState from '/js/globalState.js';
import updateAll, { updateBlockStatus } from '/js/updater.js';

function deleteFile(fileId) {
    try {
        const file = globalState.getFileById(fileId);
        if (!file) {
            throw new Error(`Arquivo com ID ${fileId} não encontrado!`);
        }

        const partition = globalState.getDisk().partitions.find(p => p.id == file.partitionId);
        if (!partition) {
            throw new Error(`Partição do arquivo não encontrada!`);
        }

        deallocateFileBlocks(file, partition);

        // Update partition usage
        partition.usedBlocks -= file.requiredBlocks;

        globalState.removeFile(fileId);

        updateAll();

        console.log(`Arquivo "${file.name}" deletado com sucesso!`);
        
    } catch (error) {
        console.error('Erro ao deletar arquivo:', error.message);
        alert(`Erro ao deletar arquivo: ${error.message}`);
    }
}

function deallocateFileBlocks(file, partition) {
    file.allocatedBlocks.forEach(blockIndex => {
        updateBlockStatus(blockIndex, 'free', {
            partitionId: partition.id,
            partitionName: partition.name,
            nextBlock: null
        });
    });

    // Handle specific allocation method cleanup
    // Not needed for contiguous and linked as blocks are freed above
    switch (file.allocationMethod) {
        case 'Contígua':
            break;
            
        case 'Encadeada':
            break;
            
        case 'FAT':
            // TODO
            break;
            
        case 'Indexada':
            // TODO
            break;
            
        default:
            console.warn(`Método de alocação desconhecido: ${file.allocationMethod}`);
    }
}

function confirmDeleteFile(fileId, fileName) {
    window.pendingFileDeleteId = fileId;
    
    const fileNameElement = document.getElementById('delete-file-name');
    if (fileNameElement) {
        fileNameElement.textContent = fileName;
    }
    
    const modal = document.getElementById('delete_file');
    if (modal) {
        modal.showModal();
    }
}

function executeFileDelete() {
    if (window.pendingFileDeleteId) {
        deleteFile(window.pendingFileDeleteId);
        window.pendingFileDeleteId = null;
        
        const modal = document.getElementById('delete_file');
        if (modal) {
            modal.close();
        }
    }
}

// Make functions available globally
window.deleteFile = deleteFile;
window.confirmDeleteFile = confirmDeleteFile;
window.executeFileDelete = executeFileDelete;

export { deleteFile, confirmDeleteFile, executeFileDelete };
