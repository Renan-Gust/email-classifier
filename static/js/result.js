let results = document.querySelectorAll("#results .result");
let closeModal = document.querySelectorAll("#dialog .close-modal");
let copyResponseButton = document.querySelector("#dialog .copy-response");

export function saveResult(result){
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

        savedResults.reverse().map((result) => {
            container.innerHTML += `
            <div
                class="bg-blue-200 hover:bg-blue-300 w-[265px] md:w-[623px] lg:w-full h-[130px] rounded-lg cursor-pointer transition-all px-4 py-2 overflow-auto lg:overflow-hidden result"
            >
                <div class="flex gap-[6px]">
                    <strong class="tracking-wide">Corpo do email: </strong>
                    <span class="tracking-wide truncate block flex-1">${result.originalEmail}</span>
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

    updateElementsFunctions();
}
showResults();

// Adicionar o evento de 'click' nos novos elementos que são inseridos
function updateElementsFunctions(){
    results = document.querySelectorAll("#results .result");
    closeModal = document.querySelectorAll("#dialog .close-modal");
    copyResponseButton = document.querySelector("#dialog .copy-response");

    Array.from(results).reverse().forEach((item, index) => item.addEventListener('click', () => showCompleteResult(index)));
    closeModal.forEach(item => item.addEventListener('click', (event) => closeCompleteResult(event)));
    copyResponseButton.addEventListener("click", (event) => copyResponse(event));
}

function showCompleteResult(index){
    document.querySelectorAll('[aria-hidden]').forEach(item => item.setAttribute('aria-hidden', false));

    const savedResults = JSON.parse(localStorage.getItem('emailResults'));
    const savedResult = savedResults[index];
    
    const emailContent = document.querySelector("#dialog .email-content");
    const category = document.querySelector("#dialog .category");
    const response = document.querySelector("#dialog .response");

    emailContent.textContent = savedResult.originalEmail
    category.textContent = savedResult.category;
    response.textContent = savedResult.response;
}

function closeCompleteResult(event){
    if(event.target.classList.contains('modal-content')){
        document.querySelectorAll('[aria-hidden]').forEach(item => item.setAttribute('aria-hidden', true));
    }
}

async function copyResponse(event){
    const text = event.target.closest('#dialog').querySelector('.response').textContent;
    await navigator.clipboard.writeText(text);

    Toastify({
        text: 'Copiado!',
        close: true,
        style: { background: "green" },
    }).showToast();
}