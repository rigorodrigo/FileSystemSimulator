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

    // Files methods
    getFilesInPartition(partitionId) {
        return this.disk.files.filter(file => file.partitionId === partitionId);
    }

    addFile(file) {
        this.disk.files.push(file);
    }

    removeFile(fileId) {
        const fileIndex = this.disk.files.findIndex(file => file.id == fileId);
        if (fileIndex !== -1) {
            const removedFile = this.disk.files.splice(fileIndex, 1)[0];
            return removedFile;
        }
        return null;
    }

    getFileById(fileId) {
        return this.disk.files.find(file => file.id == fileId);
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

const globalState = new GlobalState();
export default globalState;
