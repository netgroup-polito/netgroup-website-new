# Netgroup Website Data Management

This website is designed so that its content can be modified easily without having to edit HTML or JavaScript code directly. All content lives in small YAML files under `content/`, one file per person, project, course or research topic. A build script turns them into the JSON files in `data/` that the website reads.

There are two ways to edit the content:

1. **In the browser, with Pages CMS** (no git or YAML knowledge needed). See [Editing with Pages CMS](#editing-with-pages-cms).
2. **By editing the YAML files directly.** See below.

## Content layout

```
content/
  pages/          page-level settings: titles, descriptions, categories
    home.yaml       welcome text and research directions on the home page
    people.yaml     people categories (in display order) and the "In Memoriam" section
    projects.yaml   project sections (EU / National)
    research.yaml   research page title and description
    teaching.yaml   teaching page title and description
  people/         one file per person
  projects/       one file per project
  research/       one file per research topic
  teaching/       one file per course
```

### Common tasks

*   **Add a person**: copy an existing file in `content/people/`, rename it (e.g. `mario-rossi.yaml`), and edit it. Put the photo in `assets/people/`.
*   **Move someone to Past Collaborators**: change `category: PhD Students` to `category: Past Collaborators` and set `left:` to the year.
*   **Reorder entries**: change the `order:` number. Lower numbers are shown first. Projects are sorted by year and courses by name automatically.
*   **Remove an entry**: delete its file.

Example (`content/people/mario-rossi.yaml`):

```yaml
name: Mario Rossi
category: PhD Students
order: 140
role: PhD Student
photo: assets/people/mario_rossi.jpg
email: mario.rossi@polito.it
joined: 2025
links:
  - text: Publications
    url: https://scholar.google.com/citations?user=XXXXXXX
description: Long text can span multiple lines like this,
  with no quotes or escaping needed.
```

If you edit files by hand, run `npm run format` before committing (see [Formatting](#formatting)).

Allowed fields for each collection are listed at the top of `scripts/build_data.py`. The `category` value must match one of the titles in `content/pages/people.yaml`.

### Publications

`data/publications.json` is generated automatically by `scripts/fetch_publications.py`. The script fetches Google Scholar data for every person with a `Publications` link pointing to Google Scholar. Please avoid editing it by hand.

```bash
python3 scripts/fetch_publications.py
```

## Building and testing locally

The files `data/home.json`, `people.json`, `projects.json`, `research.json` and `teaching.json` are **generated** and not tracked by git. Do not edit them; edit `content/` instead.

```bash
pip install -r requirements.txt        # once
python3 scripts/build_data.py          # validate content/ and regenerate data/*.json
python3 -m http.server 8000            # open http://localhost:8000
```

`python3 scripts/build_data.py --check` only validates, without writing files. It reports typos in field names, unknown categories, missing required fields, broken YAML, and missing image files. The same check runs on GitHub for every push that touches `content/`, and the Docker image build runs `build_data.py` automatically.

## Formatting

Files in `content/` are kept in exactly the format Pages CMS writes when it saves: same YAML library and settings, empty fields removed, fields in the order of the forms in `.pages.yml`. A CMS save then only changes the lines you actually edited.

After editing YAML files by hand, normalize them before committing:

```bash
npm install          # once
npm run format       # rewrite content/ in Pages CMS format
npm run format:check # only check (this also runs on GitHub)
```

## Editing with Pages CMS

[Pages CMS](https://pagescms.org) is a free, hosted editor that gives a form-based UI on top of the files in this repository. Every save becomes a commit. Its configuration is in `.pages.yml`.

Setup (once):

1. Go to [app.pagescms.org](https://app.pagescms.org) and sign in with GitHub.
2. Install the Pages CMS GitHub App on this repository when prompted. An organization admin may need to approve it.
3. Open the repository in Pages CMS. You will see *People*, *Projects*, *Research topics*, *Courses* and the page settings in the sidebar.

Collaborators who are not on GitHub can be invited by email from the Pages CMS settings.

If you add or rename a people category or a project funding type, also update the matching `values` list in `.pages.yml` so the dropdown in the editor stays in sync.
