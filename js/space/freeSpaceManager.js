import globalState from '/js/globalState.js' 

export function bitMap(partition) {
    const blocks = globalState.getDisk().blocks;
    const bitmap = [];

    for (let i = partition.startBlock; i <= partition.endBlock; i++) {
        if (blocks[i] && blocks[i].dataset.status === 'free') {
            bitmap.push(0);
        } else {
            bitmap.push(1);
        }
    }

    return bitmap;
}

export function freeBlockList(partition) {
    const blocks = globalState.getDisk().blocks;
    const list = [];

    for (let i = partition.startBlock; i <= partition.endBlock; i++){
        if (blocks[i] && blocks[i].dataset.status === 'free') {
            list.push(i);
        }
    }

    return list;
}

export function bitMapForPartition(partition) {
    const blocks = globalState.getDisk().blocks;
    const bitmap = [];

    for (let i = partition.startBlock; i <= partition.endBlock; i++) {
        if (blocks[i] && blocks[i].dataset.status === 'free') {
            bitmap.push(0);
        } else {
            bitmap.push(1);
        }
    }

    return bitmap;
}