import globalState from '/js/globalState.js';

// CSS classes for highlighting
const HIGHLIGHT_CLASSES = {
    file: 'ring-4 ring-blue-400 ring-opacity-75 scale-110 transition-all duration-300 z-10 relative shadow-lg',
    directory: 'ring-4 ring-yellow-400 ring-opacity-75 scale-110 transition-all duration-300 z-10 relative shadow-lg',
    directoryChildren: 'ring-4 ring-orange-400 ring-opacity-60 scale-105 transition-all duration-300 z-10 relative shadow-md'
};

// Arrow styles for different allocation methods
const ARROW_STYLES = {
    linked: {
        color: '#3b82f6', // blue
        style: 'solid',
        width: 2
    },
    indexed: {
        color: '#8b5cf6', // purple
        style: 'solid',
        width: 2
    }
};

class BlockVisualization {
    constructor() {
        this.currentHighlights = new Set();
        this.currentArrows = [];
        this.svgContainer = null;
        this.hoverTimeout = null;
        this.currentHoveredBlock = null;
        this.init();
    }

    init() {
        this.createArrowContainer();
        this.attachEventListeners();
        this.setupResizeObserver();
    }

    setupResizeObserver() {
        // Observe changes to the disk blocks container
        if (window.ResizeObserver) {
            this.resizeObserver = new ResizeObserver(() => {
                this.updateSVGSize();
                this.clearArrows(); // Clear arrows on resize to avoid misalignment
            });
            
            const diskBlocksContainer = document.getElementById('disk-blocks');
            if (diskBlocksContainer) {
                this.resizeObserver.observe(diskBlocksContainer);
            }
        }
    }

    createArrowContainer() {
        // Create SVG container for arrows
        const diskBlocksContainer = document.getElementById('disk-blocks');
        if (!diskBlocksContainer) return;

        // Create wrapper if it doesn't exist
        let wrapper = diskBlocksContainer.parentElement.querySelector('.disk-blocks-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'disk-blocks-wrapper relative';
            diskBlocksContainer.parentElement.insertBefore(wrapper, diskBlocksContainer);
            wrapper.appendChild(diskBlocksContainer);
        }

        // Remove existing SVG
        if (this.svgContainer && this.svgContainer.parentNode) {
            this.svgContainer.parentNode.removeChild(this.svgContainer);
        }

        // Create SVG overlay
        this.svgContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svgContainer.setAttribute('class', 'absolute top-0 left-0 w-full h-full pointer-events-none');
        this.svgContainer.style.zIndex = '50';
        this.svgContainer.style.overflow = 'visible';
        this.svgContainer.style.position = 'absolute';
        wrapper.appendChild(this.svgContainer);
        
        // Update SVG size after DOM updates
        setTimeout(() => {
            this.updateSVGSize();
        }, 50);
    }

    updateSVGSize() {
        if (!this.svgContainer) return;
        
        const wrapper = this.svgContainer.parentElement;
        if (wrapper) {
            const rect = wrapper.getBoundingClientRect();
            this.svgContainer.setAttribute('width', rect.width);
            this.svgContainer.setAttribute('height', rect.height);
        }
    }

    attachEventListeners() {
        // Use event delegation for better performance
        document.addEventListener('mouseover', (e) => {
            const block = e.target.closest('[data-block-index]');
            if (block) {
                const blockIndex = parseInt(block.dataset.blockIndex);
                
                // Clear previous timeout
                if (this.hoverTimeout) {
                    clearTimeout(this.hoverTimeout);
                }
                
                // Only update if it's a different block
                if (this.currentHoveredBlock !== blockIndex) {
                    this.currentHoveredBlock = blockIndex;
                    this.handleBlockHover(blockIndex);
                }
            }
        });

        document.addEventListener('mouseout', (e) => {
            const block = e.target.closest('[data-block-index]');
            if (block) {
                // Use timeout to prevent flickering when moving between related blocks
                this.hoverTimeout = setTimeout(() => {
                    this.currentHoveredBlock = null;
                    this.clearHighlights();
                    this.clearArrows();
                }, 50);
            }
        });
    }

    handleBlockHover(blockIndex) {
        this.clearHighlights();
        this.clearArrows();

        const status = this.getBlockStatus(blockIndex);
        
        if (status.type === 'used' && status.file) {
            this.highlightFileBlocks(status.file);
        } else if (status.type === 'directory' && status.directory) {
            this.highlightDirectoryBlocks(status.directory);
        }
    }

    getBlockStatus(blockIndex) {
        const disk = globalState.getDisk();
        const partitions = disk.partitions || [];
        const files = disk.files || [];
        const directories = disk.directories || [];
        const blocks = disk.blocks || [];
        
        if (blocks[blockIndex] && blocks[blockIndex].dataset) {
            const blockData = blocks[blockIndex];
            const status = blockData.dataset.status || 'unallocated';
            
            switch (status) {
                case 'used':
                    const file = files.find(f => f.allocatedBlocks && f.allocatedBlocks.includes(blockIndex));
                    const partition = partitions.find(p => p.id == blockData.dataset.partitionId);
                    return { type: 'used', partition, file };
                    
                case 'directory':
                    // First check if this is the main directory block
                    let directory = directories.find(d => d.blockAllocated === blockIndex);
                    
                    // If not found, check if this is a data block of an indexed directory
                    if (!directory) {
                        directory = directories.find(d => {
                            const dirPartition = partitions.find(p => p.id == d.partitionId);
                            if (dirPartition && dirPartition.allocationMethod === 'Indexada') {
                                const indexBlock = blocks[d.blockAllocated];
                                if (indexBlock && indexBlock.dataset.indexedBlocks) {
                                    try {
                                        const indexedBlocks = JSON.parse(indexBlock.dataset.indexedBlocks);
                                        return indexedBlocks.includes(blockIndex);
                                    } catch (e) {
                                        return false;
                                    }
                                }
                            }
                            return false;
                        });
                    }
                    
                    const dirPartition = partitions.find(p => p.id == blockData.dataset.partitionId);
                    return { type: 'directory', partition: dirPartition, directory, file: null };
                    
                default:
                    return { type: status, partition: null, file: null };
            }
        }
        return { type: 'unallocated', partition: null, file: null };
    }

    highlightFileBlocks(file) {
        if (!file || !file.allocatedBlocks) return;

        // Highlight all blocks of the file
        file.allocatedBlocks.forEach(blockIndex => {
            this.highlightBlock(blockIndex, HIGHLIGHT_CLASSES.file);
        });

        // Draw arrows based on allocation method
        if (file.allocationInfo) {
            switch (file.allocationInfo.type) {
                case 'linked':
                    this.drawLinkedArrows(file);
                    break;
                case 'indexed':
                    this.drawIndexedArrows(file);
                    break;
            }
        }
    }

    highlightDirectoryBlocks(directory) {
        if (!directory) return;

        // Highlight the directory block itself (index block for indexed allocation)
        if (directory.blockAllocated !== null) {
            this.highlightBlock(directory.blockAllocated, HIGHLIGHT_CLASSES.directory);
        }

        // For indexed directories, also highlight the data blocks
        const disk = globalState.getDisk();
        const partitions = disk.partitions || [];
        const dirPartition = partitions.find(p => p.id === directory.partitionId);
        
        if (dirPartition && dirPartition.allocationMethod === 'Indexada' && directory.blockAllocated !== null) {
            const blocks = disk.blocks || [];
            const indexBlock = blocks[directory.blockAllocated];
            if (indexBlock && indexBlock.dataset.indexedBlocks) {
                try {
                    const indexedBlocks = JSON.parse(indexBlock.dataset.indexedBlocks);
                    indexedBlocks.forEach(blockIndex => {
                        this.highlightBlock(blockIndex, HIGHLIGHT_CLASSES.directory);
                    });
                } catch (e) {
                    console.warn('Failed to parse indexed blocks for directory:', e);
                }
            }
        }

        // Get all files and subdirectories in this directory
        const directoryPath = directory.fullPath;
        
        // Find files in this directory
        const filesInDirectory = disk.files.filter(file => 
            file.directoryPath === directoryPath && file.partitionId === directory.partitionId
        );

        // Find subdirectories in this directory
        const subdirectories = disk.directories.filter(dir => 
            dir.parentPath === directoryPath && dir.partitionId === directory.partitionId
        );

        // Highlight blocks of all files in the directory
        filesInDirectory.forEach(file => {
            if (file.allocatedBlocks) {
                file.allocatedBlocks.forEach(blockIndex => {
                    this.highlightBlock(blockIndex, HIGHLIGHT_CLASSES.directoryChildren);
                });
            }
        });

        // Highlight blocks of all subdirectories
        subdirectories.forEach(subdir => {
            if (subdir.blockAllocated !== null) {
                this.highlightBlock(subdir.blockAllocated, HIGHLIGHT_CLASSES.directoryChildren);
                
                // For indexed subdirectories, also highlight their data blocks
                if (dirPartition && dirPartition.allocationMethod === 'Indexada') {
                    const blocks = disk.blocks || [];
                    const indexBlock = blocks[subdir.blockAllocated];
                    if (indexBlock && indexBlock.dataset.indexedBlocks) {
                        try {
                            const indexedBlocks = JSON.parse(indexBlock.dataset.indexedBlocks);
                            indexedBlocks.forEach(blockIndex => {
                                this.highlightBlock(blockIndex, HIGHLIGHT_CLASSES.directoryChildren);
                            });
                        } catch (e) {
                            console.warn('Failed to parse indexed blocks for subdirectory:', e);
                        }
                    }
                }
            }
        });
    }

    highlightBlock(blockIndex, className) {
        const block = document.querySelector(`[data-block-index="${blockIndex}"]`);
        if (block && !this.currentHighlights.has(blockIndex)) {
            block.className += ` ${className}`;
            this.currentHighlights.add(blockIndex);
        }
    }

    clearHighlights() {
        this.currentHighlights.forEach(blockIndex => {
            const block = document.querySelector(`[data-block-index="${blockIndex}"]`);
            if (block) {
                // Remove highlight classes
                Object.values(HIGHLIGHT_CLASSES).forEach(className => {
                    block.classList.remove(...className.split(' '));
                });
            }
        });
        this.currentHighlights.clear();
    }

    drawLinkedArrows(file) {
        if (!file.allocatedBlocks || file.allocatedBlocks.length < 2) return;

        const blocks = file.allocatedBlocks;
        for (let i = 0; i < blocks.length - 1; i++) {
            const fromBlock = blocks[i];
            const toBlock = blocks[i + 1];
            this.drawArrow(fromBlock, toBlock, ARROW_STYLES.linked);
        }
    }

    drawIndexedArrows(file) {
        if (!file.allocationInfo || !file.allocationInfo.fileBlocks) return;

        const indexBlock = file.allocationInfo.indexBlock;
        const fileBlocks = file.allocationInfo.fileBlocks;

        // Draw arrows from index block to each file block
        fileBlocks.forEach(blockIndex => {
            this.drawArrow(indexBlock, blockIndex, ARROW_STYLES.indexed);
        });
    }

    drawArrow(fromBlockIndex, toBlockIndex, style) {
        const fromBlock = document.querySelector(`[data-block-index="${fromBlockIndex}"]`);
        const toBlock = document.querySelector(`[data-block-index="${toBlockIndex}"]`);
        
        if (!fromBlock || !toBlock || !this.svgContainer) return;

        // Update SVG size before drawing
        this.updateSVGSize();

        const fromRect = fromBlock.getBoundingClientRect();
        const toRect = toBlock.getBoundingClientRect();
        const svgRect = this.svgContainer.getBoundingClientRect();

        // Calculate positions relative to the SVG container
        const fromX = fromRect.left - svgRect.left + fromRect.width / 2;
        const fromY = fromRect.top - svgRect.top + fromRect.height / 2;
        const toX = toRect.left - svgRect.left + toRect.width / 2;
        const toY = toRect.top - svgRect.top + toRect.height / 2;

        // Only draw arrow if positions are valid
        if (fromX >= 0 && fromY >= 0 && toX >= 0 && toY >= 0) {
            const arrow = this.createArrowElement(fromX, fromY, toX, toY, style);
            this.svgContainer.appendChild(arrow);
            this.currentArrows.push(arrow);
        }
    }

    createArrowElement(fromX, fromY, toX, toY, style) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Calculate distance and angle
        const dx = toX - fromX;
        const dy = toY - fromY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        // Create curved path for longer arrows
        if (distance > 50) {
            // Control point for curve
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;
            const controlOffset = Math.min(distance * 0.3, 30);
            const controlX = midX + controlOffset * Math.cos(angle + Math.PI / 2);
            const controlY = midY + controlOffset * Math.sin(angle + Math.PI / 2);
            
            // Create curved path
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const pathData = `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`;
            path.setAttribute('d', pathData);
            path.setAttribute('stroke', style.color);
            path.setAttribute('stroke-width', style.width);
            path.setAttribute('stroke-dasharray', style.style === 'dashed' ? '5,5' : '0');
            path.setAttribute('fill', 'none');
            path.setAttribute('opacity', '0.9');
            path.setAttribute('filter', 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))');
            group.appendChild(path);
        } else {
            // Create straight line for short arrows
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', fromX);
            line.setAttribute('y1', fromY);
            line.setAttribute('x2', toX);
            line.setAttribute('y2', toY);
            line.setAttribute('stroke', style.color);
            line.setAttribute('stroke-width', style.width);
            line.setAttribute('stroke-dasharray', style.style === 'dashed' ? '5,5' : '0');
            line.setAttribute('opacity', '0.8');
            group.appendChild(line);
        }

        // Create arrowhead
        const arrowLength = 10;
        const arrowHead = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const arrowPoint1X = toX - arrowLength * Math.cos(angle - Math.PI / 6);
        const arrowPoint1Y = toY - arrowLength * Math.sin(angle - Math.PI / 6);
        const arrowPoint2X = toX - arrowLength * Math.cos(angle + Math.PI / 6);
        const arrowPoint2Y = toY - arrowLength * Math.sin(angle + Math.PI / 6);
        
        arrowHead.setAttribute('points', `${toX},${toY} ${arrowPoint1X},${arrowPoint1Y} ${arrowPoint2X},${arrowPoint2Y}`);
        arrowHead.setAttribute('fill', style.color);
        arrowHead.setAttribute('opacity', '0.8');

        group.appendChild(arrowHead);

        return group;
    }

    clearArrows() {
        this.currentArrows.forEach(arrow => {
            if (arrow.parentNode) {
                arrow.parentNode.removeChild(arrow);
            }
        });
        this.currentArrows = [];
    }

    // Method to reinitialize when blocks are updated
    reinitialize() {
        // Clear any pending timeouts
        if (this.hoverTimeout) {
            clearTimeout(this.hoverTimeout);
            this.hoverTimeout = null;
        }
        
        this.currentHoveredBlock = null;
        this.clearHighlights();
        this.clearArrows();
        this.createArrowContainer();
        
        // Re-observe the container if ResizeObserver is available
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.setupResizeObserver();
        }
    }
}

// Create global instance
let blockVisualization = null;

// Function to initialize block visualization
export function initializeBlockVisualization() {
    if (!blockVisualization) {
        blockVisualization = new BlockVisualization();
    }
    return blockVisualization;
}

// Function to reinitialize when blocks are updated
export function reinitializeBlockVisualization() {
    if (blockVisualization) {
        blockVisualization.reinitialize();
    }
}

// Export for use in other modules
export { blockVisualization };
