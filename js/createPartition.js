import globalState from './globalState.js';
import updateAll from './updater.js'

class Partition {
    constructor(name, startBlock, endBlock, allocationMethod, directoryMethod, spaceManagementMethod) {
        this.id = Date.now() + Math.random(); // Simple unique ID
        this.name = name;
        this.startBlock = parseInt(startBlock);
        this.endBlock = parseInt(endBlock);
        this.totalBlocks = this.endBlock - this.startBlock + 1;
        this.allocationMethod = allocationMethod;
        this.directoryMethod = directoryMethod;
        this.spaceManagementMethod = spaceManagementMethod;
        this.usedBlocks = 0;

        const blockSize = globalState.getDiskConfig().blockSize;
        this.sizeInBytes = this.totalBlocks * blockSize * 1024;
        this.sizeInMB = this.sizeInBytes / (1024 * 1024);
    }

    getUsagePercentage() {
        return Math.round((this.usedBlocks / this.totalBlocks) * 100);
    }

}

function validatePartition(name, startBlock, endBlock) {

    if (!name || name.trim() === '') {
        throw new Error("Nome da partição é obrigatório!");
    }
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
    const blocks = disk.blocks;

    for (let i = partition.startBlock; i <= partition.endBlock; i++) {
        if (blocks[i]) {
            blocks[i].className = 'w-4 h-4 bg-success inline-block rounded-sm border border-gray-200 cursor-pointer';
            blocks[i].dataset.status = 'free';
            blocks[i].dataset.partitionId = partition.id;
            blocks[i].dataset.partitionName = partition.name;

            const tooltipContent = blocks[i].parentElement.querySelector('.tooltip-content');
            if (tooltipContent) {
                const blockSize = globalState.getDiskConfig().blockSize;
                tooltipContent.innerHTML = `
                    <div class="text-center">
                        <div class="font-bold text-green-400">Bloco ${i}</div>
                        <div class="text-xs text-gray-300">Status: Livre</div>
                        <div class="text-xs text-gray-300">Partição: ${partition.name}</div>
                    </div>
                `;
            }
        }
    }
}

function createPartition(name, startBlock, endBlock, allocationMethod, directoryMethod, spaceManagementMethod) {
    const disk = globalState.getDisk();
    const existingPartition = disk.partitions || [];

    validatePartition(name, startBlock, endBlock);

    const partition = new Partition(
        name,
        startBlock,
        endBlock,
        allocationMethod,
        directoryMethod,
        spaceManagementMethod
    )

    existingPartition.push(partition);
    globalState.setDisk({ ...disk,partitions: existingPartition });



    updateDiskBlocks(partition);
    updateAll();

    return partition;
}

export default createPartition;
export { Partition, validatePartition};