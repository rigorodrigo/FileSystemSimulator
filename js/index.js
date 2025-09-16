import { updateSpaceManagementVisualizer } from '/js/updater.js';
import { initializeBlockVisualization } from '/js/blockVisualization.js';

document.addEventListener('DOMContentLoaded', () => {
    // Show onboarding modal
    onboarding.showModal();
    
    // Initialize block visualization
    initializeBlockVisualization();
});

// Listen for partition selection events to update the space management visualizer
document.addEventListener('partitionSelected', (event) => {
    updateSpaceManagementVisualizer();
});
