import globalState from "../globalState";

document.addEventListener('DOMContentLoaded', () => {
    const createFileForm = document.getElementById('create-file-form');

    if (createFileForm) {
        createFileForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const fileNameInput = document.getElementById('file-create-name');
            const fileSizeInput = document.getElementById('file-create-size');

            const fileName = fileNameInput.value.trim();
            const fileSize = parseInt(fileSizeInput.value);

            if (!fileName || isNaN(fileSize) || fileSize <= 0) {
                alert('Por favor, preencha todos os campos corretamente');
                return;
            }

            const selectedPartition = globalState.getSelectedPartition();
            if (!selectedPartition) {
                alert('Nenhuma partição selecionada!');
                return;
            }

            try {
                validateFileCreation(fileName, fileSize, selectedPartition);

                const newFile = new File(fileName, fileSize, selectedPartition);

                allocateFileBlocks(newFile, selectedPartition);

                // Update global state
                const disk = globalState.getDisk();
                disk.files.push(newFile);
                selectedPartition.usedBlocks += newFile.requiredBlocks;

                // Update UI
                updateFilesDisplay();
                updateDiskVisualization();

            } catch (error) {
                alert(error.message);
                return;
            }
            // Reset form and close modal
            createFileForm.reset();
            const create_file_modal = document.getElementById('create_file');
            if (create_file_modal) {
                create_file_modal.close();
            }
        });
    }
});