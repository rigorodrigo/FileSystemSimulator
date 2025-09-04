import createPartition from '../createPartition.js';
import globalState from '../globalState.js';

function getAvailableBlockRanges() {
    const diskConfig = globalState.getDiskConfig();
    const partitions = globalState.getDisk().partitions || [];
    
    if (!diskConfig.blockQuantity) {
        return [];
    }
    
    const allocated = new Array(diskConfig.blockQuantity).fill(false);
    
    partitions.forEach(partition => {
        for (let i = partition.startBlock; i <= partition.endBlock; i++) {
            allocated[i] = true;
        }
    });
    
    // Find available ranges
    const ranges = [];
    let rangeStart = null;
    
    for (let i = 0; i < allocated.length; i++) {
        if (!allocated[i] && rangeStart === null) {
            rangeStart = i;
        } else if (allocated[i] && rangeStart !== null) {
            ranges.push({ start: rangeStart, end: i - 1 });
            rangeStart = null;
        }
    }
    
    // Add final range if needed
    if (rangeStart !== null) {
        ranges.push({ start: rangeStart, end: allocated.length - 1 });
    }
    
    return ranges;
}

document.addEventListener('DOMContentLoaded', () => {
    const createPartitionForm = document.getElementById('create-partition-form');
    const modal = document.getElementById('create_partition');
    const startBlockInput = document.getElementById('partition-start-block');
    const endBlockInput = document.getElementById('partition-end-block');
    
    function updateValidation() {
        const startBlock = parseInt(startBlockInput.value);
        const endBlock = parseInt(endBlockInput.value);
        
        if (!isNaN(startBlock) && !isNaN(endBlock) && startBlock <= endBlock) {
            const ranges = getAvailableBlockRanges();
            const isValid = ranges.some(range => 
                startBlock >= range.start && endBlock <= range.end
            );
            
            if (isValid) {
                const blocks = endBlock - startBlock + 1;
                const blockSize = globalState.getDiskConfig().blockSize;
                const sizeInMB = ((blocks * blockSize * 1024) / (1024 * 1024)).toFixed(2);
                endBlockInput.setAttribute('placeholder', `${blocks} blocos (${sizeInMB} MB)`);
            } else {
                endBlockInput.setAttribute('placeholder', `Conflito com partições existentes`);
            }
        }
    }
    
    startBlockInput.addEventListener('input', updateValidation);
    endBlockInput.addEventListener('input', updateValidation);
    
    if (createPartitionForm) {
        createPartitionForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            try {
                // Get form inputs by ID
                const nameInput = document.getElementById('partition-name');
                const startBlockInput = document.getElementById('partition-start-block');
                const endBlockInput = document.getElementById('partition-end-block');
                const allocationMethodSelect = document.getElementById('partition-allocation-method');
                const directoryMethodSelect = document.getElementById('partition-directory-method');
                const spaceManagementSelect = document.getElementById('partition-space-management');
                
                // Extract values
                const name = nameInput.value.trim();
                const startBlock = parseInt(startBlockInput.value);
                const endBlock = parseInt(endBlockInput.value);
                const allocationMethod = allocationMethodSelect.value;
                const directoryMethod = directoryMethodSelect.value;
                const spaceManagementMethod = spaceManagementSelect.value;
                
                // Validate basic inputs
                if (!name) {
                    alert('Por favor, digite um nome para a partição');
                    nameInput.focus();
                    return;
                }
                
                if (isNaN(startBlock) || isNaN(endBlock)) {
                    alert('Por favor, digite valores válidos para os blocos inicial e final');
                    return;
                }
                
                if (!allocationMethod || !directoryMethod || !spaceManagementMethod) {
                    alert('Por favor, selecione todos os métodos necessários');
                    return;
                }
                
                createPartition(name, startBlock, endBlock, allocationMethod, directoryMethod, spaceManagementMethod);
                
                createPartitionForm.reset();
                
                modal.close();
                
            } catch (error) {
                alert(`Erro ao criar partição: ${error.message}`);
            }
        });
    }
});
