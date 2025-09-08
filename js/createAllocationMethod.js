import globalState from './globalState.js'

export function allocateContiguous(partition, requiredBlocks) {

    const blocks = globalState.getDisk().blocks;
    const startBlock = partition.startBlock;
    const endBlock = partition.endBlock;

    let count = 0, firstIndex = -1;

    for (let i = startBlock; i < endBlock; i++) {
        if (blocks[i].dataset.status === 'free') {
            if (count === 0) firstIndex = i;
            count++;
            if (count === requiredBlocks) {
                const allocated = Array.from({ length: requiredBlocks }, (_, index) => firstIndex + index);
                for (const index of allocated) {
                    blocks[index].dataset.status = 'used;'
                }
                return allocated;
            }
        }
        else {
            count = 0;
            firstIndex = -1;
        }
    }

    return null;   // não conseguiu encontrar a quantidade necessária de blocos contíguos
}

export function allocateLinked(partition, requiredBlocks) {

    const blocks = globalState.getDisk().blocks;
    const startBlock = partition.startBlock;
    const endBlock = partition.endBlock;

    const freeBlocks = [];

    for (let i = startBlock; i < endBlock; i++) {

        if (blocks[i].dataset.status === 'free') {
            freeBlocks.push[i];
            if (freeBlocks.length === requiredBlocks) break;
        }
    }

    if (freeBlocks.length < requiredBlocks) return null;

    for (let j = 0; j < freeBlocks.length; j++) {
        const currentIndex = freeBlocks[j];
        if (freeBlocks[j + 1] !== undefined) {
            blocks[currentIndex].dataset.nextBlock = freeBlocks[j + 1];
        } else {
            blocks[currentIndex].dataset.nextBlock = -1;
        }

    }

    for (const index of freeBlocks) {
        blocks[index].dataset.status = 'used';
    }

    return freeBlocks;
}

export function allocateIndexed(partition, requiredBlocks) {

    const blocks = globalState.getDisk().blocks;
    const startBlock = partition.startBlock;
    const endBlock = partition.endBlock;

    const freeBlocks = [];

    for (let i = startBlock; i < endBlock; i++) {
        if (blocks[i] === 'free') freeBlocks.push[i];
    }

    if (freeBlocks.length < requiredBlocks + 1) return null;  // +1 pois precisa de um bloco para o índice

    const indexBlock = freeBlocks[0];
    const fileBlocks = freeBlocks.slice(1, requiredBlocks + 1);

    blocks[indexBlock].dataset.indexedBlocks = JSON.stringify(fileBlocks);

    block[indexBlock].dataset.status = 'used'
    for (const index of fileBlocks) {
        blocks[index].dataset.status = 'used';
    }

    return { indexBlock, fileBlocks };
}