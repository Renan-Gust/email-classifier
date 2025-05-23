import { saveResult } from './result.js';

export const switchSendModeButtons = document.querySelectorAll("#switch-send button");
export const uploadFileInput = document.querySelector('#file-upload');
export const text = document.querySelector("#send-by-text");
export const submitButton = document.querySelector("#submit");
export const descriptionElement = document.querySelector('#send-by-upload .description');
export const filenameElement = document.querySelector('#send-by-upload .filename');

switchSendModeButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const target = button.getAttribute('data-target');

        switchSendModeButtons.forEach(button => button.classList.remove('send-button-selected'));
        document.querySelectorAll('.send-content').forEach(content => content.classList.add('hidden'));

        button.classList.add('send-button-selected');

        const sendContentTarget = document.querySelector(`#send-by-${target}`);
        sendContentTarget.classList.remove('hidden');
        sendContentTarget.classList.add('block');
    });
});

submitButton.addEventListener('click', async () => {
    const file = uploadFileInput.files[0];

    if (file || text.value.trim() !== ''){
        submitButton.querySelector('span').textContent = '';
        submitButton.querySelector('svg').classList.remove('hidden');

        await submit(file, text);
    }
});

async function submit(file, text){
    const formData = new FormData();

    if (text.value.trim()) {
        formData.append("emailtext", text.value.trim());
    }

    if (file) {
        formData.append("emailfile", file);
    }

    try {
        const response = await fetch("/process", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if(data.success){
            saveResult(data.result);

            uploadFileInput.value = '';
            text.value = '';

            descriptionElement.classList.remove('hidden');
            filenameElement.classList.add('hidden');
            filenameElement.textContent = '';

            submitButton.disabled = true;

            Toastify({
                text: 'Sucesso!',
                close: true,
                style: { background: "green" },
            }).showToast();
        } else{
            Toastify({
                text: data.message,
                close: true,
                style: { background: "red" },
            }).showToast();
        }
    } catch (err) {
        console.log(err);
        Toastify({
            text: 'Ocorreu algum erro interno!',
            close: true,
            style: { background: "red" },
        }).showToast();
    } finally{
        submitButton.querySelector('span').textContent = 'Enviar';
        submitButton.querySelector('svg').classList.add('hidden');
    }
}