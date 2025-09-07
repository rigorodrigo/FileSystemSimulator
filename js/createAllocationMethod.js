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
                return Array.from({ length: requiredBlocks }, (_, index) => firstIndex + index);
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

    return freeBlocks;
}