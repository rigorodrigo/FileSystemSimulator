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
    
    // Check directory method restrictions
    checkDirectoryMethodRestrictions(selectedPartition);
}

// Check and apply directory method restrictions
function checkDirectoryMethodRestrictions(partition) {
    const createButton = document.getElementById('create-directory-button');
    const nameInput = document.getElementById('directory-create-name');
    const restrictionMessage = document.getElementById('directory-restriction-message');
    const currentPath = globalState.getCurrentPath();
    
    if (!createButton || !nameInput) return;
    
    // Clear previous restriction message
    if (restrictionMessage) {
        restrictionMessage.remove();
    }
    
    let isAllowed = true;
    let message = '';
    
    switch (partition.directoryMethod) {
        case 'Linear':
            // Linear method does not allow any directories
            isAllowed = false;
            message = 'O método Linear não permite a criação de diretórios.';
            break;
            
        case 'Dois Níveis':
            // Two-level method only allows directories at root level
            if (currentPath !== '/') {
                isAllowed = false;
                message = 'O método Dois Níveis não permite a criação de diretórios aninhados. Navegue para a raiz (/) para criar diretórios.';
            }
            break;
            
        case 'Árvore':
            // Tree method allows directories at any level
            isAllowed = true;
            break;
            
        default:
            isAllowed = false;
            message = 'Método de diretório desconhecido.';
    }
    
    // Apply restrictions
    createButton.disabled = !isAllowed;
    nameInput.disabled = !isAllowed;
    
    if (!isAllowed) {
        createButton.classList.add('btn-disabled');
        nameInput.classList.add('input-disabled');
        
        // Add restriction message
        const form = document.getElementById('create-directory-form');
        const messageDiv = document.createElement('div');
        messageDiv.id = 'directory-restriction-message';
        messageDiv.className = 'alert alert-warning mt-2';
        messageDiv.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
            <span>${message}</span>
        `;
        form.insertBefore(messageDiv, form.firstChild);
    } else {
        createButton.classList.remove('btn-disabled');
        nameInput.classList.remove('input-disabled');
    }
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
    
    // Validate directory creation based on method
    const validationResult = validateDirectoryCreation(selectedPartition);
    if (!validationResult.isValid) {
        alert(validationResult.message);
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

// Validate directory creation based on partition's directory method
function validateDirectoryCreation(partition) {
    const currentPath = globalState.getCurrentPath();
    
    switch (partition.directoryMethod) {
        case 'Linear':
            return {
                isValid: false,
                message: 'O método Linear não permite a criação de diretórios.'
            };
            
        case 'Dois Níveis':
            if (currentPath !== '/') {
                return {
                    isValid: false,
                    message: 'O método Dois Níveis não permite a criação de diretórios aninhados. Você deve estar na raiz (/) para criar diretórios.'
                };
            }
            return { isValid: true };
            
        case 'Árvore':
            return { isValid: true };
            
        default:
            return {
                isValid: false,
                message: 'Método de diretório desconhecido.'
            };
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
