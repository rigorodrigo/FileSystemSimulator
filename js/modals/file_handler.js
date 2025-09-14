import globalState from "/js/globalState.js";
import createFile from "/js/file/createFile.js";

document.addEventListener('DOMContentLoaded', () => {
    const createFileForm = document.getElementById('create-file-form');

    if (createFileForm) {
        createFileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log("Starting File Creation...");

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
                createFile(fileName, fileSize, selectedPartition);
                console.log("File created successfully.");

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