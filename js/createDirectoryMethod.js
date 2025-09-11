import globalState from './globalState.js'
import { Directory, createDirectory } from './createDirectory.js'

export function linearDirectoryMethod(partition) {
    if (!partition.rootDirectory) {
        partition.rootDirectory = new Directory('/', 0, partition, [], null, 'Linear');
    }

    if (item instanceof Directory && item.name !== '/') {
        throw new Error("Não é possível criar subdiretórios em um sistema de diretório linear.");
    }
    return partition.rootDirectory;
}

export function twoLevelsDirectoryMethod(partition) {
    if (!partition.rootDirectory) {
        partition.rootDirectory = new Directory('/', 0, partition, [], null, 'Dois Níveis');
    }

    const path = currentPath.split('/').filter(p => p);

    if (item instanceof Directory) {
        if (path.length > 0) {
            throw new Error("Diretórios só podem ser criados na raiz (primero nível) em um sistema de dois níveis.");
        }
        return partition.rootDirectory;
    } else { // É um arquivo
        if (path.length !== 1) {
            throw new Error("Arquivos só podem ser criados dentro de um diretório de usuário.");
        }
        const userDirName = path[0];
        const userDir = partition.rootDirectory.children.find(d => d.name === userDirName && d instanceof Directory);

        if (!userDir) {
            throw new Error(`O diretório de usuário "${userDirName}" não foi encontrado.`);
        }
        return userDir;
    }
}

export function treeDirectoryMethod(partition) {
    if (!partition.rootDirectory) {
        partition.rootDirectory = new Directory('/', 0, partition, [], null, 'Árvore');
    }

    const path = currentPath.split('/').filter(p => p);
    let currentDir = partition.rootDirectory;
    
    for (const p of path) {
        const nextDir = currentDir.children.find(d => d.name === p && d instanceof Directory);
        if (!nextDir) {
            throw new Error(`O diretório "${p}" não foi encontrado no caminho atual.`);
        }
        currentDir = nextDir;
    }

    return currentDir;
}