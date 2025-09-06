import createDisk from '../createDisk.js';
import { bitMap, freeBlockList } from '../freeSpaceManager.js';
import globalState from '../globalState.js';
import updateAll from '../updater.js';

document.addEventListener('DOMContentLoaded', () => {
    const formEditBlocks = document.getElementById('form-edit-blocks');

    if (formEditBlocks) {
        formEditBlocks.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(formEditBlocks);
            const data = Object.fromEntries(formData.entries());

            // Extract values
            const blockQuantity = parseInt(data.edit_blocks_quantity);
            const blockSize = parseInt(data.edit_blocks_size);

            if (!blockQuantity || !blockSize) {
                alert('Por favor, preencha todos os campos');
                return;
            }

            globalState.reset();

            globalState.setDiskConfig(blockQuantity, blockSize);

            edit_blocks.close();

            const diskData = createDisk(blockQuantity, blockSize);
            globalState.setDisk({ blocks: diskData.blocks });

            const bitmap = bitMap();
            const freeBlocksList = freeBlockList();

            updateAll();
        });
    }
});