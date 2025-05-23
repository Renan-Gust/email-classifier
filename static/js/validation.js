import { uploadFileInput, text, submitButton, descriptionElement, filenameElement } from "./main.js";

uploadFileInput.addEventListener('change', () => {
    const file = uploadFileInput.files[0];
    if (!file) return;

    const borderElement = document.querySelector('#send-by-upload label');

    const filename = file.name.toLowerCase();

    if (!filename.endsWith('.pdf') && !filename.endsWith('.txt')) {
        Toastify({
            text: "Apenas arquivos .pdf ou .txt são permitidos.",
            close: true,
            style: { background: "red" },
        }).showToast();

        borderElement.style = 'border-color: red;';
        uploadFileInput.value = '';

        descriptionElement.classList.remove('hidden');
        filenameElement.classList.add('hidden');
        filenameElement.textContent = '';

        submitButton.disabled = true;
    } else{
        borderElement.style = '';
        descriptionElement.classList.add('hidden');
        filenameElement.classList.remove('hidden');
        filenameElement.textContent = filename;

        submitButton.disabled = false;
    }
});

text.addEventListener('input', () => {
    if(text.value.trim() !== ''){
        submitButton.disabled = false
    } else{
        submitButton.disabled = true
    }
});