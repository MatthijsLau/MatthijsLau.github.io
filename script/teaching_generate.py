import json
from dataclasses import dataclass
from html import escape
from pathlib import Path
from typing import Literal
from collections import defaultdict


@dataclass
class Entry:
    """Represents a teaching activity."""
    title: str
    year: str  # e.g., "2024/2025"
    season: str  # e.g., "Spring"
    institution: str
    url: str | None = None

    def render_title(self) -> str:
        """Render title with optional link."""
        title_html = escape(self.title)
        if self.url:
            title_html = f'<a href="{escape(self.url)}" target="_blank" rel="noopener noreferrer">{title_html}</a>'
        return title_html


def load_teaching_from_json(json_path: Path) -> list[Entry]:
    """Load teaching entries from JSON file."""
    with open(json_path) as f:
        data = json.load(f)
    
    entries = []
    for item in data:
        entry = Entry(
            title=item.get("title", ""),
            year=item.get("year", ""),
            season=item.get("season", ""),
            institution=item.get("locationId", ""),
            url=item.get("url")
        )
        entries.append(entry)
    
    return entries


def generate_html(entries: list[Entry], template_path: Path) -> str:
    """Generate HTML using template and entries."""
    with open(template_path) as f:
        template = f.read()
    
    # Group by institution
    by_institution = defaultdict(lambda: defaultdict(list))
    
    for entry in entries:
        by_institution[entry.institution][entry.year].append(entry)
    
    # Map institution IDs to display names
    institution_names = {
        "Radboud": "At Radboud University Nijmegen (Netherlands)",
        "Salerno": "At L'Università degli studi di Salerno",
    }
    
    # Build HTML sections for each institution
    sections = []
    
    for institution_id in sorted(by_institution.keys()):
        inst_name = institution_names.get(institution_id, institution_id)
        years_data = by_institution[institution_id]
        
        # Build year sections (newest first)
        year_sections = []
        for year in sorted(years_data.keys(), reverse=True):
            courses = years_data[year]
            
            # Sort courses by season (Fall before Spring)
            season_order = {"Fall": 0, "Spring": 1, "Winter": 2, "Summer": 3}
            courses = sorted(courses, key=lambda c: season_order.get(c.season, 4))
            
            year_html = f'    <details open class="secondaryDetails">\n'
            year_html += f'        <summary>{year}</summary>\n'
            year_html += f'        <ul>\n'
            
            for course in courses:
                year_html += f'            <li>{course.render_title()}, {escape(course.season)}</li>\n'
            
            year_html += f'        </ul>\n'
            year_html += f'    </details>'
            year_sections.append(year_html)
        
        # Build institution section
        inst_text = '\n'.join(year_sections)
        inst_html = f'<details open class="mainDetails">\n'
        inst_html += f'    <summary>{escape(inst_name)}</summary>\n'
        
        # Add subtitle for Radboud
        if institution_id == "Radboud":
            inst_html += f'    <div class="subtitle">\n'
            inst_html += f'        As a Bachelor\'s and Master\'s student, I gave tutorials and problem sessions for the following\n'
            inst_html += f'        courses:\n'
            inst_html += f'    </div>\n'
        
        inst_html += f'{inst_text}\n'
        inst_html += f'</details>'
        sections.append(inst_html)
    
    teaching_html = '\n'.join(sections)
    html = template.format(teaching=teaching_html)
    return html




if __name__ == "__main__":
    # Load entries from JSON
    root = Path(__file__).parent.parent
    json_path = root / "assets" / "data" / "teaching.json"
    entries = load_teaching_from_json(json_path)
    
    # Generate HTML using template
    template_path = root / "templates" / "teaching.html.template"
    html_content = generate_html(entries, template_path)
    
    # Write to file
    output_path = root / "teaching.html"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"Generated {output_path}")
