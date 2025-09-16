import createDisk from '/js/disk/createDisk.js';
import createPartition from '/js/partition/createPartition.js';
import globalState from '/js/globalState.js';
import updateAll from '/js/updater.js';

document.addEventListener('DOMContentLoaded', () => {
    const onboardingModal = document.getElementById('onboarding');
    const formOnboarding = document.getElementById('form-onboarding');
    
    // Prevent closing modal with Escape
    if (onboardingModal) {
        onboardingModal.addEventListener(`keydown`, (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                // Prevent closing the modal with Escape
            }
        });
    }
    
    // Handle form submission
    if (formOnboarding) {
        formOnboarding.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(formOnboarding);
            const data = Object.fromEntries(formData.entries());

            // Extract values
            const blockQuantity = parseInt(data.onboarding_blocks);
            const blockSize = parseInt(data.onboarding_block_size);
            
            // Partition configuration
            const partitionName = data.onboarding_partition_name || 'Sistema';
            const allocationMethod = data.onboarding_allocation_method;
            const directoryMethod = data.onboarding_directory_method;
            const spaceManagement = data.onboarding_space_management;

            console.log('Block Quantity:', blockQuantity);
            console.log('Block Size (KB):', blockSize);
            console.log('Partition Config:', { partitionName, allocationMethod, directoryMethod, spaceManagement });

            // Validate inputs
            if (!blockQuantity || !blockSize) {
                alert('Por favor, preencha todos os campos do disco');
                return;
            }
            
            if (!partitionName || !allocationMethod || !directoryMethod || !spaceManagement) {
                alert('Por favor, preencha todos os campos da partição');
                return;
            }

            if (blockQuantity < 100 || blockQuantity > 4096) {
                alert('A quantidade de blocos deve estar entre 100 e 4096');
                return;
            }
            
            if (blockSize < 1 || blockSize > 128) {
                alert('O tamanho do bloco deve estar entre 1KB e 128KB');
                return;
            }

            // Store configuration in global state
            globalState.setDiskConfig(blockQuantity, blockSize);

            // Initialize disk
            const diskData = createDisk(blockQuantity, blockSize);
            globalState.setDisk({ blocks: diskData.blocks });

            // Create initial partition using all available space
            try {
                const newPartition = createPartition(
                    partitionName,
                    0, // startBlock
                    blockQuantity - 1, // endBlock  
                    allocationMethod,
                    directoryMethod,
                    spaceManagement
                );
                console.log('Initial partition created:', newPartition);
                
                // Close modal
                onboardingModal.close();
                
                // Update all UI components
                updateAll();
                
            } catch (error) {
                console.error('Error creating initial partition:', error);
                alert('Erro ao criar partição inicial: ' + error.message);
            }
        });
    }
});