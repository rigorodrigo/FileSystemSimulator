import globalState from './globalState.js';

// Function to update stats in the UI
export default function updateStats() {
    // Update block quantity and disk size from the global stats
    const blockQuantityElem = document.getElementById('stat-global-block-quantity');
    const diskSizeElem = document.getElementById('stat-global-disk-size');

    if (blockQuantityElem) {
        blockQuantityElem.textContent = globalState.getDiskConfig().blockQuantity || '0';
    }

    if (diskSizeElem) {
        diskSizeElem.innerHTML = globalState.getDiskConfig().totalCapacity / 1024 + "MB" || '0'; // In MB
    }
}