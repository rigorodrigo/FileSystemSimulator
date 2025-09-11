// Global state management for the File System Simulator

class GlobalState {
    constructor() {
        this.diskConfig = {
            blockQuantity: null,
            blockSize: null,
            totalCapacity: 0
        };
        
        this.disk = {
            blocks: [],
            partitions: [],
            files: []
        };
        
        this.selectedPartition = null;
    }

    // Disk configuration methods
    setDiskConfig(blockQuantity, blockSize) {
        this.diskConfig.blockQuantity = blockQuantity;
        this.diskConfig.blockSize = blockSize;
        this.diskConfig.totalCapacity = blockQuantity * blockSize;
    }

    getDiskConfig() {
        return this.diskConfig;
    }

    // Disk data methods
    setDisk(diskData) {
        this.disk = { ...this.disk, ...diskData };
    }

    getDisk() {
        return this.disk;
    }

    // Files methos

    // Return all files from a specific partiton
    getFilesInPartition(partitionId) {
        return this.disk.files.filter(file => file.partitionId === partitionId);
    }

    // Partition selection methods
    setSelectedPartition(partitionId) {
        const partitions = this.disk.partitions || [];
        const partition = partitions.find(p => p.id == partitionId);
        this.selectedPartition = partition || null;
    }

    getSelectedPartition() {
        return this.selectedPartition;
    }

    // Reset everything
    reset() {
        this.diskConfig = {
            blockQuantity: null,
            blockSize: null,
            totalCapacity: 0
        };
        this.disk = {
            blocks: [],
            partitions: [],
            files: []
        };
        this.selectedPartition = null;
    }
}

// Export a single instance (singleton pattern)
const globalState = new GlobalState();
export default globalState;
