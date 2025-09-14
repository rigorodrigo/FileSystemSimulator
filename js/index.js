import { updateSpaceManagementVisualizer } from '/js/updater.js';

document.addEventListener('DOMContentLoaded', () => {
    // Show onboarding modal
    onboarding.showModal();
});

// Listen for partition selection events to update the space management visualizer
document.addEventListener('partitionSelected', (event) => {
    updateSpaceManagementVisualizer();
});
