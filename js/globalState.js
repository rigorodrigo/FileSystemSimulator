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
            files: [],
            directories: []
        };
        
        this.selectedPartition = null;
        this.currentPath = '/';
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

    getFilesInDirectory(partitionId, directoryPath) {
        return this.disk.files.filter(file => 
            file.partitionId === partitionId && file.directoryPath === directoryPath
        );
    }

    addFile(file) {
        this.disk.files.push(file);
    }

    // Directory methods
    getDirectoriesInPartition(partitionId) {
        return this.disk.directories.filter(dir => dir.partitionId === partitionId);
    }

    getDirectoriesInPath(partitionId, directoryPath) {
        return this.disk.directories.filter(dir => {
            return dir.partitionId == partitionId && dir.parentPath === directoryPath;
        });
    }

    addDirectory(directory) {
        this.disk.directories.push(directory);
    }

    removeDirectory(directoryId) {
        const dirIndex = this.disk.directories.findIndex(dir => dir.id == directoryId);
        if (dirIndex !== -1) {
            const removedDir = this.disk.directories.splice(dirIndex, 1)[0];
            return removedDir;
        }
        return null;
    }

    // Path navigation methods
    getCurrentPath() {
        return this.currentPath;
    }

    setCurrentPath(path) {
        this.currentPath = path;
    }

    navigateToDirectory(directoryName) {
        const currentPath = this.currentPath;
        const newPath = currentPath === '/' ? `/${directoryName}` : `${currentPath}/${directoryName}`;
        this.currentPath = newPath;
    }

    navigateToParent() {
        if (this.currentPath === '/') return;
        const pathParts = this.currentPath.split('/').filter(part => part !== '');
        pathParts.pop();
        this.currentPath = pathParts.length === 0 ? '/' : '/' + pathParts.join('/');
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
        const partition = partitions.find(p => p.id === partitionId);
        this.selectedPartition = partition || null;
        // Reset current path when changing partitions
        this.currentPath = '/';
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
            files: [],
            directories: []
        };
        this.selectedPartition = null;
        this.currentPath = '/';
    }
}

const globalState = new GlobalState();
export default globalState;
