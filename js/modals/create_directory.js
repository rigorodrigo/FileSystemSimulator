import globalState from '/js/globalState.js';
import { createDirectory } from '/js/directory/createDirectory.js';
import updateAll from '/js/updater.js';

// Update directory creation modal when opened
function updateDirectoryCreationModal() {
    const selectedPartition = globalState.getSelectedPartition();
    const partitionNameElem = document.getElementById('selected-partition-name-dir');
    const currentPathElem = document.getElementById('current-path-dir');
    
    if (!selectedPartition) {
        partitionNameElem.textContent = 'Nenhuma partição selecionada';
        currentPathElem.textContent = '/';
        return;
    }
    
    partitionNameElem.textContent = selectedPartition.name;
    currentPathElem.textContent = globalState.getCurrentPath();
}

// Handle directory creation form submission
function handleDirectoryCreation(event) {
    event.preventDefault();
    
    const selectedPartition = globalState.getSelectedPartition();
    if (!selectedPartition) {
        alert('Nenhuma partição selecionada!');
        return;
    }
    
    const nameInput = document.getElementById('directory-create-name');
    const directoryName = nameInput.value.trim();
    
    if (!directoryName) {
        alert('Nome do diretório é obrigatório!');
        return;
    }
    
    try {
        createDirectory(directoryName, selectedPartition);
        updateAll();
        
        // Clear form and close modal
        nameInput.value = '';
        document.getElementById('create_directory').close();
    } catch (error) {
        alert('Erro ao criar diretório: ' + error.message);
    }
}

// Set up event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener to form
    const form = document.getElementById('create-directory-form');
    if (form) {
        form.addEventListener('submit', handleDirectoryCreation);
    }
    
    // Update modal when opened
    const modal = document.getElementById('create_directory');
    if (modal) {
        modal.addEventListener('show', updateDirectoryCreationModal);
        
        // Also update when modal becomes visible (for better compatibility)
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'open') {
                    if (modal.hasAttribute('open')) {
                        updateDirectoryCreationModal();
                    }
                }
            });
        });
        observer.observe(modal, { attributes: true });
    }
});

// Also expose the update function globally for onclick handlers
window.updateDirectoryCreationModal = updateDirectoryCreationModal;
