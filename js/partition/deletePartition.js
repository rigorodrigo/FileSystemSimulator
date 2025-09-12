import globalState from '/js/globalState.js';
import updateAll from '/js/updater.js';

let partitionToDelete = null;

window.showDeletePartitionModal = function(partitionId) {
    partitionToDelete = parseFloat(partitionId);
    
    const disk = globalState.getDisk();
    const partitions = disk.partitions || [];
    const partition = partitions.find(p => p.id === partitionToDelete);
    
    if (partition) {
        const modal = document.getElementById('delete_partition');
        const modalText = modal.querySelector('p');
        modalText.textContent = `Tem certeza que deseja excluir a partição "${partition.name}"?`;
        
        modal.showModal();
    } else {
        alert('Partição não encontrada');
    }
};

window.confirmDeletePartition = function() {
    if (!partitionToDelete) {
        alert('Nenhuma partição selecionada para exclusão');
        return;
    }
    
    try {
        const disk = globalState.getDisk();
        const partitions = disk.partitions || [];
        
        const partitionIndex = partitions.findIndex(p => p.id === partitionToDelete);
        if (partitionIndex === -1) {
            throw new Error('Partição não encontrada');
        }
        
        const partition = partitions[partitionIndex];
        
        const blocks = disk.blocks || [];
        for (let i = partition.startBlock; i <= partition.endBlock; i++) {
            if (blocks[i]) {
                blocks[i].className = 'w-4 h-4 bg-neutral-content inline-block rounded-sm border border-gray-200 cursor-pointer';
                blocks[i].dataset.status = 'unallocated';
                delete blocks[i].dataset.partitionId;
                delete blocks[i].dataset.partitionName;
                
                const tooltipContent = blocks[i].parentElement.querySelector('.tooltip-content');
                if (tooltipContent) {
                    const blockSize = globalState.getDiskConfig().blockSize;
                    tooltipContent.innerHTML = `
                        <div class="text-center">
                            <div class="font-bold text-gray-400">Bloco ${i}</div>
                            <div class="text-xs text-gray-300">Status: Não Alocado</div>
                        </div>
                    `;
                }
            }
        }
        
        // Remove partition from array
        partitions.splice(partitionIndex, 1);
        
        globalState.setDisk({ partitions: partitions });
        
        const modal = document.getElementById('delete_partition');
        modal.close();
        
        partitionToDelete = null;
        
        updateAll();
        
    } catch (error) {
        alert(`Erro ao excluir partição: ${error.message}`);
        const modal = document.getElementById('delete_partition');
        modal.close();
        partitionToDelete = null;
    }
};
