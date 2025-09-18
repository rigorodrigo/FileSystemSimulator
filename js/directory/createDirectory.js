import globalState from '/js/globalState.js'
import { allocateContiguous, allocateLinked, allocateIndexed } from '/js/disk/createAllocationMethod.js';
import { updateBlockStatus } from '/js/updater.js';

export class Directory {
    constructor(name, partition, parentPath = '/') {
        this.id = Date.now() + Math.random();
        this.name = name;
        this.partitionId = partition.id;
        this.parentPath = parentPath;
        this.fullPath = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;
        this.createdAt = new Date();
        this.blockAllocated = null;
        
        // Directory always takes at least 1 block
        this.sizeInKB = partition.directoryMethod === 'Linear' ? 
            globalState.getDiskConfig().blockSize : 
            globalState.getDiskConfig().blockSize;
    }
}

function validateDirectoryName(name) {
    if (!name || name.trim() === '') {
        throw new Error('Nome do diretório não pode ser vazio!');
    }

    // Check for invalid characters in directory names
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(name.trim())) {
        throw new Error("Nome do diretório contém caracteres inválidos. Evite usar: < > : \" / \\ | ? *");
    }

    // Check length
    if (name.trim().length > 255) {
        throw new Error("Nome do diretório é muito longo. Máximo de 255 caracteres.");
    }

    return true;
}

function validateDirectoryCreation(name, partition) {
    validateDirectoryName(name);
    
    if (!partition) {
        throw new Error("Nenhuma partição selecionada!");
    }

    // Check for duplicate directory names in the same location (case-insensitive)
    const currentPath = globalState.getCurrentPath();
    const existingDirs = globalState.getDirectoriesInPath(partition.id, currentPath);
    const duplicateDir = existingDirs.find(dir => 
        dir.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicateDir) {
        throw new Error(`Já existe um diretório com o nome "${name}" neste local. Por favor, escolha um nome diferente.`);
    }

    // Check for duplicate names with files in the same directory
    const existingFiles = globalState.getFilesInDirectory(partition.id, currentPath);
    const duplicateFile = existingFiles.find(file => 
        file.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicateFile) {
        throw new Error(`Já existe um arquivo com o nome "${name}" neste diretório. Por favor, escolha um nome diferente.`);
    }

    // Check if there's at least 1 block available
    const availableBlocks = partition.totalBlocks - partition.usedBlocks;
    if (availableBlocks < 1) {
        throw new Error(`Espaço insuficiente! Necessário: 1 bloco, Disponível: ${availableBlocks} blocos`);
    }

    return true;
}

function allocateDirectoryBlocks(directory, partition) {
    let allocationResult = null;

    switch (partition.allocationMethod) {
        case 'Contígua':
            allocationResult = allocateContiguous(partition, 1);
            if (allocationResult) {
                directory.blockAllocated = allocationResult[0];
                // Mark block as directory
                updateBlockStatus(allocationResult[0], 'directory', {
                    partitionId: partition.id,
                    partitionName: partition.name
                });
            }
            break;

        case 'Encadeada':
            allocationResult = allocateLinked(partition, 1);
            if (allocationResult) {
                directory.blockAllocated = allocationResult[0];
                // Mark block as directory
                updateBlockStatus(allocationResult[0], 'directory', {
                    partitionId: partition.id,
                    partitionName: partition.name
                });
            }
            break;

        case 'Indexada':
            allocationResult = allocateIndexed(partition, 1);
            if (allocationResult) {
                // For indexed allocation, allocateIndexed returns { indexBlock, fileBlocks }
                // For directories, we use the indexBlock as the directory block
                directory.blockAllocated = allocationResult.indexBlock;
                // Mark the index block as directory
                updateBlockStatus(allocationResult.indexBlock, 'directory', {
                    partitionId: partition.id,
                    partitionName: partition.name
                });
                // Also mark the data blocks as directory (not 'used') since they belong to the directory
                allocationResult.fileBlocks.forEach(blockIndex => {
                    updateBlockStatus(blockIndex, 'directory', {
                        partitionId: partition.id,
                        partitionName: partition.name
                    });
                });
            }
            break;

        default:
            throw new Error(`Método de alocação "${partition.allocationMethod}" não implementado!`);
    }

    if (!allocationResult) {
        throw new Error("Não foi possível alocar espaço para o diretório!");
    }

    return allocationResult;
}

/*function directoryMethodSelector(partition) {
    switch(partition.directoryMethod) {
        case 'Linear':
            return linearDirectoryMethod(partition);
        case 'Dois Níveis':
            return twoLevelsDirectoryMethod(partition);
        case 'Árvore':
            return treeDirectoryMethod(partition);
        default:
            throw new Error(`Método de diretório "${partition.directoryMethod}" não existe!`);
    }
}*/


export function createDirectory(name, partition) {
    validateDirectoryCreation(name, partition);
    const currentPath = globalState.getCurrentPath();
    const newDirectory = new Directory(name, partition, currentPath);
    allocateDirectoryBlocks(newDirectory, partition);
    partition.usedBlocks += 1;
    globalState.addDirectory(newDirectory);

    return newDirectory;
}
