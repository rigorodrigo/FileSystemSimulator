import globalState from '/js/globalState.js';
import updateAll, { updateBlockStatus } from '/js/updater.js';

function resizeFile(fileId, newSizeInKB) {
    try {
        const file = globalState.getFileById(fileId);
        if (!file) {
            throw new Error(`Arquivo com ID ${fileId} não encontrado!`);
        }

        const partition = globalState.getDisk().partitions.find(p => p.id == file.partitionId);
        if (!partition) {
            throw new Error(`Partição do arquivo não encontrada!`);
        }

        const diskConfig = globalState.getDiskConfig();
        const currentSizeInKB = file.sizeInKB;
        const currentBlocks = file.requiredBlocks || Math.ceil(currentSizeInKB / diskConfig.blockSize);
        const newBlocks = Math.ceil(newSizeInKB / diskConfig.blockSize);

        console.log(`Redimensionando arquivo "${file.name}" de ${currentSizeInKB}KB (${currentBlocks} blocos) para ${newSizeInKB}KB (${newBlocks} blocos)`);

        if (newSizeInKB === currentSizeInKB) {
            throw new Error('O novo tamanho deve ser diferente do tamanho atual!');
        }

        if (newSizeInKB <= 0) {
            throw new Error('O tamanho do arquivo deve ser maior que zero!');
        }

        if (newBlocks > currentBlocks) {
            // Expandindo o arquivo
            resizeFileExpand(file, partition, newSizeInKB, newBlocks, currentBlocks);
        } else {
            // Reduzindo o arquivo
            resizeFileReduce(file, partition, newSizeInKB, newBlocks, currentBlocks);
        }

        updateAll();

        console.log(`Arquivo "${file.name}" redimensionado com sucesso para ${newSizeInKB}KB!`);
        
    } catch (error) {
        console.error('Erro ao redimensionar arquivo:', error.message);
        alert(`Erro ao redimensionar arquivo: ${error.message}`);
    }
}

function resizeFileExpand(file, partition, newSizeInKB, newBlocks, currentBlocks) {
    const blocksNeeded = newBlocks - currentBlocks;
    
    // Check if there are enough free blocks
    if (partition.usedBlocks + blocksNeeded > partition.totalBlocks) {
        throw new Error(`Não há blocos livres suficientes na partição! Necessários: ${blocksNeeded}, disponíveis: ${partition.totalBlocks - partition.usedBlocks}`);
    }

    // Handle different allocation methods
    switch (file.allocationMethod) {
        case 'Contígua':
            expandContiguousFile(file, partition, blocksNeeded);
            break;
            
        case 'Encadeada':
            expandLinkedFile(file, partition, blocksNeeded);
            break;
            
        case 'Indexada':
            expandIndexedFile(file, partition, blocksNeeded);
            break;
            
        default:
            throw new Error(`Método de alocação não suportado: ${file.allocationMethod}`);
    }

    // Update file properties
    file.sizeInKB = newSizeInKB;
    file.requiredBlocks = newBlocks;
    partition.usedBlocks += blocksNeeded;
}

function resizeFileReduce(file, partition, newSizeInKB, newBlocks, currentBlocks) {
    const blocksToFree = currentBlocks - newBlocks;
    
    // Handle different allocation methods
    switch (file.allocationMethod) {
        case 'Contígua':
            reduceContiguousFile(file, partition, blocksToFree);
            break;
            
        case 'Encadeada':
            reduceLinkedFile(file, partition, blocksToFree);
            break;
            
        case 'Indexada':
            reduceIndexedFile(file, partition, blocksToFree);
            break;
            
        default:
            throw new Error(`Método de alocação não suportado: ${file.allocationMethod}`);
    }

    // Update file properties
    file.sizeInKB = newSizeInKB;
    file.requiredBlocks = newBlocks;
    partition.usedBlocks -= blocksToFree;
}

function expandContiguousFile(file, partition, blocksNeeded) {
    const lastBlock = Math.max(...file.allocatedBlocks);
    const disk = globalState.getDisk();
    
    // Check if we can expand contiguously within partition boundaries
    for (let i = 1; i <= blocksNeeded; i++) {
        const nextBlock = lastBlock + i;
        if (nextBlock > partition.endBlock || 
            nextBlock >= disk.blocks.length || 
            disk.blocks[nextBlock].dataset.status !== 'free') {
            throw new Error('Não é possível expandir o arquivo de forma contígua. Não há blocos livres consecutivos suficientes.');
        }
    }
    
    // Allocate the new blocks
    for (let i = 1; i <= blocksNeeded; i++) {
        const newBlock = lastBlock + i;
        file.allocatedBlocks.push(newBlock);
        updateBlockStatus(newBlock, 'used', {
            partitionId: partition.id,
            partitionName: partition.name,
            nextBlock: null
        });
    }
    
    // Update allocation info
    if (file.allocationInfo) {
        file.allocationInfo.endBlock = lastBlock + blocksNeeded;
        file.allocationInfo.totalBlocks = file.allocatedBlocks.length;
    }
}

function expandLinkedFile(file, partition, blocksNeeded) {
    const disk = globalState.getDisk();
    const freeBlocks = [];
    
    // Find free blocks
    for (let i = partition.startBlock; i <= partition.endBlock && freeBlocks.length < blocksNeeded; i++) {
        if (disk.blocks[i].dataset.status === 'free') {
            freeBlocks.push(i);
        }
    }
    
    if (freeBlocks.length < blocksNeeded) {
        throw new Error(`Não há blocos livres suficientes na partição!`);
    }
    
    // Add new blocks to the chain
    freeBlocks.forEach(blockIndex => {
        file.allocatedBlocks.push(blockIndex);
        updateBlockStatus(blockIndex, 'used', {
            partitionId: partition.id,
            partitionName: partition.name,
            nextBlock: null
        });
    });
    
    // Update allocation info
    if (file.allocationInfo) {
        file.allocationInfo.blocks = [...file.allocatedBlocks];
    }
}

function expandIndexedFile(file, partition, blocksNeeded) {
    const disk = globalState.getDisk();
    const freeBlocks = [];
    
    // Find free blocks
    for (let i = partition.startBlock; i <= partition.endBlock && freeBlocks.length < blocksNeeded; i++) {
        if (disk.blocks[i].dataset.status === 'free') {
            freeBlocks.push(i);
        }
    }
    
    if (freeBlocks.length < blocksNeeded) {
        throw new Error(`Não há blocos livres suficientes na partição!`);
    }
    
    // Add new blocks
    freeBlocks.forEach(blockIndex => {
        file.allocatedBlocks.push(blockIndex);
        updateBlockStatus(blockIndex, 'used', {
            partitionId: partition.id,
            partitionName: partition.name,
            nextBlock: null
        });
    });
    
    // Update allocation info
    if (file.allocationInfo && file.allocationInfo.fileBlocks) {
        file.allocationInfo.fileBlocks.push(...freeBlocks);
        
        // Update the index block with new pointers
        const indexBlock = file.allocationInfo.indexBlock;
        updateBlockStatus(indexBlock, 'used', {
            partitionId: partition.id,
            partitionName: partition.name,
            nextBlock: null,
            indexedBlocks: JSON.stringify(file.allocationInfo.fileBlocks)
        });
    }
}

function reduceContiguousFile(file, partition, blocksToFree) {
    // Remove blocks from the end
    const blocksToRemove = file.allocatedBlocks.splice(-blocksToFree, blocksToFree);
    
    // Free the removed blocks
    blocksToRemove.forEach(blockIndex => {
        updateBlockStatus(blockIndex, 'free', {
            partitionId: partition.id,
            partitionName: partition.name,
            nextBlock: null
        });
    });
    
    // Update allocation info
    if (file.allocationInfo) {
        file.allocationInfo.endBlock = Math.max(...file.allocatedBlocks);
        file.allocationInfo.totalBlocks = file.allocatedBlocks.length;
    }
}

function reduceLinkedFile(file, partition, blocksToFree) {
    // Remove blocks from the end
    const blocksToRemove = file.allocatedBlocks.splice(-blocksToFree, blocksToFree);
    
    // Free the removed blocks
    blocksToRemove.forEach(blockIndex => {
        updateBlockStatus(blockIndex, 'free', {
            partitionId: partition.id,
            partitionName: partition.name,
            nextBlock: null
        });
    });
    
    // Update allocation info
    if (file.allocationInfo) {
        file.allocationInfo.blocks = [...file.allocatedBlocks];
    }
}

function reduceIndexedFile(file, partition, blocksToFree) {
    // Remove blocks from the end
    const blocksToRemove = file.allocatedBlocks.splice(-blocksToFree, blocksToFree);
    
    // Free the removed blocks
    blocksToRemove.forEach(blockIndex => {
        updateBlockStatus(blockIndex, 'free', {
            partitionId: partition.id,
            partitionName: partition.name,
            nextBlock: null
        });
    });
    
    // Update allocation info
    if (file.allocationInfo && file.allocationInfo.fileBlocks) {
        // Remove the blocks from fileBlocks array
        blocksToRemove.forEach(blockToRemove => {
            const index = file.allocationInfo.fileBlocks.indexOf(blockToRemove);
            if (index > -1) {
                file.allocationInfo.fileBlocks.splice(index, 1);
            }
        });
        
        // Update the index block with new pointers
        const indexBlock = file.allocationInfo.indexBlock;
        updateBlockStatus(indexBlock, 'used', {
            partitionId: partition.id,
            partitionName: partition.name,
            nextBlock: null,
            indexedBlocks: JSON.stringify(file.allocationInfo.fileBlocks)
        });
    }
}

function confirmResizeFile(fileId, fileName) {
    const file = globalState.getFileById(fileId);
    if (!file) {
        alert('Arquivo não encontrado!');
        return;
    }

    window.pendingFileResizeId = fileId;
    
    // Update modal info
    document.getElementById('resize-file-name').textContent = fileName;
    document.getElementById('resize-file-current-size').textContent = `${file.sizeInKB} KB`;
    document.getElementById('resize-file-current-blocks').textContent = file.requiredBlocks || file.allocatedBlocks?.length || 0;
    
    // Clear previous input
    document.getElementById('file-resize-size').value = '';
    updateResizeInfo();
    
    const modal = document.getElementById('resize_file');
    if (modal) {
        modal.showModal();
    }
}

function updateResizeInfo() {
    const fileId = window.pendingFileResizeId;
    const newSize = parseInt(document.getElementById('file-resize-size').value) || 0;
    
    if (!fileId || newSize <= 0) {
        document.getElementById('resize-new-blocks').textContent = '-';
        document.getElementById('resize-blocks-diff').textContent = '-';
        document.getElementById('resize-warning').style.display = 'none';
        return;
    }
    
    const file = globalState.getFileById(fileId);
    if (!file) return;
    
    const diskConfig = globalState.getDiskConfig();
    const currentBlocks = file.requiredBlocks || file.allocatedBlocks?.length || 0;
    const newBlocks = Math.ceil(newSize / diskConfig.blockSize);
    const diff = newBlocks - currentBlocks;
    
    document.getElementById('resize-new-blocks').textContent = newBlocks;
    
    if (diff > 0) {
        document.getElementById('resize-blocks-diff').textContent = `+${diff} blocos`;
        document.getElementById('resize-blocks-diff').className = 'text-warning';
        document.getElementById('resize-warning').style.display = 'block';
    } else if (diff < 0) {
        document.getElementById('resize-blocks-diff').textContent = `${diff} blocos`;
        document.getElementById('resize-blocks-diff').className = 'text-success';
        document.getElementById('resize-warning').style.display = 'none';
    } else {
        document.getElementById('resize-blocks-diff').textContent = 'Sem alteração';
        document.getElementById('resize-blocks-diff').className = 'text-info';
        document.getElementById('resize-warning').style.display = 'none';
    }
}

function executeFileResize() {
    if (window.pendingFileResizeId) {
        const newSize = parseInt(document.getElementById('file-resize-size').value);
        
        if (!newSize || newSize <= 0) {
            alert('Por favor, insira um tamanho válido!');
            return;
        }
        
        resizeFile(window.pendingFileResizeId, newSize);
        window.pendingFileResizeId = null;
        
        const modal = document.getElementById('resize_file');
        if (modal) {
            modal.close();
        }
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for size input changes
    const resizeSizeInput = document.getElementById('file-resize-size');
    if (resizeSizeInput) {
        resizeSizeInput.addEventListener('input', updateResizeInfo);
    }
    
    // Add form submit handler
    const resizeForm = document.getElementById('resize-file-form');
    if (resizeForm) {
        resizeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            executeFileResize();
        });
    }
});

// Make functions available globally
window.confirmResizeFile = confirmResizeFile;
window.executeFileResize = executeFileResize;
window.resizeFile = resizeFile;

export { resizeFile, confirmResizeFile, executeFileResize };
