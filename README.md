# Matthijs Lau's Website - Automation Guide

Your HTML pages are **auto-generated from JSON data**. No manual HTML editing needed!

## 🚀 How It Works

1. **You edit JSON files** (`assets/data/*.json`)
2. **Push to GitHub**
3. **GitHub Actions automatically:**
   - ✅ Validates your data
   - ✅ Generates new HTML pages
   - ✅ Commits changes back to main
   - ✅ Done in ~30 seconds

That's it! No more manual HTML work.

## 📝 What You Can Edit

### Research Content
**File:** `assets/data/data.json`

**Add a conference/event:**
```json
{
  "type": "event",
  "meeting": "Conference Name",
  "institute": "University Name (Country)",
  "date": {"start": "2026-06-01", "end": "2026-06-05"},
  "url": "https://conference.com"
}
```

**Add a talk:**
```json
{
  "type": "talk",
  "title": "My Talk Title",
  "meeting": "Conference Name",
  "institute": "University Name (Country)",
  "date": "2026-02-11",
  "url": "https://..."
}
```

**Add a poster:**
```json
{
  "type": "poster",
  "title": "Poster Title",
  "meeting": "Conference Name",
  "institute": "University Name (Country)",
  "date": "2025-07-02",
  "url": "https://drive.google.com/..."
}
```

### Teaching Content
**File:** `assets/data/teaching.json`

**Add a course:**
```json
{
  "title": "Course Name",
  "year": "2025/2026",
  "season": "Fall",
  "locationId": "Radboud"
}
```

Seasons: `Fall`, `Spring`, `Winter`, `Summer`

## ⚙️ Using the Workflow

### Push to Update Website

```bash
# 1. Edit JSON file
nano assets/data/data.json

# 2. Commit and push
git add assets/data/data.json
git commit -m "Add conference"
git push

# 3. GitHub Actions runs automatically
# → Check Actions tab to watch progress
# → HTML regenerates in ~30 seconds
```

### Automatic Date Updates (Upcoming → Past)

**The workflow handles this automatically!**

When you push, dates are recalculated:
- Events after today → **Upcoming** section
- Events before today → **Past** section

Just edit the date in `data.json` and push:
```json
{
  "type": "event",
  "meeting": "Old Conference",
  "institute": "MIT (USA)",
  "date": {"start": "2024-06-01", "end": "2024-06-05"}  // ← Changed date
}
```

Push → Automatically moves from "Upcoming" to "Past"

### Local Testing (Optional)

```bash
# Test before pushing
python validate_data.py    # Check for errors
python generate_all.py     # Generate locally
```

## 📋 Important Rules

| Rule | Example |
|------|---------|
| **Date format** | `"2026-02-11"` (ISO 8601) |
| **Always add country** | `"MIT (USA)"` not `"MIT"` |
| **Date range** | `{"start": "...", "end": "..."}` |
| **Season keywords** | `Fall`, `Spring`, `Winter`, `Summer` |
| **Don't edit HTML** | Always edit JSON instead |

## 📁 Essential Files

```
assets/data/
├── data.json              ← Your research content
└── teaching.json          ← Your teaching content

templates/
├── research.html.template ← Research page layout
└── teaching.html.template ← Teaching page layout

.github/workflows/
└── generate-pages.yml     ← GitHub automation

*.py files                 ← Generators (don't edit)
research.html              ← Auto-generated (don't edit)
teaching.html              ← Auto-generated (don't edit)
```

## ✅ Setup Checklist

- [ ] All Python scripts are in place (`generate_all.py`, etc.)
- [ ] `.github/workflows/generate-pages.yml` exists
- [ ] `assets/data/data.json` and `teaching.json` exist
- [ ] Template files exist in `templates/`
- [ ] Push to GitHub and watch **Actions** tab

## 🔍 Troubleshooting

**Workflow didn't run:**
- Did you push to `main` branch?
- Did you change JSON files?
- Check **Actions** tab for status

**HTML didn't update:**
- Run `python validate_data.py` locally
- Check for JSON syntax errors
- Check **Actions** tab logs for details

**JSON has errors:**
- Run: `python validate_data.py`
- Fix any errors shown
- Push again

## 💡 Examples

### Update an Event Date (to move it to Past)

```json
// Before:
{
  "type": "event",
  "meeting": "Conference",
  "institute": "MIT (USA)",
  "date": {"start": "2026-06-01", "end": "2026-06-05"}  // Future
}

// After:
{
  "type": "event",
  "meeting": "Conference",
  "institute": "MIT (USA)",
  "date": {"start": "2024-06-01", "end": "2024-06-05"}  // Past - auto-moves!
}
```

Push → Workflow runs → Event automatically in "Past" section

### Add Multiple Talks

```json
[
  {
    "type": "talk",
    "title": "Title 1",
    "meeting": "Conf A",
    "institute": "MIT (USA)",
    "date": "2026-02-11"
  },
  {
    "type": "talk",
    "title": "Title 2",
    "meeting": "Conf B",
    "institute": "Oxford (UK)",
    "date": "2026-03-20"
  }
]
```

---

**That's all you need to know!** Just edit JSON, push to GitHub, done.

---

**Updated:** February 2026 | **Python:** 3.11+ | **Status:** ✅ Active
