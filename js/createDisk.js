export default function createDisk(totalBlocks, blockSize) {

    const container = document.getElementById('disk-blocks');
    const blocks = [];

    for (let i = 0 ; i < totalBlocks; i++) {
        const tooltipWrapper = document.createElement('div');
            tooltipWrapper.className = 'tooltip';
                
            const tooltipContent = document.createElement('div');
            tooltipContent.className = 'tooltip-content';
            tooltipContent.innerHTML = `
                <div class="text-center">
                    <div class="font-bold text-green-400">Bloco ${i}</div>
                    <div class="text-xs text-gray-300">Status: Livre</div>
                    <div class="text-xs text-gray-300">Tamanho: ${blockSize}KB</div>
                </div>
                `;
                
                const block = document.createElement('span');
                block.className = 'w-4 h-4 bg-neutral-content inline-block rounded-sm border border-gray-200 cursor-pointer';
                block.dataset.blockId = i;
                block.dataset.status = 'free';

                tooltipWrapper.appendChild(tooltipContent);
                tooltipWrapper.appendChild(block);
                container.appendChild(tooltipWrapper);

                blocks.push(block);

    }

    return {blocks, totalBlocks, blockSize};

}