from flask import Flask, request, render_template, jsonify
from werkzeug.utils import secure_filename
import os, pdfplumber, nltk, string, requests

nltk.download('punkt')
nltk.download('stopwords')
nltk.download('omw-1.4')

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

headers = {"Authorization": "Bearer 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"}

def preprocess_text(text):
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    tokens = word_tokenize(text)
    stop_words = set(stopwords.words('portuguese'))
    
    filtered_tokens = [word for word in tokens if word not in stop_words]

    return ' '.join(filtered_tokens)

def extract_text_from_pdf(filepath):
    with pdfplumber.open(filepath) as pdf:
        return '\n'.join([page.extract_text() for page in pdf.pages if page.extract_text()])

def classify_email(text):
    url = "https://api-inference.huggingface.co/models/facebook/bart-large-mnli"

    payload = {
        "inputs": text,
        "parameters": {
            "candidate_labels": ["Produtivo", "Improdutivo"]
        }
    }

    response = requests.post(url, headers=headers, json=payload)
    result = response.json()

    return result["labels"][0]

def generate_response(text, category):
    url = "https://api-inference.huggingface.co/models/gpt2"  # ou "distilgpt2"
    headers = {"Authorization": "Bearer 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"}

    prompt = f"O seguinte email foi classificado como '{category}'. Escreva uma resposta curta e objetiva, respondendo adequadamente ao conteúdo abaixo. Email: {text} Resposta:"
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 100,
            "temperature": 0.7,
            "do_sample": True
        }
    }

    response = requests.post(url, headers=headers, json=payload)
    if response.status_code == 200:
        return response.json()[0]["generated_text"]
    else:
        print(f"Erro: {response.status_code} - {response.text}")
        return ""

@app.route('/')
def init():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    text = ''
    emailtype = None
    filename = None
    file_url = None

    if 'emailtext' in request.form and request.form['emailtext'].strip():
        text = request.form['emailtext'].strip()
        emailtype = 'text'
    elif 'emailfile' in request.files:
        file = request.files['emailfile']

        if file and file.filename:
            filename = secure_filename(file.filename)
            ext = os.path.splitext(filename)[1].lower()

            if ext in ['.pdf', '.txt']:
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)

                if ext == '.pdf':
                    text = extract_text_from_pdf(filepath)
                elif ext == '.txt':
                    with open(filepath, 'r', encoding='utf-8') as f:
                        text = f.read()

                emailtype = 'file'
                file_url = f"/static/uploads/{filename}"
            else:
                return jsonify({'success': False, 'message': 'Formato de arquivo não suportado. Envie um .pdf ou .txt'}), 400
        # else:
            # return jsonify({'success': False, 'message': 'Arquivo inválido ou ausente.'}), 400
    else:
        return jsonify({'success': False, 'message': 'Nenhum conteúdo fornecido.'}), 400

    clean_text = preprocess_text(text)
    category = classify_email(clean_text)
    response = generate_response(text, category)

    return jsonify({
        'success': True,
        'result': {
            'emailtype': emailtype,
            'originalEmail': text if emailtype == 'text' else file_url,
            'category': category,
            'response': response
        }
    })

if __name__ == "__main__":
    app.run()