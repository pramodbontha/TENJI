#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jul 22 01:09:09 2024

@author: sabine
"""

import os
import re
import csv
import xml.etree.ElementTree as ET
from neo4j import GraphDatabase

# Function to parse the CSV file and get valid filenames
def get_valid_filenames(csv_path):
    valid_filenames = []
    with open(csv_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile, delimiter='\t')
        for row in reader:
            if row['fundstelle'] != 'NA':
                valid_filenames.append({
                    'dateiname': row['dateiname'],
                    'aktenzeichen': row['aktenzeichen'],
                    'fundstelle': row['fundstelle'],
                    'jahr': row['jahr'],
                    'monat': row['monat'],
                    'tag': row['tag'],
                    'entscheidungsart': row['entscheidungsart'],
                    'spruchkoerper': row['spruchkoerper']
                })
    return valid_filenames

#function to normalize the references to bverfge into a standard format
def transform_string(s):
    # Remove spaces
    s = re.sub(r'\s+', '', s)
    # Remove hyphens and the digits following them
    s = re.sub(r'-\d+', '', s)
    return s

#function to remove the string "Gründe:" or "G r ü n d e :" which was often at the beginning
def remove_gruende(text):
    return re.sub(r'(?i)^[\s<p>\n\r]*g\s*r\s*ü\s*n\s*d\s*e\s*(?:<p>|:\n|</p>|[ \t])*', '', text)

#function to remove empty paragraphs resulting from using remove_gruende
def remove_empty_paragraph(text):
    return re.sub(r'<p>\s*</p>', '', text)

# Step 1: Parse the BVerfG XML File and Extract Legal Cases
def parse_bverfg(bverfg_directory, valid_filenames):
    cases = []
    valid_file_dict = {f['dateiname']: f for f in valid_filenames}

    #define important regexes for relationship detection
    ref_pattern = re.compile(r'Art\.?\s*(\d+[a-zA-Z]*)\s*Abs\.?\s*(\d+[a-zA-Z]*)?\s*(Satz\s*\d+)?\s*GG')
    bverfg_pattern = re.compile(r'(BVerfGE\s?\d{1,3},?\s?\d{1,3})')
 

    for filename in list(os.listdir(bverfg_directory)):
        if filename.endswith(".xml"):
            base_filename = filename.rstrip(".xml")
            if base_filename not in valid_file_dict:
                continue

            xml_file = os.path.join(bverfg_directory, filename)
            try:
                tree = ET.parse(xml_file)
                root = tree.getroot()
            except ET.ParseError as e:
                print(f"Error parsing {xml_file}: {e}")
                continue

            for decision in root.findall('.//entscheidung'):
                case_id = valid_file_dict[base_filename]['aktenzeichen']
                case_number = transform_string(valid_file_dict[base_filename]['fundstelle'])
                year = valid_file_dict[base_filename]['jahr']
                decision_type = valid_file_dict[base_filename]['entscheidungsart']
                panel_of_judges = valid_file_dict[base_filename]['spruchkoerper']

                case_text_facts = []
                case_text_reasoning = []
                gg_references = []
                bverfge_references = []
                case_judgment = []
                case_headnotes = []

                # Extract headnotes
                # Extract leitsätze or fallback to rubrum if no leitsätze are available
                leitsaetze_text = []  # To store leitsätze or fallback rubrum text
                leitsaetze = decision.findall('.//leitsaetze')

                if leitsaetze:
                    # Process leitsätze
                    for leitsatz in leitsaetze:
                        if leitsatz is not None:
                            l_text = []
                            
                            # Check for 'absatz' elements within leitsatz
                            absatz_elements = leitsatz.findall('.//absatz')
                            if absatz_elements:
                                for absatz in absatz_elements:
                                    if absatz.text:
                                        l_text.append('<p>')
                                        l_text.append('</p><p>'.join(absatz.itertext()))
                                        l_text.append('</p>')
                            elif leitsatz.text or ''.join(leitsatz.itertext()).strip():  # Check if leitsatz has text without 'absatz'
                                l_text.append('<p>')
                                l_text.append('</p><p>'.join(leitsatz.itertext()))
                                l_text.append('</p>')
                            
                            if l_text:  # Ensure l_text is not empty before joining
                                leitsaetze_text.append("".join(l_text))
                else:
                    # No leitsätze available, extract from rubrum
                    rubrum = decision.find('.//rubrum')
                    if rubrum is not None:
                        r_text = []
                        german_note = "<p><b>Hinweis:</b> Keine Leitsätze verfügbar. Stattdessen zeigen wir den Rubrum-Text:</p>"
                        r_text.append(german_note)
                        
                        # Check for 'absatz' elements within rubrum
                        absatz_elements = rubrum.findall('.//absatz')
                        if absatz_elements:
                            for absatz in absatz_elements:
                                if absatz.text:
                                    r_text.append('<p>')
                                    r_text.append('</p><p>'.join(absatz.itertext()))
                                    r_text.append('</p>')
                        elif rubrum.text or ''.join(rubrum.itertext()):  # Check if rubrum has text without 'absatz'
                            r_text.append('<p>')
                            r_text.append('</p><p>'.join(rubrum.itertext()))
                            r_text.append('</p>')
                        
                        if r_text:  # Ensure r_text is not empty before joining
                            leitsaetze_text.append("".join(r_text))

                # Append the extracted text to case_headnotes if any text was found
                if leitsaetze_text:
                    case_headnotes.append("".join(leitsaetze_text))

                # Extract judgment
                for tenor in decision.findall('.//tenor'):
                    if tenor is not None:
                        t_text = []
                        
                        # Check for 'absatz' elements
                        absatz_elements = tenor.findall('.//absatz')
                        if absatz_elements:
                            for absatz in absatz_elements:
                                if absatz.text:
                                    t_text.append('<p>')
                                    t_text.append('</p><p>'.join(absatz.itertext()))
                                    t_text.append('</p>')
                        elif tenor.text or ''.join(tenor.itertext()):  # Check if tenor has text without 'absatz'
                            t_text.append('<p>')
                            t_text.append('</p><p>'.join(tenor.itertext()))
                            t_text.append('</p>')

                        if t_text:  # Ensure t_text is not empty before joining
                            tenor_text = "".join(t_text)
                            case_judgment.append(tenor_text)

                # Extract case text and references
                for paragraph in decision.findall('.//gruende//absatz'):
                    if paragraph is not None and paragraph.text:
                        p_text=[]
                        p_text.append('<p>') 
                        p_text.append('</p><p>'.join(paragraph.itertext()))
                        p_text.append('</p>')
                        para_text="".join(p_text)
                        paragraph_text=remove_gruende(para_text)

                        tbeg_attr = paragraph.get('tbeg')
                        if tbeg_attr == 'tb':
                            case_text_facts.append(paragraph_text)
                        elif tbeg_attr == 'eg':
                            case_text_reasoning.append(paragraph_text)

                        # Extract references to GG articles using regex
                       for ref in ref_pattern.findall(paragraph_text):
                            gg_references.append(ref[0])
                        for ref in bverfg_pattern.findall(paragraph_text):
                            bverfge_references.append(ref.replace(" ", ""))

                # Extract references from headnotes
                for headnote_text in case_headnotes:
                    for ref in ref_pattern.findall(headnote_text):
                        gg_references.append(ref[0])
                    for ref in bverfg_pattern.findall(headnote_text):
                        bverfge_references.append(ref.replace(" ", ""))

                # Define a regular expression pattern to match the format
                pattern = r'BVerfGE(\d+),(\d+)'

                # Use re.sub() to replace the leading zeros after the comma
                modified_string = re.sub(pattern, lambda m: f"BVerfGE{m.group(1)},{int(m.group(2))}", filename.rstrip(".xml"))

                cases.append({
                    'id': case_id,
                    'headnotes': ' '.join(case_headnotes),
                    'judgment': ' '.join(case_judgment),
                    'facts': remove_empty_paragraph(' '.join(case_text_facts)),
                    'reasoning': remove_empty_paragraph(' '.join(case_text_reasoning)),
                    'gg_references': gg_references,
                    'bverfge_references': bverfge_references,
                    'number': case_number,
                    'year': year,
                    'decision_type': decision_type,
                    'panel_of_judges': panel_of_judges
                })

    return cases

# Step 2: Load the Data into a Neo4j Graph Database
class LegalGraph:
    def __init__(self, uri, user, password):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
    
    def close(self):
        self.driver.close()
    
    def create_case_node(self, case):
        with self.driver.session() as session:
            session.run(
                """
                MERGE (c:Case {id: $id, headnotes: $headnotes, judgment: $judgment, 
                               facts: $facts, reasoning: $reasoning, gg_references: $gg_references, 
                               bverfge_references: $bverfge_references, number: $number, 
                               year: $year, 
                               decision_type: $decision_type, panel_of_judges: $panel_of_judges})
                """, 
                id=case['id'], 
                headnotes=case['headnotes'],
                judgment=case['judgment'],
                facts=case['facts'],
                reasoning=case['reasoning'],
                gg_references=";".join(case['gg_references']),
                bverfge_references=";".join(case['bverfge_references']),
                number=case['number'],
                year=case['year'],
                decision_type=case['decision_type'],
                panel_of_judges=case['panel_of_judges']
            )
    
    def create_reference_relationship(self, from_case, to_id):
        with self.driver.session() as session:
            session.run(
                """
                MATCH (a:Case {id: $from_id})
                MATCH (b:Article {number: $to_id})  // Assuming 'Article' nodes in Neo4j
                MERGE (a)-[:REFERS_TO]->(b)
                """, 
                from_id=from_case, 
                to_id=to_id
            )
    
    def create_case_relationship(self, from_case, to_id):
        with self.driver.session() as session:            
            session.run(
                """
                MATCH (a:Case {id: $from_id})
                MATCH (b:Case {number: $to_id})  
                MERGE (a)-[:REFERS_TO]->(b)
                """, 
                from_id=from_case, 
                to_id=to_id
            )
    def update_relationship_properties(self, cases):
        with self.driver.session() as session:
            # Update REFERS_TO relationships between Case and Article nodes
            for case in cases:
                gg_references_count = {ref: case['gg_references'].count(ref) for ref in set(case['gg_references'])}
                for ref, count in gg_references_count.items():
                    session.run(
                        """
                        MATCH (a:Case {id: $from_id})-[r:REFERS_TO]->(b:Article {number: $to_id})
                        SET r.number_of_references = $count
                        """,
                        from_id=case['id'],
                        to_id=ref,
                        count=count
                    )
                
                bverfge_references_count = {ref: case['bverfge_references'].count(ref) for ref in set(case['bverfge_references'])}
                for ref, count in bverfge_references_count.items():
                    session.run(
                        """
                        MATCH (a:Case {number: $from_id})-[r:REFERS_TO]->(b:Case {number: $to_id})
                        SET r.number_of_references = $count
                        """,
                        from_id=case['number'],
                        to_id=ref,
                        count=count
                    )
    
    def initialize_node_attributes(self):
        with self.driver.session() as session:
            # Initialize total_case_citations and citing_cases for all Article nodes
            session.run(
                """
                MATCH (a:Article)
                SET a.total_case_citations = 0,
                    a.citing_cases = 0
                """
            )
            # Initialize total_case_citations and citing_cases for all Case nodes
            session.run(
                """
                MATCH (c:Case)
                SET c.total_case_citations = 0,
                    c.citing_cases = 0
                """
            )    
    
    def update_node_attributes(self):
        with self.driver.session() as session:
            # Update Article nodes with total_case_citations and citing_cases
            session.run(
                """
                MATCH (b:Article)<-[r:REFERS_TO]-()
                WITH b, SUM(r.number_of_references) AS total_case_citations, COUNT(r) AS citing_cases
                SET b.total_case_citations = total_case_citations, b.citing_cases = citing_cases
                """
            )

            # Update Case nodes with total_case_citations and citing_cases
            session.run(
                """
                MATCH (b:Case)<-[r:REFERS_TO]-()
                WITH b, SUM(r.number_of_references) AS total_case_citations, COUNT(r) AS citing_cases
                SET b.total_case_citations = total_case_citations, b.citing_cases = citing_cases
                """
            )

def main():
    # Paths to the directories and files
    bverfg_directory = './data/Wendel_Korpus_BVerfG/xml/'  # Update with your directory path
    csv_path = './data/Metadaten2.7.1.csv'  # Path to the CSV file

    # Get valid filenames
    valid_filenames = get_valid_filenames(csv_path)

    # Parse the XML files
    bverfg_cases = parse_bverfg(bverfg_directory, valid_filenames)
    
    # Connect to Neo4j
    uri = "bolt://localhost:7687"  # Adjust the URI if needed
    user = "neo4j"
    password = "huproject"  # Use your actual Neo4j password
    graph = LegalGraph(uri, user, password)
    
    # Create Case nodes and Reference relationships
    for case in bverfg_cases:
        graph.create_case_node(case)
        
        # Create relationships for references
        for reference in case['gg_references']:
            graph.create_reference_relationship(case['id'], reference)
    
    for case in bverfg_cases:
        for reference in case['bverfge_references']:
            graph.create_case_relationship(case['id'], reference)
 
    # Initialize node attributes for all Case and Article nodes
    graph.initialize_node_attributes()
    
    # Update the REFERS_TO relationships with the number_of_references property
    graph.update_relationship_properties(bverfg_cases)

    # Update Article and Case nodes with total_case_citations and citing_cases
    graph.update_node_attributes()
    
    # Close the graph connection
    graph.close()

if __name__ == "__main__":
    main()
