from flask import Flask, request, render_template, jsonify
from werkzeug.utils import secure_filename
from transformers import pipeline
import os, pdfplumber, nltk, string

nltk.download('punkt')
nltk.download('stopwords')
nltk.download('omw-1.4')

from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'static/uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

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
    classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli", device=0)
    labels = ["Produtivo", "Improdutivo"]

    result = classifier(text, candidate_labels=labels)
    return result["labels"][0]

def generate_response(text, category):
    generator = pipeline("text-generation", model="", device=0)

    prompt = f"O seguinte email foi classificado como '{category}'. Escreva uma resposta curta e objetiva, respondendo adequadamente ao conteúdo abaixo. Email: {text} Resposta:"

    response = generator(prompt, temperature=0.7, do_sample=True)[0]["generated_text"]

    return response.split("Resposta:")[-1].strip()

@app.route('/')
def init():
    return render_template('index.html')

@app.route('/process', methods=['POST'])
def process():
    text = ''
    emailtype = None

    if 'emailtext' in request.form and request.form['emailtext'].strip():
        text = request.form['emailtext']
        emailtype = 'text'

    elif 'emailfile' in request.files:
        file = request.files['emailfile']
        filename = secure_filename(file.filename)

        if filename.lower().endswith('.pdf') or filename.lower().endswith('.txt'):
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)

            if filename.lower().endswith('.pdf'):
                text = extract_text_from_pdf(filepath)
            elif filename.lower().endswith('.txt'):
                with open(filepath, 'r', encoding='utf-8') as f:
                    text = f.read()

            emailtype = 'file'
        else:
            return jsonify({'success': False, 'message': 'Formato de arquivo não suportado. Envie um .pdf ou .txt'})

    if not text.strip():
        return jsonify({'success': False, 'message': 'Nenhum conteúdo fornecido'})

    clean_text = preprocess_text(text)
    category = classify_email(clean_text)
    response = generate_response(text, category)

    file_url = f"/static/uploads/{filename}"

    return jsonify({
        'success': True,
        'result': {
            'emailtype': emailtype,
            'originalEmail': text if 'text' in emailtype else file_url,
            'category': category,
            'response': response
        }
    })

if __name__ == "__main__":
    app.run(debug=True)