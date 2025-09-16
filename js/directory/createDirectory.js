import globalState from '/js/globalState.js'
import { allocateContiguous, allocateLinked, allocateIndexed } from '/js/disk/createAllocationMethod.js';

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

function validateDirectoryCreation(name, partition) {
    if (!name || name.trim() === '') {
        throw new Error('Nome do diretório não pode ser vazio!');
    }
    if (!partition) {
        throw new Error("Nenhuma partição selecionada!");
    }

    // Check if directory name already exists in current path
    const currentPath = globalState.getCurrentPath();
    const existingDirs = globalState.getDirectoriesInPath(partition.id, currentPath);
    if (existingDirs.some(dir => dir.name === name)) {
        throw new Error(`Diretório "${name}" já existe neste local!`);
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
            }
            break;

        case 'Encadeada':
            allocationResult = allocateLinked(partition, 1);
            if (allocationResult) {
                directory.blockAllocated = allocationResult[0];
            }
            break;

        case 'Indexada':
            allocationResult = allocateIndexed(partition, 1);
            if (allocationResult) {
                directory.blockAllocated = allocationResult[0];
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
