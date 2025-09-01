import createDisk from './createDisk.js';
import globalState from './globalState.js';
import updateStats from './updater.js';

document.addEventListener('DOMContentLoaded', () => {
    const formOnboarding = document.getElementById('form-onboarding');
    
    if (formOnboarding) {
        formOnboarding.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(formOnboarding);
            const data = Object.fromEntries(formData.entries());

            // Extract values
            const blockQuantity = parseInt(data.onboarding_blocks);
            const blockSize = parseInt(data.onboarding_block_size);

            console.log('Block Quantity:', blockQuantity);
            console.log('Block Size (KB):', blockSize);

            // Validate inputs
            // TODO
            if (!blockQuantity || !blockSize) {
                alert('Por favor, preencha todos os campos');
                return;
            }

            // Store configuration in global state
            globalState.setDiskConfig(blockQuantity, blockSize);

            // Close modal
            onboarding.close();

            // Initialize disk
            createDisk(blockQuantity, blockSize);

            updateStats();
        });
    }
});