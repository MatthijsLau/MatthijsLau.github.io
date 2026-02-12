import json
import re
from dataclasses import dataclass
from datetime import date, datetime
from html import escape
from typing import Literal
from pathlib import Path
from collections import defaultdict

try:
    from pybtex.database import parse_file
except ImportError:
    parse_file = None


@dataclass
class DateRange:
    """Format date ranges for display."""
    start: date | None
    end: date | None = None
    is_tba: bool = False
    tba_year: int | None = None

    def __post_init__(self):
        if not self.is_tba and self.start:
            self.end = self.end or self.start

    @property
    def kind(self) -> str:
        if self.is_tba:
            return "tba"
        if self.start == self.end:
            return "day"
        if self.start.year == self.end.year and self.start.month == self.end.month:
            return "month"
        if self.start.year == self.end.year:
            return "year"
        return "range"

    def format(self) -> str:
        if self.is_tba:
            return "TBA"

        def month_day(d: date) -> str:
            return f"{d.strftime('%b.')} {d.day}"

        if self.kind == "day":
            return month_day(self.start)
        elif self.kind == "month":
            return f"{month_day(self.start)} - {self.end.day}"
        elif self.kind == "year":
            return f"{month_day(self.start)} - {month_day(self.end)}"
        else:
            return f"{month_day(self.start)} - {month_day(self.end)}"

    def format_with_year(self) -> str:
        """Format date range with year included."""
        if self.is_tba:
            return f"TBA {self.tba_year}" if self.tba_year else "TBA"

        def month_day_year(d: date) -> str:
            return f"{d.strftime('%b.')} {d.day}, {d.year}"

        if self.kind == "day":
            return month_day_year(self.start)
        elif self.kind == "month":
            return f"{self.start.strftime('%b.')} {self.start.day} - {self.end.day}, {self.end.year}"
        elif self.kind == "year":
            return f"{self.start.strftime('%b.')} {self.start.day}, {self.start.year} - {self.end.strftime('%b.')} {self.end.day}, {self.end.year}"
        else:
            return f"{self.start.strftime('%b.')} {self.start.day}, {self.start.year} - {self.end.strftime('%b.')} {self.end.day}, {self.end.year}"


@dataclass
class BibEntry:
    """Represents a bibliography entry from a .bib file."""
    entry_type: str  # article, book, inproceedings, etc.
    key: str
    author: str | None = None
    title: str | None = None
    year: str | None = None
    journal: str | None = None
    booktitle: str | None = None
    publisher: str | None = None
    volume: str | None = None
    pages: str | None = None
    doi: str | None = None
    url: str | None = None
    note: str | None = None
    number: str | None = None
    arxiv: str | None = None

    def format_authors(self) -> str:
        """Format author list."""
        if not self.author:
            return ""
        # Handle "and" separated authors
        authors = self.author.split(" and ")
        if len(authors) > 2:
            return f"{authors[0].strip()} et al."
        return ", ".join(a.strip() for a in authors)

    def render_html(self, style: str = "default") -> str:
        """Render as HTML based on style."""
        if style == "default":
            return self._render_default()
        return self._render_default()

    def _render_default(self) -> str:
        """Mathematical CV style:
        Authors, Title, Journal Volume (Year), no. X, pages, arXiv:XXXX.
        """
        parts = []

        # Authors
        if self.author:
            parts.append(self.format_authors())

        # Title
        if self.title:
            parts.append(self.title)

        # Journal / Booktitle
        publication_parts = []

        if self.journal:
            publication_parts.append(self.journal)
        elif self.booktitle:
            publication_parts.append(self.booktitle)

        # Volume + Year
        if self.volume and self.year:
            publication_parts.append(
                f"{self.volume} ({self.year})")
        elif self.year:
            publication_parts.append(f"({self.year})")

        # Issue number
        if self.number:
            publication_parts.append(f"no. {self.number}")

        # Pages
        if self.pages:
            publication_parts.append(self.pages)

        # Combine publication info
        if publication_parts:
            parts.append(", ".join(publication_parts))

        # Note (e.g., to appear)
        if self.note:
            parts.append(self.note)

        # DOI inline if needed
        if self.doi:
            parts.append(f"DOI {self.doi}")

        # arXiv
        if self.arxiv:
            parts.append(f"arXiv:{self.arxiv}")

        content = ", ".join(parts) + "."

        return f'            <li>{content}</li>'


@dataclass
class Entry:
    """Represents an academic event (talk, poster, or conference)."""
    type: Literal["event", "poster", "talk", "publication"]
    title: str
    date_range: DateRange | None = None
    location: str | None = None
    meeting: str | None = None
    url: str | None = None
    note: str | None = None
    authors: str | None = None  # For publications
    bib_entry: 'BibEntry | None' = None  # For BibTeX-sourced publications

    def render_location(self) -> str:
        """Render location string."""
        return self.location if self.location else ""

    def render_meeting(self) -> str:
        """Render meeting string."""
        return self.meeting if self.meeting else ""

    def render_title(self) -> str:
        """Render title with optional HTML wrapping."""
        title_html = self.title
        if self.type in {"poster", "talk"}:
            title_html = f"<em>{title_html}</em>"
        if self.url:
            title_html = f'<a href="{self.url}" target="_blank" rel="noopener noreferrer">{title_html}</a>'
        return title_html

    def render_date(self) -> str:
        """Render date if available."""
        return self.date_range.format() if self.date_range else ""

    def render_note(self) -> str:
        """Render note in parentheses if available."""
        return f" ({self.note})" if self.note else ""


def parse_bibtex(bib_path: Path) -> list[BibEntry]:
    """Parse a BibTeX file using pybtex and return a list of BibEntry objects."""
    if not bib_path.exists():
        return []

    if parse_file is None:
        print("Warning: pybtex not installed. Install with: pip install pybtex")
        return []

    try:
        bib_data = parse_file(str(bib_path))
    except Exception as e:
        print(f"Error parsing BibTeX file: {e}")
        return []

    entries = []
    for key in bib_data.entries:
        entry = bib_data.entries[key]

        # Extract author names
        author_str = None
        if 'author' in entry.persons:
            authors = entry.persons['author']
            author_str = " and ".join(str(author) for author in authors)

        # Create BibEntry
        bib_entry = BibEntry(
            entry_type=entry.type,
            key=key,
            author=author_str,
            title=str(entry.fields.get('title', '')),
            year=str(entry.fields.get('year', '')),
            journal=str(entry.fields.get('journal', '')),
            booktitle=str(entry.fields.get('booktitle', '')),
            publisher=str(entry.fields.get('publisher', '')),
            volume=str(entry.fields.get('volume', '')),
            pages=str(entry.fields.get('pages', '')),
            doi=str(entry.fields.get('doi', '')),
            url=str(entry.fields.get('url', '')),
            note=str(entry.fields.get('note', ''))
        )
        entries.append(bib_entry)

    return entries


def load_entries_from_json(json_path: Path) -> list[Entry]:
    """Load all entries from JSON file."""
    with open(json_path) as f:
        data = json.load(f)

    entries = []
    for item in data:
        entry_type = item["type"]

        # Parse date
        date_range = None
        if isinstance(item.get("date"), dict):
            start_date = date.fromisoformat(item["date"]["start"])
            end_date = date.fromisoformat(
                item["date"].get("end", item["date"]["start"]))
            date_range = DateRange(start=start_date, end=end_date)
        elif isinstance(item.get("date"), str):
            if item["date"].upper() == "TBA":
                # TBA date with year provided
                year = item.get("year")
                if year:
                    date_range = DateRange(
                        start=None, end=None, is_tba=True, tba_year=year)
            else:
                d = date.fromisoformat(item["date"])
                date_range = DateRange(start=d, end=d)
        elif item.get("year"):
            d = date(item["year"], 1, 1)
            date_range = DateRange(start=d, end=d)

        # Get location as a single string
        location = item.get("institute") or item.get(">")

        # Get title
        if entry_type == "event":
            title = item.get("meeting", "")
        else:
            title = item.get("title", "")

        entry = Entry(
            type=entry_type,
            title=title,
            date_range=date_range,
            location=location,
            meeting=item.get("meeting"),
            url=item.get("url"),
            note=item.get("note"),
            authors=item.get("authors")
        )
        entries.append(entry)

    return entries


def render_talk_or_poster(entry: Entry) -> str:
    """Render a talk or poster item."""
    location = entry.render_location()
    meeting = entry.render_meeting()

    # Build content: Title; Meeting, Location, Date
    parts = [entry.render_title()]
    if meeting:
        parts.append(meeting)
    if location:
        parts.append(location)

    content = "; ".join(parts[:2])
    if location:
        content += f", {location}"

    # Add date inline if available
    if entry.date_range:
        content += f", {entry.date_range.format_with_year()}"

    return (
        f'            <li>\n'
        f'                {content}{entry.render_note()}\n'
        f'            </li>'
    )


def render_event(entry: Entry) -> str:
    """Render an event item."""
    location = entry.render_location()

    # Build content: Title (which is the meeting for events), Location
    parts = [entry.render_title()]
    if location:
        parts.append(location)

    content = ", ".join(parts)

    return (
        f'            <li>\n'
        f'                <span class="flexspan">\n'
        f'                    <span class="title">{content}{entry.render_note()}</span>\n'
        f'                    <span class="date">{entry.render_date()}</span>\n'
        f'                </span>\n'
        f'            </li>'
    )


def render_publication(entry: Entry) -> str:
    """Render a publication item."""
    # If it has a BibEntry, use its rendering
    if entry.bib_entry:
        return entry.bib_entry.render_html()

    # Otherwise use the old format
    auth = f" ({entry.authors})" if entry.authors else ""
    return f'            <li>{entry.render_title()}{auth}</li>'


def generate_sections(entries: list[Entry]) -> dict[str, str]:
    """Generate all section HTML from entries."""
    sections = {
        "in_preparation": [],
        "published": [],
        "talks": [],
        "posters": [],
        "upcoming": defaultdict(list),
        "past": defaultdict(list),
    }

    today = datetime.now().date()

    for entry in entries:
        if entry.type == "publication":
            # Check if publication has a note (in preparation)
            has_note = entry.note or (entry.bib_entry and entry.bib_entry.note)
            if has_note:
                sections["in_preparation"].append(render_publication(entry))
            else:
                sections["published"].append(render_publication(entry))
        elif entry.type == "talk":
            sections["talks"].append(render_talk_or_poster(entry))
        elif entry.type == "poster":
            sections["posters"].append(render_talk_or_poster(entry))
        elif entry.type == "event":
            # Events without date go to upcoming with year "TBA"
            if not entry.date_range:
                sections["upcoming"]["TBA"].append(render_event(entry))
            # TBA events always go to upcoming
            elif entry.date_range.is_tba:
                year = entry.date_range.tba_year
                sections["upcoming"][year].append(render_event(entry))
            else:
                year = entry.date_range.start.year
                if entry.date_range.end >= today:
                    sections["upcoming"][year].append(render_event(entry))
                else:
                    sections["past"][year].append(render_event(entry))

    # Sort talks and posters by date (newest first)
    talks = sorted(
        [e for e in entries if e.type == "talk"],
        key=lambda x: x.date_range.start,
        reverse=True
    )
    posters = sorted(
        [e for e in entries if e.type == "poster"],
        key=lambda x: x.date_range.start,
        reverse=True
    )
    sections["talks"] = [render_talk_or_poster(t) for t in talks]
    sections["posters"] = [render_talk_or_poster(p) for p in posters]

    # Build upcoming/past sections with year grouping
    upcoming_html = []
    # Sort: TBA first, then numeric years in ascending order
    upcoming_years = sorted(sections["upcoming"].keys(
    ), key=lambda x: (x != "TBA", x if x == "TBA" else x))
    for year in upcoming_years:
        upcoming_html.append(
            f'        <details open="" class="secondaryDetails">')
        upcoming_html.append(f'            <summary>{year}</summary>')
        upcoming_html.append(f'            <ul>')
        upcoming_html.extend(sections["upcoming"][year])
        upcoming_html.append(f'            </ul>')
        upcoming_html.append(f'        </details>')

    past_html = []
    for year in sorted(sections["past"].keys(), reverse=True):
        past_html.append(f'        <details open="" class="secondaryDetails">')
        past_html.append(f'            <summary>{year}</summary>')
        past_html.append(f'            <ul>')
        past_html.extend(sections["past"][year])
        past_html.append(f'            </ul>')
        past_html.append(f'        </details>')

    # Build in_preparation section with subtitle if items exist
    in_prep_html = ""
    if sections["in_preparation"]:
        in_prep_html = f'        <div class="subtitle">In preparation</div>\n'
        in_prep_html += f'        <ul>\n'
        in_prep_html += "\n".join(sections["in_preparation"])
        in_prep_html += f'\n        </ul>'

    return {
        "in_preparation": in_prep_html,
        "published": "\n".join(sections["published"]),
        "talks": "\n".join(sections["talks"]),
        "posters": "\n".join(sections["posters"]),
        "upcoming": "\n".join(upcoming_html),
        "past": "\n".join(past_html),
    }


def generate_html(entries: list[Entry], template_path: Path) -> str:
    """Generate HTML using template and entries."""
    with open(template_path) as f:
        template = f.read()

    sections = generate_sections(entries)
    html = template.format(**sections)
    return html


def find_next_event_date(entries: list[Entry]) -> date | None:
    """Find the earliest upcoming event end date + 1 day (so it moves to past)."""
    from datetime import timedelta
    today = datetime.now().date()
    upcoming_dates = []

    for entry in entries:
        if entry.type == "event" and entry.date_range and entry.date_range.end >= today:
            upcoming_dates.append(entry.date_range.end)

    # Return the day AFTER the next event ends (so it will be in past when workflow runs)
    return (min(upcoming_dates) + timedelta(days=1)) if upcoming_dates else None


def generate_cron_for_date(target_date: date) -> str:
    """Generate cron expression to run at midnight UTC on target_date."""
    # cron format: minute hour day month day_of_week
    return f"0 0 {target_date.day} {target_date.month} *"


def update_workflow_schedule(next_run_date: date) -> None:
    """Update .github/workflows/generate-pages.yml with next event date."""
    root = Path(__file__).parent.parent
    workflow_path = root / ".github" / "workflows" / "generate-pages.yml"

    if not workflow_path.exists():
        return

    cron = generate_cron_for_date(next_run_date)
    date_str = next_run_date.strftime('%b %d, %Y')

    with open(workflow_path, 'r') as f:
        content = f.read()

    # Find and replace the cron line
    pattern = r"- cron: '[^']*'  # Run when .* ends"
    replacement = f"- cron: '{cron}'  # Run when {date_str} event ends"

    new_content = re.sub(pattern, replacement, content)

    with open(workflow_path, 'w') as f:
        f.write(new_content)


if __name__ == "__main__":
    # Load entries from different sources
    root = Path(__file__).parent.parent

    entries = []

    # Load bibliography from BibTeX file
    bib_path = root / "assets" / "data" / "resources.bib"
    bib_entries = parse_bibtex(bib_path)

    # Convert BibEntry to Entry objects for publication section
    for bib in bib_entries:
        entry = Entry(
            type="publication",
            title=bib.title or "",
            url=bib.url,
            bib_entry=bib
        )
        entries.append(entry)

    # Load other entries (talks, posters, events) from data.json
    json_path = root / "assets" / "data" / "data.json"
    try:
        json_entries = load_entries_from_json(json_path)
        entries.extend(json_entries)
    except FileNotFoundError:
        pass

    # Generate HTML using template
    template_path = root / "templates" / "research.html.template"
    html_content = generate_html(entries, template_path)

    # Write to file
    output_path = root / "research.html"
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    print(f"Generated {output_path}")

    # Update workflow schedule to run on next event end date
    next_date = find_next_event_date(entries)
    if next_date:
        update_workflow_schedule(next_date)
        print(
            f"Updated workflow schedule to run on {next_date.strftime('%b %d, %Y')}")
