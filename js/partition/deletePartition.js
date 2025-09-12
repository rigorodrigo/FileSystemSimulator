import globalState from '/js/globalState.js';
import updateAll, { updateBlockStatus } from '/js/updater.js';

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
        
        for (let i = partition.startBlock; i <= partition.endBlock; i++) {
            updateBlockStatus(i, 'unallocated', {
                partitionId: null,
                partitionName: null
            });
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
