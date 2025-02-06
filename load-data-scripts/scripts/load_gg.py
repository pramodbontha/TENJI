import re
import xml.etree.ElementTree as ET
from neo4j import GraphDatabase

# Step 1: Parse the XML File and Extract Articles
def parse_grundgesetz(xml_file):
    tree = ET.parse(xml_file)
    root = tree.getroot()

    articles = []
    for norm in root.findall('.//norm'):
        article_number = None
        article_text = []
        citations = []

        # Extract article number
        enbez = norm.find('.//enbez')
        if enbez is not None:
            # Extract only the numeric part of the article number
            article_number_match = re.match(r'.*?(\d+[a-z]?)', enbez.text.strip())
            if article_number_match:
                article_number = article_number_match.group(1)

        # Extract article text
        text_element = norm.find('.//textdaten//Content')
        if text_element is not None:
            for p in text_element.findall('P'):
                paragraph_text = '</p><p>'.join(p.itertext())
                article_text.append('<p>')
                article_text.append(paragraph_text)
                article_text.append('</p>')
        
        # Extract citations using enhanced regex
        if article_number:
            citation_pattern = re.compile(
                r'(?:Art\.?|Artikel|Artikeln|Artikelnummer|Artikelnr\.?)\s*(\d+[a-z]?)',  # Match Art., Artikel, or Artikeln followed by the article number and capture the numeric part
            )
            for ref in citation_pattern.findall(' '.join(article_text)):
                citations.append(ref)

        if article_number:
            articles.append({
                'number': article_number,
                'text': ' '.join(article_text),
                'citations': citations,
                'resource': "GG"
            })

    return articles

# Step 2: Load the Data into a Neo4j Graph Database
class GrundgesetzGraph:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
    
    def close(self):
        self.driver.close()
    
    def create_article_node(self, article):
        with self.driver.session() as session:
            session.run(
                "MERGE (a:Article {number: $number, text: $text, resource: $resource})", 
                number=article['number'], 
                text=article['text'],
                resource=article['resource']
            )
    
    def create_citation_relationship(self, from_article, to_article):
        with self.driver.session() as session:
            session.run(
                """
                MATCH (a:Article {number: $from_number})
                MATCH (b:Article {number: $to_number})
                MERGE (a)-[:CITES]->(b)
                """, 
                from_number=from_article, 
                to_number=to_article
            )

def main():
    # File path to the Grundgesetz XML file
    xml_file = './data/gg.xml'

    # Parse the XML file
    articles = parse_grundgesetz(xml_file)
    
    # Connect to Neo4j
    uri = "bolt://localhost:7687"  # Adjust the URI if needed
    user = "neo4j"
    password = "huproject"  # Use your actual Neo4j password
    graph = GrundgesetzGraph(uri, user, password)
    
    # Create Article nodes
    for article in articles:
        graph.create_article_node(article)
    
    # Create Citation relationships
    for article in articles:
        for citation in article['citations']:
            graph.create_citation_relationship(article['number'], citation)
    
    # Close the graph connection
    graph.close()

if __name__ == "__main__":
    main()