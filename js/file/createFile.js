import globalState from '/js/globalState.js';
import { allocateContiguous, allocateLinked, allocateIndexed } from '/js/disk/createAllocationMethod.js';
import updateAll from '/js/updater.js';

class File {
    constructor(name, sizeInKB, partition) {
        this.id = Date.now() + Math.random();
        this.name = name;
        this.sizeInKB = parseInt(sizeInKB);
        this.partitionId = partition.id;
        this.directoryPath = globalState.getCurrentPath();
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

function validateFileName(name) {
    if (!name || name.trim() === '') {
        throw new Error("Nome do arquivo é obrigatório!");
    }

    // Check for invalid characters in file names
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(name.trim())) {
        throw new Error("Nome do arquivo contém caracteres inválidos. Evite usar: < > : \" / \\ | ? *");
    }

    // Check length
    if (name.trim().length > 255) {
        throw new Error("Nome do arquivo é muito longo. Máximo de 255 caracteres.");
    }

    return true;
}

function validateFileCreation(name, sizeInKB, partition) {
    validateFileName(name);
    
    if (!sizeInKB || isNaN(sizeInKB) || sizeInKB <= 0) {
        throw new Error("Tamanho do arquivo deve ser um número positivo!");
    }
    
    if (!partition) {
        throw new Error("Nenhuma partição selecionada!");
    }

    // Check for duplicate file names in the same directory
    const currentPath = globalState.getCurrentPath();
    const existingFiles = globalState.getFilesInDirectory(partition.id, currentPath);
    const duplicateFile = existingFiles.find(file => 
        file.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicateFile) {
        throw new Error(`Já existe um arquivo com o nome "${name}" neste diretório. Por favor, escolha um nome diferente.`);
    }

    // Check for duplicate names with directories in the same location
    const existingDirectories = globalState.getDirectoriesInPath(partition.id, currentPath);
    const duplicateDirectory = existingDirectories.find(dir => 
        dir.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicateDirectory) {
        throw new Error(`Já existe um diretório com o nome "${name}" neste local. Por favor, escolha um nome diferente.`);
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
            
        case 'Indexada':
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
