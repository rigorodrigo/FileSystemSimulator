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

function createFile(name, sizeInKB, partition) {
    validateFileCreation(name, sizeInKB, partition);
    
    const file = new File(name, sizeInKB, partition);
    
    allocateFileBlocks(file, partition);
    
    partition.usedBlocks += file.requiredBlocks;
    
    globalState.addFile(file);
    
    updateAll();
    
    return file;
}

export default createFile;
export { File, validateFileCreation };
