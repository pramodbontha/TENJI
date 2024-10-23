from flask import Flask, request, jsonify
import spacy
from elasticsearch import Elasticsearch

app = Flask(__name__)

# Load spaCy's German language model
nlp = spacy.load('de_core_news_lg')

# Elasticsearch client
es = Elasticsearch("http://elasticsearch:9200")

# Function to lemmatize text using spaCy

@app.route('/lemmatize', methods=['POST'])
def lemmatize_text():
    data = request.json  # Assuming the request body is JSON
    text = data.get('text', '')  # Get the 'text' from the request body
    doc = nlp(text)
    return {"lemmatized_text": " ".join([token.lemma_ for token in doc])}


def lemmatize_text_es(text):
    doc = nlp(text)
    return " ".join([token.lemma_ for token in doc])

@app.route('/lemmatize-cases', methods=['GET'])
def lemmatize_and_update_cases():
    # Retrieve all cases
    es_query = {
        "query": {
            "match_all": {}
        }
    }
    
    cases = es.search(index='cases', body=es_query)

    for case in cases['hits']['hits']:
        lemmatized_name = lemmatize_text_es(case["_source"]["caseName"])
        lemmatized_facts = lemmatize_text_es(case["_source"]["facts"])
        lemmatized_reasoning = lemmatize_text_es(case["_source"]["reasoning"])
        lemmatized_judgment = lemmatize_text_es(case["_source"]["judgment"])
        lemmatized_headnotes = lemmatize_text_es(case["_source"]["headnotes"])

        # Update the document in Elasticsearch with lemmatized fields
        es.update(index='cases', id=case["_id"], body={
            "doc": {
                "name_lemma": lemmatized_name,
                "facts_lemma": lemmatized_facts,
                "reasoning_lemma": lemmatized_reasoning,
                "judgment_lemma": lemmatized_judgment,
                "headnotes_lemma": lemmatized_headnotes
            }
        })

    return "lemmatized and updated cases"



@app.route('/lemmatize-articles', methods=['GET'])
def lemmatize_and_update_articles():
    # Retrieve all cases
    es_query = {
        "query": {
            "match_all": {}
        }
    }
    
    articles = es.search(index='articles', body=es_query)

    for article in articles['hits']['hits']:
        lemmatized_name = lemmatize_text_es(article["_source"]["name"])
        lemmatized_text = lemmatize_text_es(article["_source"]["text"])

        # Update the document in Elasticsearch with lemmatized fields
        es.update(index='articles', id=article["_id"], body={
            "doc": {
                "name_lemma": lemmatized_name,
                "text_lemma": lemmatized_text,
            }
        })
    
    es.indices.refresh(index='articles')

    return "lemmatized and updated articles"

if __name__ == '__main__':
    # Run the Flask server on port 5000
    app.run(host='0.0.0.0', port=5000)
