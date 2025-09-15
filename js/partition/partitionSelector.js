import globalState from '/js/globalState.js';
import { updateBrowser, updateSpaceManagementVisualizer, updatePathDisplay, updateFileBrowserSidebar } from '/js/updater.js';

class PartitionSelector {
    constructor() {
        this.selectedPartitionElement = null;
        this.init();
    }

    init() {
        this.setupEventDelegation();
    }

    setupEventDelegation() {
        const partitionsContainer = document.getElementById('partitions-list');
        if (partitionsContainer) {
            partitionsContainer.addEventListener('click', (event) => {
                this.handlePartitionClick(event);
            });
        }
    }

    handlePartitionClick(event) {
        // Find the partition element that was clicked
        const partitionElement = event.target.closest('[data-partition-id]');
        
        if (!partitionElement) return;

        const partitionId = partitionElement.dataset.partitionId;
        
        this.selectPartition(partitionId, partitionElement);
    }

    selectPartition(partitionId, partitionElement) {
        globalState.setSelectedPartition(partitionId);

        this.updateVisualFeedback(partitionElement);

        this.updateSelectedPartitionInfo();

        this.dispatchSelectionEvent(partitionId);
    }

    updateVisualFeedback(selectedElement) {
        // Remove selection from previously selected partition
        if (this.selectedPartitionElement) {
            this.selectedPartitionElement.classList.remove('ring-2', 'ring-primary', 'bg-primary/20');
            this.selectedPartitionElement.classList.add('bg-primary/10');
        }

        // Add selection to newly selected partition
        selectedElement.classList.remove('bg-primary/10');
        selectedElement.classList.add('ring-2', 'ring-primary', 'bg-primary/20');

        this.selectedPartitionElement = selectedElement;
    }

    updateSelectedPartitionInfo() {
        const selectedPartition = globalState.getSelectedPartition();
        const partitionFileCreationName = document.getElementById('selected-partition-name');
        const fileBrowserItems = document.getElementById('file-browser-items');

        if (partitionFileCreationName) {
            if (selectedPartition) {
                partitionFileCreationName.textContent = selectedPartition.name;
            } else {
                partitionFileCreationName.textContent = 'Nenhuma partição selecionada';
            }
        }

        updateBrowser();
        updateSpaceManagementVisualizer();
        updatePathDisplay();
        updateFileBrowserSidebar();
    }

    dispatchSelectionEvent(partitionId) {
        const event = new CustomEvent('partitionSelected', {
            detail: { 
                partitionId,
                partition: globalState.getSelectedPartition()
            }
        });
        document.dispatchEvent(event);
    }

    selectPartitionById(partitionId) {
        const partitionElement = document.querySelector(`[data-partition-id="${partitionId}"]`);
        if (partitionElement) {
            this.selectPartition(partitionId, partitionElement);
        }
    }

    clearSelection() {
        if (this.selectedPartitionElement) {
            this.selectedPartitionElement.classList.remove('ring-2', 'ring-primary', 'bg-primary/20');
            this.selectedPartitionElement.classList.add('bg-primary/10');
            this.selectedPartitionElement = null;
        }
        
        globalState.setSelectedPartition(null);
        this.updateSelectedPartitionInfo();
        this.dispatchSelectionEvent(null);
    }

    refreshSelection() {
        const selectedPartition = globalState.getSelectedPartition();
        if (selectedPartition) {
            // Find the partition element again after re-render
            const partitionElement = document.querySelector(`[data-partition-id="${selectedPartition.id}"]`);
            if (partitionElement) {
                this.updateVisualFeedback(partitionElement);
            } else {
                // Partition no longer exists, clear selection
                this.clearSelection();
            }
        }
    }
}

const partitionSelector = new PartitionSelector();

document.addEventListener('partitionsUpdated', () => {
    partitionSelector.refreshSelection();
});

export default partitionSelector;
