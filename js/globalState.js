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
    }
}

// Export a single instance (singleton pattern)
const globalState = new GlobalState();
export default globalState;
