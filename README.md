## 🚀 Execução do projeto

Clone o projeto e acesse a pasta do mesmo.

```bash
$ git clone git@github.com:Renan-Gust/email-classifier.git
$ cd email-classifier
```

### Instale as dependências

```bash
$ pip install -r requirements.txt
```

### Configure a chave da OpenAI:
> Duplique o .env.example e renomeie o próprio para .env e adicione sua chave da OpenAI

### Download da pasta nltk_data:
> Caso nao tenha a pasta nltk_data no projeto execute o comando abaixo para cria-la
```bash
$ python -m nltk.downloader -d ./nltk_data stopwords omw-1.4
```

### Rode o projeto:
```bash
$ flask run
```

O projeto estará disponível no seu browser pelo endereço Acesse via http://localhost:5000