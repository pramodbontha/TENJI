import os
import re
import csv
import traceback
from collections import defaultdict
from neo4j import GraphDatabase

def parse_toc_weblink(file):
     data_toc={}
     with open(file, "r", encoding="utf-8") as toc_weblink_file:
          reader = csv.reader(toc_weblink_file, delimiter=";", quotechar='"')
          for row in list(reader)[1:]:
              data_toc[row[0]]=row[1]
     return data_toc

def parse_tb(directory):
    reference_data = []
    toc_data = []
    for filename in os.listdir(directory):
        if filename.endswith(".csv") and not filename.endswith("_weblinks.csv"):
            csv_file = os.path.join(directory, filename)
            dath = []
            with open(csv_file, "r", encoding="utf-8") as csvfile:
                reader = csv.reader(csvfile, delimiter=";", quotechar='"')
                for row in list(reader)[1:]:
                    dath.append(row)
            weblinks=parse_toc_weblink(os.path.join(directory, str(filename.strip(".csv")+"_weblinks.csv")))
            for i, r in enumerate(dath):
                reference = r[0]
                resource = r[1]
                context = r[4]
                toc_levels = [r[x] for x in range(16, 4, -1)]  # TOC1 to TOC12
                toc0 = filename.strip(".csv")
                
                # Get the maximum depth TOC value
                max_depth_toc = next((toc for toc in toc_levels if toc), None)
                toc_hierarchy = [toc for toc in [toc0] + toc_levels if toc]
                
                # Create reference_data node
                full_path_ids = [f"{' > '.join(toc_hierarchy[:i+1])}" for i in range(len(toc_hierarchy))]
                
                reference_data.append({
                    'id': full_path_ids[-1],  # Use the full path to current node as the ID
                    'text': reference,
                    'next_toc': full_path_ids[-2] if len(full_path_ids) > 1 else f"{filename.strip('.csv')}_toc0",  # Set next_toc to toc0 if no parent
                    'context': context,
                    'resource': resource
                })
                
                # Create toc_data nodes
                toc_path_ids = [f"{' > '.join(toc_hierarchy[:level+1])}" for level in range(len(toc_hierarchy))]
                
                for level, toc_text in enumerate(toc_hierarchy):
                    next_toc = toc_path_ids[level - 1] if level > 0 else toc0
                    if toc_path_ids[level] in weblinks:
                        weblink=weblinks[toc_path_ids[level]]
                    else: weblink=None
                    toc_data.append({
                        'id': toc_path_ids[level],
                        'text': toc_text,
                        'next_toc': next_toc,  # Set next_toc to toc0 for root, otherwise parent node
                        'weblink': weblink
                    })

    return reference_data, toc_data

class LegalGraph:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
    
    def close(self):
        self.driver.close()
    
    def create_ref_node(self, reference):
        with self.driver.session() as session:
            session.run(
                "MERGE (c:Reference {id: $id, text: $text, context: $context, resource: $resource, next_toc: $next_toc})", 
                id=reference['id'], 
                text=reference["text"],
                next_toc=reference["next_toc"],
                context=reference["context"],
                resource=reference["resource"],
                
            )

    def create_toc_node(self, toc):
        with self.driver.session() as session:
            try:
                # Ensure next_toc is set to a default value if not provided
                if not toc.get('next_toc'):
                    toc['next_toc'] = f"0__{toc['text']}"  # Set default next_toc
                    
                session.run(
                    "MERGE (c:TOC {id: $id, text: $text, next_toc: $next_toc, weblink: $weblink})", 
                    id=toc['id'], 
                    text=toc['text'],
                    next_toc=toc['next_toc'],
                    weblink=toc["weblink"]
                )
            except Exception as e:
                traceback.print_exc()
                print(toc)

    def create_article_relationship(self, from_case, to_id):
        with self.driver.session() as session:
            session.run(
                """
                MATCH (a:Reference {text: $from_id})
                MATCH (b:Article {number: $to_id})
                MERGE (a)-[:MENTIONS]->(b)
                """, 
                from_id=from_case, 
                to_id=to_id
            )

    def create_case_relationship(self, from_case, to_id):
        with self.driver.session() as session:
            session.run(
                """
                MATCH (a:Reference {text: $from_id})
                MATCH (b:Case {number: $to_id})
                MERGE (a)-[:MENTIONS]->(b)
                """, 
                from_id=from_case, 
                to_id=to_id
            )

    def create_reference_relationship(self, from_case, to_id):
        with self.driver.session() as session:
            session.run(
                """
                MATCH (a:Reference {id: $from_id})
                MATCH (b:TOC {id: $to_id})
                MERGE (a)-[:PART_OF]->(b)
                """, 
                from_id=from_case, 
                to_id=to_id
            )

    def create_toc_relationship(self, from_case, to_id):
        with self.driver.session() as session:
            session.run(
                """
                MATCH (a:TOC {id: $from_id})
                MATCH (b:TOC {id: $to_id})
                MERGE (a)-[:PART_OF]->(b)
                """, 
                from_id=from_case, 
                to_id=to_id
            )

def main():
    # Directory path to the CSV files
    directory = './data/textbooks/'  # Update with your directory path

    # Parse the CSV files
    ref_data, toc_data = parse_tb(directory)
    
    # Connect to Neo4j
    uri = "bolt://localhost:7687"  # Adjust the URI if needed
    user = "neo4j"
    password = "huhontow"  # Use your actual Neo4j password
    graph = LegalGraph(uri, user, password)
    
    # Create TOC nodes
    seen_toc_nodes = set()
    for tb in toc_data:
        if tb['id'] not in seen_toc_nodes:
            graph.create_toc_node(tb)
            seen_toc_nodes.add(tb['id'])
    
    # Create Reference nodes
    for tb in ref_data:
        graph.create_ref_node(tb)
    
    # Create TOC relationships
    for tb in toc_data:
        if tb["next_toc"]:
            graph.create_toc_relationship(tb["id"], tb["next_toc"])
    
    # Create Reference relationships and other relationships
    bverfge_pattern = re.compile(r'BVerfGE\s(\d+),\s(\d+)')
    gg_pattern = re.compile(r'Art\.?\s*(\d+[a-zA-Z]*)(,\s*(\d+[a-zA-Z]*)*)(\s*Abs\.)?\s*(\d+[a-zA-Z]*)?\s*(Satz\s*\d+)?\s*GG')
    for tb in ref_data:
        graph.create_reference_relationship(tb['id'], tb["id"])
        if tb["resource"] == "BVerfGE":
            modified_string = re.sub(bverfge_pattern, lambda m: f"BVerfGE{m.group(1)},{int(m.group(2))}", tb["text"])
            graph.create_case_relationship(tb['text'], modified_string)
        elif tb["resource"] == "GG":
            gg_references = []
            for ref in gg_pattern.findall(tb["text"]):
                gg_references.append(ref[0])
                if ref[2]:
                    gg_references.append(ref[2])
            for reference in gg_references:
                graph.create_article_relationship(tb['text'], reference)
    
    # Close the graph connection
    graph.close()

if __name__ == "__main__":
    main()
