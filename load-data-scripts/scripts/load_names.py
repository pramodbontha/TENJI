import csv
import re
from neo4j import GraphDatabase

class LegalGraph:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
    
    def close(self):
        self.driver.close()
    
    def create_name_node(self, name):
        with self.driver.session() as session:
            session.run(
                "MERGE (n:Name {id: $id}) "
                "SET n.short = $short,  n.type = $type",
                id=name['id'],
                short=name['short'],
                type=name['type']
            )

    def create_is_named_relationship(self, case_number, name_id):
        with self.driver.session() as session:
            session.run(
                """
                MATCH (c:Case {number: $case_number})
                MATCH (n:Name {id: $name_id})
                MERGE (c)-[:IS_NAMED]->(n)
                """,
                case_number=case_number,
                name_id=name_id
            )
    def create_is_named_relationship_article(self, article_number, name_id):
         with self.driver.session() as session:
             session.run(
                 """
                 MATCH (c:Article {number: $article_number})
                 MATCH (n:Name {id: $name_id})
                 MERGE (c)-[:IS_NAMED]->(n)
                 """,
                 article_number=article_number,
                 name_id=name_id
             )

def parse_names_csv(csv_file_path):
    names = []
    with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile, delimiter=';')
        for row in reader:
            names.append({
                'id': row['id'].replace('_', ','),  # Replace underscore with comma
                'short': row['short'],
                'type': 'case'
            })
    return names

def parse_articles_csv(csv_file_path):
    names = []
    with open(csv_file_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile, delimiter=';')
        for row in reader:
            if row['name_long'] and 'GG' in row['verweis']:
                id_match = re.search(r'Art(\d+[a-z]?)_', row['verweis'])
                if id_match:
                    id_value = id_match.group(1)
                    names.append({
                        'id': id_value,
                        'short': row['name_long'],
                        'type': 'article'
                    })
    return names

def main():
    # Paths to the CSV files
    names_csv_file_path = './data/names_cases.csv'  # Update with your actual CSV file path
    articles_csv_file_path = './data/names_articles.csv'  # Update with your actual CSV file path
    
    # Parse the CSV files
    names = parse_names_csv(names_csv_file_path)
    articles = parse_articles_csv(articles_csv_file_path)
    
    # Combine both lists of names
    all_names = names + articles
    
    # Connect to Neo4j
    uri = "bolt://localhost:7687"  # Adjust the URI if needed
    user = "neo4j"
    password = "huhontow"  # Use your actual Neo4j password
    graph = LegalGraph(uri, user, password)
    
    # Create Name nodes and IS_NAMED relationships
    for name in all_names:
         if name['type'] == 'case':
             graph.create_name_node(name)
             graph.create_is_named_relationship(name['id'],name['id'])
         elif name['type'] == 'article':
             graph.create_name_node(name)
             graph.create_is_named_relationship_article(name['id'],name['id'])
    
    # Close the graph connection
    graph.close()

if __name__ == "__main__":
    main()