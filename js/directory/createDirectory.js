import globalState from '../globalState.js'
import {linearDirectoryMethod,twoLevelsDirectoryMethod,treeDirectoryMethod} from  '../createDirectoryMethod.js'

export class Directory {
    constructor(name, sizeInKB, partition, children, blockAllocated, directoryMethod) {
        this.name = name;
        this.sizeInKB = sizeInKB;
        this.partition = partition;
        this.children = children || [];
        this.blockAllocated = blockAllocated;
        this.directoryMethod = directoryMethod;
    }


}

function validateDirectoryCreation(name, sizeInKB, partition) {
    if (!name || name.trim() === '') {
        throw new Error('Nome do diretório não pode ser vazio!');
    }
    if (isNaN(sizeInKB) || sizeInKB < 0) {
        throw new Error('Tamanho do diretório deve ser válido!');
    }
    if (!partition) {
        throw new Error("Nenhuma partição selecionada!");
    }

    const blockSize = globalState.getDiskConfig().blockSize;
    const requiredBlocks = Math.ceil(sizeInKB / blockSize);

    const availableBlocks = partition.totalBlocks - partition.usedBlocks;
    if (requiredBlocks > availableBlocks) {
        throw new Error(`Espaço insuficiente! Necessário: ${requiredBlocks} blocos, Disponível: ${availableBlocks} blocos`);
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

        case 'Indexada Combinada':
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

f/*unction directoryMethodSelector(partition) {
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


export function createDirectory(name, sizeInKB, partition, blockAllocated, directoryMethod) {
    validateDirectoryCreation(name, sizeInKB, partition);
    const newDirectory = new Directory(name, sizeInKB, partition, blockAllocated, directoryMethod);
    allocateDirectoryBlocks(newDirectory, partition);
   partition.usedBlocks +=1;
    globalState.addDirectory(newDirectory);

    return newDirectory;
}
