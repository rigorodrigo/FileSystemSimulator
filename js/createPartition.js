import globalState from './globalState.js';
import updateAll from './updater.js'

class Partition {

    constructor(name, startBlock, endBlock, allocationMethod, spaceManagementMethod) {
        this.id = Date.now() + Math.random(); // Simple unique ID
        this.name = name;
        this.startBlock = parseInt(startBlock);
        this.endBlock = parseInt(endBlock);
        this.totalBlocks = this.endBlock - this.startBlock + 1;
        this.allocationMethod = allocationMethod;
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

    if (startBlock < 0 || endBlock > totalBlocks) {
        throw new Error(`Blocos devem estar contidos entre 0 e ${totalBlocks - 1}`)
    }

    return true;
}

function updateDiskBlocks(partition) {

    const disk = globalState.getDisk();
    const blocks = disk.blocks;

    for (let i = partition.startBlock; i < partition.endBlock; i++) {
        if (blocks[i]) {
            blocks[i].className = 'w-4 h-4 bg-info inline-block rounded-sm border border-gray-200 cursor-pointer';
            blocks[i].dataset.status = 'allocated';
            blocks[i].dataset.partitionId = partition.id;

            const tooltipContent = blocks[i].parentElement.querySelector('.tooltip-content');
            if (tooltipContent) {
                const blockSize = globalState.getDiskConfig().blockSize;
                tooltipContent.innerHTML = `
                    <div class="text-center">
                        <div class="font-bold text-blue-400">Bloco ${i}</div>
                        <div class="text-xs text-gray-300">Status: Alocado</div>
                        <div class="text-xs text-gray-300">Partição: ${partition.name}</div>
                        <div class="text-xs text-gray-300">Tamanho: ${blockSize}KB</div>
                    </div>
                `;
            }
        }
    }
}

function createPartition(name, startBlock, endBlock, allocationMethod, spaceManagementMethod) {
    const disk = globallState.getDisk();
    const existingPartition = disk.partitions || [];

    validatePartition(name, startBlock, endBlock);

    const partition = new Partition(
        name,
        startBlock,
        endBlock,
        allocationMethod,
        spaceManagementMethod
    )

    existingPartition.push(partition);
    globalState.setDisk({ disk, partitions: existingPartition });



    updateDiskBlocks(partition);
    updateAll();

    return partition;
}