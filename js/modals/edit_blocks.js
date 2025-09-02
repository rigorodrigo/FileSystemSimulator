import createDisk from '../createDisk.js';
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

            // Validate inputs
            // TODO
            if (!blockQuantity || !blockSize) {
                alert('Por favor, preencha todos os campos');
                return;
            }

            globalState.reset();

            // Store configuration in global state
            globalState.setDiskConfig(blockQuantity, blockSize);

            // Close modal
            edit_blocks.close();

            // Initialize disk
            createDisk(blockQuantity, blockSize);

            updateAll();
        });
    }
});