import globalState from './globalState.js' 

export function bitMap (){

    const blocks = globalState.getDisk().blocks;
    const bitmap = []

    for (const b of blocks) {
        if (b.dataset.status === 'free' ){
            bitmap.push(0);
        }
        else {
            bitmap.push(1);
        }
    }

    return bitmap;
}

export function freeBlockList() {

    const blocks = globalState.getDisk().blocks;
    const list = [];

    for (let i = 0; i < blocks.length(); i++){
        if (blocks[i] === 'free') {
            list.push(i);
        }
    }

    return list;
}