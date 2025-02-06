#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Jul 22 01:16:22 2024

@author: sabine
"""

import subprocess
import time
import traceback
import os

# List of scripts to run with their descriptions
scripts = [
    ("load_gg.py", "# Grundgesetz"),
    ("load_bverfge.py", "# Urteile des Bundesverfassungsgerichts"),
    ("load_names.py", "# Namensgebung für einige berühmte Urteile des Bundesverfassungsgerichts"),
    ("load_textbooks.py", "# Lehrbücher, die sich auf die obigen Daten beziehen können und mehr Kontextwissen enthalten")
]

def run_script(script, description, scripts_directory):
    try:
        print(description)
        start_time = time.time()
        script_path = os.path.join(scripts_directory, script)
        subprocess.run(["python", script_path], check=True)
        end_time = time.time()
        elapsed_time = end_time - start_time
        print(f"Script {script} ran successfully in {elapsed_time:.2f} seconds.\n")
    except subprocess.CalledProcessError as e:
        print(f"Error running script {script}:")
        print(e)
        print(traceback.format_exc())
        quit()

def main():
    # Get the absolute path to the current directory and then to the scripts directory
    current_directory = os.path.dirname(os.path.abspath(__file__))
    scripts_directory = os.path.join(current_directory, 'scripts')

    for script, description in scripts:
        run_script(script, description, scripts_directory)

if __name__ == "__main__":
    main()
