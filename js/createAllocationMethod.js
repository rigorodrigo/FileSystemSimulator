import globalState from './globalState.js'

    export function allocateContiguous (partition,requiredBlocks) {

        const blocks = globalState.getDisk().blocks;
        const startBlock = partition.startBlock;
        const endBlock = partition.endBlock;

        let count = 0, firstIndex = -1;

        for (let i = startBlock; i < endBlock; i++) {
            if (blocks[i].dataset.status === 'free') {
                if (count === 0 ) firstIndex = i;
                count ++;
                if (count === requiredBlocks) {
                    return Array.from({length: requiredBlocks}, (_,index) => firstIndex + index);
                }
            }
            else{
                count = 0;
                firstIndex = -1;
            }
        }

        return null;   // não conseguiu encontrar a quantidade necessária de blocos contíguos
    }