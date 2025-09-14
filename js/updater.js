import globalState from '/js/globalState.js';

export default function updateAll() {
    updateStats();
    updatePartitionsList();
    updateBrowser();
    updateDiskBlocks();
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
            <div class="flex justify-between items-center">
                <span class="font-medium">${file.name}</span>
                <button onclick="confirmDeleteFile('${file.id}', '${file.name}')">
                    <svg class="text-error/30 hover:text-error cursor-pointer transition" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
            <div class="text-sm text-gray-600">Tamanho: ${(file.sizeInKB)} KB (${file.allocatedBlocks.length} blocos)</div>
        `;
        fileListElem.appendChild(fileElem);
    });

    if (files.length === 0) {
        fileListElem.innerHTML = '<div class="text-center text-gray-500 py-4">Nenhum arquivo nesta partição</div>';
    }
}

export function updateDiskBlocks() {
    const diskBlocksContainer = document.getElementById('disk-blocks');
    if (!diskBlocksContainer) return;

    const diskConfig = globalState.getDiskConfig();
    const disk = globalState.getDisk();
    
    // Clear existing blocks
    diskBlocksContainer.innerHTML = '';
    
    // If no disk is configured, show message
    if (!diskConfig.blockQuantity) {
        diskBlocksContainer.innerHTML = '<div class="text-center text-gray-500 py-4">Configure o disco primeiro</div>';
        return;
    }

    // Create blocks
    for (let i = 0; i < diskConfig.blockQuantity; i++) {
        const blockWrapper = document.createElement('div');
        blockWrapper.className = 'relative group';
        
        const block = document.createElement('div');
        block.className = getBlockClassName(i);
        block.dataset.blockIndex = i;
        
        // Add tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap';
        tooltip.innerHTML = getBlockTooltip(i);
        
        blockWrapper.appendChild(block);
        blockWrapper.appendChild(tooltip);
        diskBlocksContainer.appendChild(blockWrapper);
    }
    
    // Initialize blocks array in disk if it doesn't exist or if size changed
    if (!disk.blocks || disk.blocks.length !== diskConfig.blockQuantity) {
        disk.blocks = new Array(diskConfig.blockQuantity).fill(null).map((_, index) => ({
            index: index,
            isAllocated: false,
            fileId: null,
            isUsed: false,
            partitionId: null,
            nextBlock: null,
            dataset: {
                status: 'unallocated',
                partitionId: null,
                partitionName: null,
                nextBlock: null,
                indexedBlocks: null
            }
        }));
    }
}

function getBlockClassName(blockIndex) {
    const status = getBlockStatus(blockIndex);
    const baseClass = 'w-4 h-4 inline-block rounded-sm border border-gray-200 cursor-pointer m-0.5';
    
    switch (status.type) {
        case 'unallocated':
            return `${baseClass} bg-neutral-content`;
        case 'free':
            return `${baseClass} bg-success`;
        case 'used':
            return `${baseClass} bg-info`;
        case 'directory':
            return `${baseClass} bg-warning`;
        default:
            return `${baseClass} bg-neutral-content`;
    }
}

function getBlockStatus(blockIndex) {
    const disk = globalState.getDisk();
    const partitions = disk.partitions || [];
    const files = disk.files || [];
    const blocks = disk.blocks || [];
    
    // If blocks array exists and has dataset info, use it
    if (blocks[blockIndex] && blocks[blockIndex].dataset) {
        const blockData = blocks[blockIndex];
        const status = blockData.dataset.status || 'unallocated';
        
        switch (status) {
            case 'used':
                const file = files.find(f => f.allocatedBlocks && f.allocatedBlocks.includes(blockIndex));
                const partition = partitions.find(p => p.id == blockData.dataset.partitionId);
                return { type: 'used', partition, file };
                
            case 'free':
                const freePartition = partitions.find(p => p.id == blockData.dataset.partitionId);
                return { type: 'free', partition: freePartition, file: null };
                
            case 'unallocated':
            default:
                return { type: 'unallocated', partition: null, file: null };
        }
    }
}

function getBlockTooltip(blockIndex) {
    const status = getBlockStatus(blockIndex);
    
    let tooltip = `<div class="text-center"><div class="font-bold">Bloco ${blockIndex}</div>`;
    
    switch (status.type) {
        case 'unallocated':
            tooltip += '<div class="text-gray-300">Não alocado</div>';
            break;
            
        case 'free':
            tooltip += `<div class="text-green-300">Livre</div>`;
            tooltip += `<div class="text-xs">Partição: ${status.partition.name}</div>`;
            break;
            
        case 'used':
            tooltip += `<div class="text-blue-300">Usado</div>`;
            tooltip += `<div class="text-xs">Arquivo: ${status.file.name}</div>`;
            tooltip += `<div class="text-xs">Partição: ${status.partition.name}</div>`;
            tooltip += `<div class="text-xs">Tamanho: ${status.file.sizeInKB} KB</div>`;
            
            // Add allocation-specific information
            if (status.file.allocationInfo) {
                switch (status.file.allocationInfo.type) {
                    case 'contiguous':
                        const position = status.file.allocatedBlocks.indexOf(blockIndex) + 1;
                        tooltip += `<div class="text-xs text-green-300">Alocação: Contígua</div>`;
                        tooltip += `<div class="text-xs text-green-300">Posição: ${position}/${status.file.allocationInfo.totalBlocks}</div>`;
                        break;
                        
                    case 'linked':
                        // Find next block in chain
                        const currentIndex = status.file.allocatedBlocks.indexOf(blockIndex);
                        const nextBlock = currentIndex < status.file.allocatedBlocks.length - 1 
                            ? status.file.allocatedBlocks[currentIndex + 1] 
                            : null;
                        tooltip += `<div class="text-xs text-yellow-300">Alocação: Encadeada</div>`;
                        tooltip += `<div class="text-xs text-yellow-300">Próximo: ${nextBlock || 'Último'}</div>`;
                        break;
                        
                    case 'indexed':
                        if (blockIndex === status.file.allocationInfo.indexBlock) {
                            tooltip += `<div class="text-xs text-purple-300">Bloco de Índice</div>`;
                            tooltip += `<div class="text-xs text-purple-300">Ponteiros: ${status.file.allocationInfo.fileBlocks.join(', ')}</div>`;
                        } else {
                            const dataIndex = status.file.allocationInfo.fileBlocks.indexOf(blockIndex);
                            tooltip += `<div class="text-xs text-purple-300">Alocação: Indexada</div>`;
                            tooltip += `<div class="text-xs text-purple-300">Dados: Bloco ${dataIndex + 1}/${status.file.allocationInfo.fileBlocks.length}</div>`;
                        }
                        break;
                }
            }
            break;
            
        case 'directory':
            tooltip += `<div class="text-yellow-300">Diretório</div>`;
            tooltip += `<div class="text-xs">Partição: ${status.partition.name}</div>`;
            break;
    }
    
    tooltip += '</div>';
    return tooltip;
}

export function updateBlockStatus(blockIndex, status, options = {}) {
    const disk = globalState.getDisk();
    if (!disk.blocks || !disk.blocks[blockIndex]) return;
    
    const block = disk.blocks[blockIndex];
    block.dataset.status = status;
    
    if (options.partitionId !== undefined) {
        block.dataset.partitionId = options.partitionId;
    }
    if (options.partitionName !== undefined) {
        block.dataset.partitionName = options.partitionName;
    }
    if (options.nextBlock !== undefined) {
        block.dataset.nextBlock = options.nextBlock;
    }
    if (options.indexedBlocks !== undefined) {
        block.dataset.indexedBlocks = options.indexedBlocks;
    }
}