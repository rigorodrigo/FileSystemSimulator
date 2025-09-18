import globalState from '/js/globalState.js';
import updateAll, { updateBlockStatus } from '/js/updater.js';
import { Directory } from '/js/directory/createDirectory.js'

class Partition {
    constructor(name, startBlock, endBlock, allocationMethod, directoryMethod, spaceManagementMethod) {
        this.id = Date.now() + Math.random(); // Simple unique ID
        this.name = name;
        this.startBlock = parseInt(startBlock);
        this.endBlock = parseInt(endBlock);
        this.totalBlocks = this.endBlock - this.startBlock + 1;
        this.allocationMethod = allocationMethod;
        this.directoryMethod = directoryMethod;
        this.rootDirectory = new Directory ('/', 0, this, [], null, directoryMethod);
        this.spaceManagementMethod = spaceManagementMethod; // bitmap or freeBlockList
        this.spaceManagementData = null;
        this.usedBlocks = 0;
        const blockSize = globalState.getDiskConfig().blockSize;
        this.sizeInBytes = this.totalBlocks * blockSize * 1024;
        this.sizeInMB = this.sizeInBytes / (1024 * 1024);

    }

    getUsagePercentage() {
        return Math.round((this.usedBlocks / this.totalBlocks) * 100);
    }

}

function validatePartitionName(name) {
    if (!name || name.trim() === '') {
        throw new Error("Nome da partição é obrigatório!");
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*\x00-\x1f]/;
    if (invalidChars.test(name.trim())) {
        throw new Error("Nome da partição contém caracteres inválidos. Evite usar: < > : \" / \\ | ? *");
    }

    // Check length
    if (name.trim().length > 255) {
        throw new Error("Nome da partição é muito longo. Máximo de 255 caracteres.");
    }

    // Check for duplicate partition names
    const existingPartitions = globalState.getDisk().partitions || [];
    const duplicateName = existingPartitions.find(partition => 
        partition.name.toLowerCase() === name.trim().toLowerCase()
    );
    if (duplicateName) {
        throw new Error(`Já existe uma partição com o nome "${name}". Por favor, escolha um nome diferente.`);
    }

    return true;
}

function validatePartition(name, startBlock, endBlock) {
    validatePartitionName(name);

    if (isNaN(startBlock) || isNaN(endBlock)) {
        throw new Error("Blocos inicial e final devem ser válidos!");
    }

    if (startBlock > endBlock) {
        throw new Error("Bloco final deve ser maior que o bloco inicial")
    }

    const totalBlocks = globalState.getDiskConfig().blockQuantity;
    if (startBlock < 0 || endBlock >= totalBlocks) {
        throw new Error(`Blocos devem estar contidos entre 0 e ${totalBlocks - 1}`)
    }

    // Check for block range conflicts with existing partitions
    const existingPartitions = globalState.getDisk().partitions || [];
    for (const partition of existingPartitions) {
        if ((startBlock >= partition.startBlock && startBlock <= partition.endBlock) ||
            (endBlock >= partition.startBlock && endBlock <= partition.endBlock) ||
            (startBlock <= partition.startBlock && endBlock >= partition.endBlock)) {
            throw new Error(`Os blocos ${startBlock}-${endBlock} conflitam com a partição "${partition.name}" (blocos ${partition.startBlock}-${partition.endBlock})`);
        }
    }

    return true;
}

function updateDiskBlocks(partition) {

    const disk = globalState.getDisk();

    for (let i = partition.startBlock; i <= partition.endBlock; i++) {
        updateBlockStatus(i, 'free', {
            partitionId: partition.id,
            partitionName: partition.name
        });
    }
}

function createPartition(name, startBlock, endBlock, allocationMethod, directoryMethod, spaceManagementMethod) {
    const disk = globalState.getDisk();
    const existingPartitions = disk.partitions || [];

    validatePartition(name, startBlock, endBlock);

    // Pre fill the space management data based on the selected method
    let spaceManagementData = null;
    if (spaceManagementMethod === 'Bitmap') {
        const totalBlocks = endBlock - startBlock + 1;
        spaceManagementData = new Array(totalBlocks).fill(0); // 0 = free, 1 = used
    } else if (spaceManagementMethod === 'Lista de Blocos Livres') {
        spaceManagementData = [];
        for (let i = startBlock; i <= endBlock; i++) {
            spaceManagementData.push(i);
        }
    }
    
    const partition = new Partition(
        name,
        startBlock,
        endBlock,
        allocationMethod,
        directoryMethod,
        spaceManagementMethod
    );

    // Assign the space management data to the partition
    partition.spaceManagementData = spaceManagementData;

    existingPartitions.push(partition);
    globalState.setDisk({ ...disk, partitions: existingPartitions });

    updateDiskBlocks(partition);
    updateAll();

    return partition;
}

export default createPartition;
export { Partition, validatePartition};