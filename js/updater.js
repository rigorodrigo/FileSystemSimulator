import globalState from '/js/globalState.js';

export default function updateAll() {
    updateStats();
    updatePartitionsList();
    updateBrowser();
}

export function updateStats() {
    // Update block quantity and disk size from the global stats
    const blockQuantityElem = document.getElementById('stat-global-block-quantity');
    const diskSizeElem = document.getElementById('stat-global-disk-size');
    const blockUsageProgress = document.getElementById('stat-global-block-usage-progress');
    const blockUsageText = document.getElementById('stat-global-block-usage');
    const diskUsageProgress = document.getElementById('stat-global-disk-usage-progress');
    const diskUsageText = document.getElementById('stat-global-disk-usage');
    const filesCounts = document.getElementById('stat-global-files-count');
    const directoriesCounts = document.getElementById('stat-global-directories-count');

    const diskConfig = globalState.getDiskConfig();
    const disk = globalState.getDisk();

    // Calculate used blocks
    const usedBlocks = disk.partitions.reduce((sum, partition) => sum + partition.usedBlocks, 0);
    const totalBlocks = diskConfig.blockQuantity || 1; // Avoid division by zero

    const blockUsagePercent = ((usedBlocks / totalBlocks) * 100).toFixed(2);
    if (blockUsageProgress) {
        blockUsageProgress.value = blockUsagePercent;
    }
    if (blockUsageText) {
        blockUsageText.textContent = `${blockUsagePercent}% usado`;
    }

    const usedSpace = disk.files.reduce((sum, file) => sum + file.sizeInKB, 0);
    const totalSpace = diskConfig.totalCapacity || 1; // Avoid division by zero

    const diskUsagePercent = ((usedSpace / totalSpace) * 100).toFixed(2);
    if (diskUsageProgress) {
        diskUsageProgress.value = diskUsagePercent;
    }
    if (diskUsageText) {
        diskUsageText.textContent = `${diskUsagePercent}% usado`;
    }

    if (blockQuantityElem) {
        blockQuantityElem.textContent = globalState.getDiskConfig().blockQuantity || '0';
    }

    if (diskSizeElem) {
        diskSizeElem.innerHTML = (globalState.getDiskConfig().totalCapacity / 1024).toFixed(2) + "MB" || '0'; // In MB
    }

    if (filesCounts) {
        filesCounts.textContent = disk.files.length || '0';
    }

    // TODO Directories and Links
}

export function updatePartitionsList() {
    const partitionsListElem = document.getElementById('partitions-list');
    if (!partitionsListElem) return;

    const partitions = globalState.getDisk().partitions || [];
    
    partitionsListElem.innerHTML = '';
    
    partitions.forEach((partition) => {
        const partitionElement = createPartitionElement(partition);
        partitionsListElem.appendChild(partitionElement);
    });
    
    if (partitions.length === 0) {
        partitionsListElem.innerHTML = '<div class="text-center text-gray-500 py-4">Nenhuma partição criada ainda</div>';
    }

    // Dispatch event to notify partition selector of updates
    document.dispatchEvent(new CustomEvent('partitionsUpdated'));
}

function createPartitionElement(partition) {
    const div = document.createElement('div');
    div.className = 'border p-2 rounded-lg space-y-2 cursor-pointer hover:bg-primary/15 transition-colors';
    div.dataset.partitionId = partition.id;
    
    const usagePercentage = partition.getUsagePercentage();
    
    div.innerHTML = `
        <span class="font-bold mb-2">${partition.name}</span>

        <div class="flex flex-wrap justify-around gap-2 mt-2">
            <div class="stats shadow">
                <div class="stat text-center p-2">
                    <div class="stat-title flex-1">Blocos</div>
                    <div class="stat-value text-xl">
                        ${partition.startBlock} - ${partition.endBlock}
                    </div>
                    <div class="stat-desc">${partition.totalBlocks} total</div>
                </div>
            </div>

            <div class="stats shadow">
                <div class="stat text-center p-2">
                    <div class="stat-title flex-1">Tamanho</div>
                    <div class="stat-value text-xl">
                        ${partition.sizeInMB.toFixed(2)} MB
                    </div>
                </div>
            </div>

            <div class="stats shadow">
                <div class="stat text-center p-2">
                    <div class="stat-title flex-1">Alocação</div>
                    <div class="stat-value text-xl">
                        ${partition.allocationMethod}
                    </div>
                </div>
            </div>

            <div class="stats shadow">
                <div class="stat text-center p-2">
                    <div class="stat-title flex-1">Diretórios</div>
                    <div class="stat-value text-xl">
                        ${partition.directoryMethod}
                    </div>
                </div>
            </div>

            <div class="stats shadow">
                <div class="stat text-center p-2">
                    <div class="stat-title flex-1">Espaço livre</div>
                    <div class="stat-value text-xl">
                        ${partition.spaceManagementMethod}
                    </div>
                </div>
            </div>
        </div>

        <div>
            <progress class="progress w-full" value="${usagePercentage}" max="100"></progress>
            <div class="flex justify-between">
                <span>${partition.usedBlocks} / ${partition.totalBlocks} blocos utilizados (${usagePercentage}%)</span>
                <button onclick="showDeletePartitionModal('${partition.id}')">
                    <svg class="text-error/30 hover:text-error cursor-pointer transition" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        </div>
    `;
    
    return div;
}


function updateBrowser() {
    // Get the current select partatition and all the related files
    const selectedPartition = globalState.getSelectedPartition();
    if (!selectedPartition) return;

    const files = globalState.getFilesInPartition(selectedPartition.id);

    // Update file list in the UI
    const fileListElem = document.getElementById('file-browser-items');
    if (!fileListElem) return;
    fileListElem.innerHTML = '';

    files.forEach(file => {
        const fileElem = document.createElement('div');
        fileElem.className = 'border p-2 rounded-lg space-y-2 cursor-pointer hover:bg-primary/15 transition-colors max-w-fit max-h-fit';
        fileElem.dataset.fileId = file.id;
        fileElem.innerHTML = `
            <div class="flex justify-between">${file.name}</div>
            <div class="text-sm">Tamanho: ${(file.sizeInKB)} KB (${file.allocatedBlocks.length} blocos)</div>
            <button onclick="deleteFile('${file.id}')" class="text-error hover:underline">Excluir Arquivo</button>
        `;
        fileListElem.appendChild(fileElem);
    });

    if (files.length === 0) {
        fileListElem.innerHTML = '<div class="text-center text-gray-500 py-4">Nenhum arquivo nesta partição</div>';
    }
    
}