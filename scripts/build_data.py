"""Build the website's data/*.json files from the YAML sources in content/.

Usage:
    python3 scripts/build_data.py           # validate and write data/*.json
    python3 scripts/build_data.py --check   # validate only, write nothing

content/pages/<page>.yaml holds page-level settings (titles, descriptions, categories).
content/<collection>/*.yaml holds one entry (person, project, ...) per file.
"""
import json
import os
import re
import sys

import yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(ROOT, "content")
DATA = os.path.join(ROOT, "data")

# Fields allowed in each collection entry. "required" fields must be non-empty.
# `order` (lower first) and the category key are used for grouping/sorting and are
# not written to the output JSON.
SCHEMAS = {
    "people": {
        "required": ["name", "category"],
        "optional": ["order", "role", "photo", "email", "links", "description",
                     "thesisProposals", "joined", "left"],
    },
    "projects": {
        "required": ["name", "funding"],
        "optional": ["order", "fullName", "year", "url", "logo", "description", "referencePerson"],
    },
    "research": {
        "required": ["name"],
        "optional": ["order", "reference", "description", "links"],
    },
    "teaching": {
        "required": ["code", "name"],
        "optional": ["order", "link", "cdl", "year", "period", "instructors"],
    },
}
META_KEYS = {"order", "category", "funding"}


class Yaml12Loader(yaml.SafeLoader):
    """Read YAML 1.2 (core schema), the version Pages CMS writes.

    PyYAML implements YAML 1.1, where unquoted values like `No`, `on`, `1:30` or
    `2025-01-15` turn into booleans, numbers or dates. Pages CMS leaves them unquoted
    because in YAML 1.2 they are plain strings, so read them the same way.
    """


Yaml12Loader.yaml_implicit_resolvers = {}
for tag, pattern, first in [
    ("tag:yaml.org,2002:null", r"^(?:~|null|Null|NULL|)$", ["~", "n", "N", ""]),
    ("tag:yaml.org,2002:bool", r"^(?:true|True|TRUE|false|False|FALSE)$", list("tTfF")),
    ("tag:yaml.org,2002:int", r"^(?:[-+]?[0-9]+|0o[0-7]+|0x[0-9a-fA-F]+)$", list("-+0123456789")),
    ("tag:yaml.org,2002:float",
     r"^(?:[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)(?:[eE][-+]?[0-9]+)?"
     r"|[-+]?\.(?:inf|Inf|INF)|\.(?:nan|NaN|NAN))$", list("-+.0123456789")),
]:
    Yaml12Loader.add_implicit_resolver(tag, re.compile(pattern), first)


def construct_int_12(loader, node):
    value = loader.construct_scalar(node)
    if value.startswith("0o"):
        return int(value[2:], 8)
    if value.startswith("0x"):
        return int(value[2:], 16)
    return int(value)  # no YAML 1.1 octal: 010 is 10


Yaml12Loader.add_constructor("tag:yaml.org,2002:int", construct_int_12)


def drop_empty(value):
    """Remove null/empty values, like Pages CMS does when it saves a file."""
    empty = lambda v: v is None or v == "" or v == [] or v == {}
    if isinstance(value, dict):
        cleaned = {k: drop_empty(v) for k, v in value.items()}
        return {k: v for k, v in cleaned.items() if not empty(v)}
    if isinstance(value, list):
        return [v for v in (drop_empty(v) for v in value) if not empty(v)]
    return value


class BuildError(Exception):
    pass


errors = []
warnings = []  # reported, but don't fail the build


def rel(path):
    return os.path.relpath(path, ROOT)


def read_yaml(path):
    try:
        with open(path, encoding="utf-8") as f:
            data = yaml.load(f, Loader=Yaml12Loader)
    except yaml.YAMLError as e:
        errors.append(f"{rel(path)}: invalid YAML\n    {e}")
        return None
    if not isinstance(data, dict):
        errors.append(f"{rel(path)}: expected a set of 'key: value' fields at the top level")
        return None
    return drop_empty(data)


def load_page(name):
    path = os.path.join(CONTENT, "pages", f"{name}.yaml")
    if not os.path.exists(path):
        raise BuildError(f"missing page settings file {rel(path)}")
    return read_yaml(path) or {}


def check_links(path, entry, key):
    for i, link in enumerate(entry.get(key) or []):
        if not isinstance(link, dict) or not link.get("text") or not link.get("url"):
            errors.append(f"{rel(path)}: {key}[{i + 1}] needs both 'text' and 'url'")


def check_local_file(path, entry, key):
    value = entry.get(key)
    if value and not value.startswith(("http://", "https://")):
        if not os.path.exists(os.path.join(ROOT, value)):
            warnings.append(f"{rel(path)}: {key} '{value}' does not exist (a placeholder will be shown)")


def normalize_paths(entry, keys):
    # The CMS may write media paths as "/assets/..."; the site uses relative paths.
    for key in keys:
        if isinstance(entry.get(key), str) and entry[key].startswith("/assets/"):
            entry[key] = entry[key][1:]


def load_collection(name):
    folder = os.path.join(CONTENT, name)
    schema = SCHEMAS[name]
    allowed = set(schema["required"]) | set(schema["optional"])
    entries = []
    for filename in sorted(os.listdir(folder)):
        if not filename.endswith((".yaml", ".yml")) or filename.startswith("_"):
            continue
        path = os.path.join(folder, filename)
        entry = read_yaml(path)
        if entry is None:
            continue
        for key in schema["required"]:
            if entry.get(key) in (None, ""):
                errors.append(f"{rel(path)}: missing required field '{key}'")
        unknown = set(entry) - allowed
        if unknown:
            errors.append(f"{rel(path)}: unknown field(s) {sorted(unknown)}; "
                          f"allowed fields are {sorted(allowed)}")
        order = entry.get("order")
        if order is not None and not isinstance(order, (int, float)):
            errors.append(f"{rel(path)}: 'order' must be a number, got {order!r}")
            entry["order"] = None
        entry["_path"] = path
        entries.append(entry)

    def sort_key(e):
        order = e.get("order")
        return (order is None, order or 0, str(e.get("name") or e.get("code")))

    entries.sort(key=sort_key)
    return entries


def check_unique(entries, key):
    seen = {}
    for e in entries:
        value = e.get(key)
        if value in seen:
            errors.append(f"{rel(e['_path'])}: duplicate {key} '{value}' (also in {rel(seen[value])})")
        seen[value] = e["_path"]


def strip_meta(entry):
    return {k: v for k, v in entry.items() if k not in META_KEYS and k != "_path"}


def group(entries, key, categories, cat_key, page_path):
    known = [c.get(cat_key) for c in categories]
    for e in entries:
        if e.get(key) and e[key] not in known:
            errors.append(f"{rel(e['_path'])}: {key} '{e[key]}' is not one of {known} "
                          f"(defined in {rel(page_path)})")
    return {c.get(cat_key): [strip_meta(e) for e in entries if e.get(key) == c.get(cat_key)]
            for c in categories}


def build_people():
    page = load_page("people")
    entries = load_collection("people")
    check_unique(entries, "name")
    for e in entries:
        check_links(e["_path"], e, "links")
        normalize_paths(e, ["photo"])
        check_local_file(e["_path"], e, "photo")
    categories = page.get("categories") or []
    grouped = group(entries, "category", categories, "title",
                    os.path.join(CONTENT, "pages", "people.yaml"))
    out = {}
    if page.get("memorial"):
        normalize_paths(page["memorial"], ["photo"])
        out["memorial"] = page["memorial"]
    out["categories"] = [{**c, "people": grouped[c["title"]]} for c in categories]
    return out


def build_projects():
    page = load_page("projects")
    entries = load_collection("projects")
    check_unique(entries, "name")
    for e in entries:
        normalize_paths(e, ["logo"])
        check_local_file(e["_path"], e, "logo")
    categories = page.get("categories") or []
    grouped = group(entries, "funding", categories, "funding",
                    os.path.join(CONTENT, "pages", "projects.yaml"))
    return {**page, "categories": [{**c, "items": grouped[c["funding"]]} for c in categories]}


def build_research():
    page = load_page("research")
    entries = load_collection("research")
    for e in entries:
        check_links(e["_path"], e, "links")
    return {**page, "topics": [strip_meta(e) for e in entries]}


def build_teaching():
    page = load_page("teaching")
    entries = load_collection("teaching")
    check_unique(entries, "code")
    courses = [strip_meta(e) for e in entries]
    out = {k: v for k, v in page.items() if k != "sourceUrl"}
    out["courses"] = courses
    if "sourceUrl" in page:
        out["sourceUrl"] = page["sourceUrl"]
    return out


def build_all():
    return {
        "home": load_page("home"),
        "people": build_people(),
        "projects": build_projects(),
        "research": build_research(),
        "teaching": build_teaching(),
    }


def main():
    check_only = "--check" in sys.argv
    try:
        outputs = build_all()
    except BuildError as e:
        errors.append(str(e))
    for warning in warnings:
        print(f"warning: {warning}", file=sys.stderr)
    if errors:
        print(f"Found {len(errors)} problem(s) in content/:\n", file=sys.stderr)
        for err in errors:
            print(f"  - {err}", file=sys.stderr)
        sys.exit(1)
    if check_only:
        print("content/ is valid.")
        return
    os.makedirs(DATA, exist_ok=True)
    for name, data in outputs.items():
        with open(os.path.join(DATA, f"{name}.json"), "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"wrote data/{name}.json")


if __name__ == "__main__":
    main()
