#!/usr/bin/env python3
"""
Master generator for all website pages.
Regenerates research.html and teaching.html from JSON data files.

Run this whenever you update:
  - assets/data/data.json (research content)
  - assets/data/teaching.json (teaching content)
"""

from pathlib import Path
import subprocess
import sys


def run_generator(script_name: str, description: str) -> bool:
    """Run a generator script and report status."""
    script = Path(__file__).parent / script_name
    
    if not script.exists():
        print(f"{description}: Script {script_name} not found!")
        return False
    
    try:
        result = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"{description}")
            print(f"{result.stdout.strip()}")
            return True
        else:
            print(f"{description}: {result.stderr}")
            return False
    except Exception as e:
        print(f"{description}: {e}")
        return False


def main():
    print("Regenerating website pages from JSON data...\n")
    
    results = [
        run_generator("research_generate.py", "Research page"),
        run_generator("teaching_generate.py", "Teaching page"),
    ]
    
    print("\n" + "="*50)
    if all(results):
        print("All pages generated successfully!")
        return 0
    else:
        print("Some pages failed to generate")
        return 1


if __name__ == "__main__":
    sys.exit(main())
