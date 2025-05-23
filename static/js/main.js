const switchButtons = document.querySelectorAll("#switch-send button");
const uploadFileInput = document.querySelector('#file-upload');
const text = document.querySelector("#send-by-text");
const submitButton = document.querySelector("#submit");

switchButtons.forEach((button) => {
    button.addEventListener('click', () => {
        const target = button.getAttribute('data-target');

        switchButtons.forEach(button => button.classList.remove('send-button-selected'));
        document.querySelectorAll('.send-content').forEach(content => content.classList.add('hidden'));

        button.classList.add('send-button-selected');

        const sendContentTarget = document.querySelector(`#send-by-${target}`);
        sendContentTarget.classList.remove('hidden');
        sendContentTarget.classList.add('block');
    });
});

uploadFileInput.addEventListener('change', () => {
    const file = uploadFileInput.files[0];
    if (!file) return;

    const borderElement = document.querySelector('#send-by-upload label');
    const descriptionElement = document.querySelector('#send-by-upload .description');
    const filenameElement = document.querySelector('#send-by-upload .filename')

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
        console.log(data);

        if(data.success){
            saveResult(data.result);
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
        submitButton.disabled = false;
        submitButton.querySelector('span').textContent = 'Enviar';
        submitButton.querySelector('svg').classList.add('hidden');
    }
}

function saveResult(result){
    const savedResults = JSON.parse(localStorage.getItem('emailResults')) || [];

    savedResults.push(result);
    localStorage.setItem('emailResults', JSON.stringify(savedResults));

    showResults();
}

function showResults(){
    const savedResults = JSON.parse(localStorage.getItem('emailResults'));

    if(savedResults){
        const container = document.querySelector("#results");
        container.innerHTML = '';

        savedResults.map((result, index) => {
            let content;

            if(result.emailtype === 'text'){
                content = result.originalEmail;
            } else{
                const filename = result.originalEmail.split("/").pop();
                content = `<a href="${result.originalEmail}" target="_blank" class="underline text-blue-500">${filename}</a>`;
            }

            container.innerHTML += `
            <div
                class="bg-blue-200 hover:bg-blue-300 w-[265px] md:w-[623px] lg:w-full h-[130px] rounded-lg cursor-pointer transition-all px-4 py-2 overflow-auto lg:overflow-hidden"
                onclick="showCompleteResult(${index})"
            >
                <div class="flex gap-[6px]">
                    <strong class="tracking-wide">Corpo do email: </strong>
                    <span class="tracking-wide truncate block flex-1">${content}</span>
                </div>
                <div>
                    <strong class="tracking-wide">Categoria: </strong>
                    <span class="tracking-wide">${result.category}</span>
                </div>
                <div>
                    <strong class="tracking-wide">Resposta: </strong>
                    <p class="tracking-wide inline">${result.response.substr(0, 150)}...</p>
                </div>
            </div>`;
        });
    }
};
showResults();

function showCompleteResult(index){
    document.querySelectorAll('[aria-hidden]').forEach(item => item.setAttribute('aria-hidden', false));

    const savedResults = JSON.parse(localStorage.getItem('emailResults'));
    const savedResult = savedResults[index];
    
    const emailContent = document.querySelector("#dialog .email-content");
    const category = document.querySelector("#dialog .category");
    const response = document.querySelector("#dialog .response");

    if(savedResult.emailtype === 'text'){
        emailContent.textContent = savedResult.originalEmail
    } else{
        const filename = savedResult.originalEmail.split("/").pop();
        emailContent.innerHTML = `<a href="${savedResult.originalEmail}" target="_blank" class="underline text-blue-500">${filename}</a>`;
    }

    category.textContent = savedResult.category;
    response.textContent = savedResult.response;
}

function closeCompleteResult(event){
    if(event.target.classList.contains('close-modal')){
        document.querySelectorAll('[aria-hidden]').forEach(item => item.setAttribute('aria-hidden', true));
    }
}

async function copyResponse(element){
    const text = element.closest('#dialog').querySelector('.response').textContent;
    await navigator.clipboard.writeText(text);

    Toastify({
        text: 'Copiado!',
        close: true,
        style: { background: "green" },
    }).showToast();
}