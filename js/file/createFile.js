import globalState from '/js/globalState.js';
import { allocateContiguous, allocateLinked, allocateIndexed } from '/js/disk/createAllocationMethod.js';
import updateAll from '/js/updater.js';

class File {
    constructor(name, sizeInKB, partition) {
        this.id = Date.now() + Math.random();
        this.name = name;
        this.sizeInKB = parseInt(sizeInKB);
        this.partitionId = partition.id;
        this.createdAt = new Date();
        
        // Calculate required blocks
        const blockSize = globalState.getDiskConfig().blockSize;
        this.requiredBlocks = Math.ceil(this.sizeInKB / blockSize);
        
        // Initialize allocation info
        this.allocatedBlocks = [];
        this.allocationInfo = null;
        this.allocationMethod = partition.allocationMethod;
    }

    // Get blocks that belong to this file
    getAllocatedBlocks() {
        return this.allocatedBlocks;
    }

    // Get formatted allocation information for display
    getAllocationInfo() {
        return this.allocationInfo;
    }
}

function validateFileCreation(name, sizeInKB, partition) {
    if (!name || name.trim() === '') {
        throw new Error("Nome do arquivo é obrigatório!");
    }
    
    if (!sizeInKB || isNaN(sizeInKB) || sizeInKB <= 0) {
        throw new Error("Tamanho do arquivo deve ser um número positivo!");
    }
    
    if (!partition) {
        throw new Error("Nenhuma partição selecionada!");
    }

    const blockSize = globalState.getDiskConfig().blockSize;
    const requiredBlocks = Math.ceil(sizeInKB / blockSize);
    
    // Check if partition has enough free space
    const availableBlocks = partition.totalBlocks - partition.usedBlocks;
    if (requiredBlocks > availableBlocks) {
        throw new Error(`Espaço insuficiente! Necessário: ${requiredBlocks} blocos, Disponível: ${availableBlocks} blocos`);
    }
    
    return true;
}

function allocateFileBlocks(file, partition) {
    let allocationResult = null;
    
    switch (partition.allocationMethod) {
        case 'Contígua':
            allocationResult = allocateContiguous(partition, file.requiredBlocks);
            if (allocationResult) {
                file.allocatedBlocks = allocationResult;
                file.allocationInfo = {
                    type: 'contiguous',
                    startBlock: allocationResult[0],
                    endBlock: allocationResult[allocationResult.length - 1],
                    totalBlocks: allocationResult.length
                };
            }
            break;
            
        case 'Encadeada':
            allocationResult = allocateLinked(partition, file.requiredBlocks);
            if (allocationResult) {
                file.allocatedBlocks = allocationResult;
                file.allocationInfo = {
                    type: 'linked',
                    blocks: allocationResult,
                    totalBlocks: allocationResult.length
                };
            }
            break;
            
        case 'Indexada Combinada':
            allocationResult = allocateIndexed(partition, file.requiredBlocks);
            if (allocationResult) {
                file.allocatedBlocks = [allocationResult.indexBlock, ...allocationResult.fileBlocks];
                file.allocationInfo = {
                    type: 'indexed',
                    indexBlock: allocationResult.indexBlock,
                    fileBlocks: allocationResult.fileBlocks,
                    totalBlocks: allocationResult.fileBlocks.length + 1 // +1 for index block
                };
            }
            break;
            
        default:
            throw new Error(`Método de alocação "${partition.allocationMethod}" não implementado!`);
    }
    
    if (!allocationResult) {
        throw new Error("Não foi possível alocar espaço para o arquivo!");
    }
    
    return allocationResult;
}

function updateBlockVisuals(file) {
    const blocks = globalState.getDisk().blocks;
    
    file.allocatedBlocks.forEach((blockIndex, index) => {
        const block = blocks[blockIndex];
        if (block) {
            // Update block appearance
            block.className = 'w-4 h-4 bg-info inline-block rounded-sm border border-gray-200 cursor-pointer';
            block.dataset.status = 'used';
            block.dataset.fileId = file.id;
            block.dataset.fileName = file.name;
            
            // Update tooltip with file information
            const tooltipContent = block.parentElement.querySelector('.tooltip-content');
            if (tooltipContent) {
                let tooltipText = `
                    <div class="text-center">
                        <div class="font-bold text-blue-400">Bloco ${blockIndex}</div>
                        <div class="text-xs text-gray-300">Arquivo: ${file.name}</div>
                        <div class="text-xs text-gray-300">Tamanho: ${file.sizeInKB} KB</div>
                `;
                
                // Add allocation-specific information
                switch (file.allocationInfo.type) {
                    case 'contiguous':
                        tooltipText += `
                            <div class="text-xs text-green-300">Alocação: Contígua</div>
                            <div class="text-xs text-green-300">Posição: ${index + 1}/${file.allocationInfo.totalBlocks}</div>
                        `;
                        break;
                        
                    case 'linked':
                        const nextBlock = block.dataset.nextBlock;
                        tooltipText += `
                            <div class="text-xs text-yellow-300">Alocação: Encadeada</div>
                            <div class="text-xs text-yellow-300">Próximo: ${nextBlock !== '-1' ? nextBlock : 'Último'}</div>
                        `;
                        break;
                        
                    case 'indexed':
                        if (blockIndex === file.allocationInfo.indexBlock) {
                            tooltipText += `
                                <div class="text-xs text-purple-300">Bloco de Índice</div>
                                <div class="text-xs text-purple-300">Ponteiros: ${file.allocationInfo.fileBlocks.join(', ')}</div>
                            `;
                        } else {
                            const dataIndex = file.allocationInfo.fileBlocks.indexOf(blockIndex);
                            tooltipText += `
                                <div class="text-xs text-purple-300">Alocação: Indexada</div>
                                <div class="text-xs text-purple-300">Dados: Bloco ${dataIndex + 1}/${file.allocationInfo.fileBlocks.length}</div>
                            `;
                        }
                        break;
                }
                
                tooltipText += '</div>';
                tooltipContent.innerHTML = tooltipText;
            }
        }
    });
}

function createFile(name, sizeInKB, partition) {
    validateFileCreation(name, sizeInKB, partition);
    
    const file = new File(name, sizeInKB, partition);
    
    allocateFileBlocks(file, partition);
    
    updateBlockVisuals(file);
    
    partition.usedBlocks += file.requiredBlocks;
    
    // Add file to global state
    const disk = globalState.getDisk();
    const files = disk.files || [];
    files.push(file);
    globalState.setDisk({ ...disk, files });
    
    // Update UI
    updateAll();
    
    return file;
}

export default createFile;
export { File, validateFileCreation };
