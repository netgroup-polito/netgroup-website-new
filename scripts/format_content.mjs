// Rewrite content/ YAML files exactly the way Pages CMS saves them, so that saving a
// file in the CMS only shows the fields you actually changed in the git diff.
//
// Mirrors Pages CMS (lib/serialization.ts, lib/schema.ts): same `yaml` package and
// default stringify options, empty values removed, keys in the order of .pages.yml fields.
//
// Usage:
//   npm run format         # rewrite files in place
//   npm run format:check   # list files that are not formatted, exit 1 if any
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const check = process.argv.includes("--check");

const config = YAML.parse(fs.readFileSync(path.join(ROOT, ".pages.yml"), "utf8"));
const components = config.components || {};

// Resolve `component:` references so we know each field's nested fields.
const resolve = (field) => (field.component ? { ...components[field.component], ...field } : field);

// Same as sanitizeObject in Pages CMS lib/schema.ts.
const isEmpty = (val) => val == null || val === "";
const sanitize = (object) => {
  if (Array.isArray(object)) {
    return object
      .map((val) => (val && typeof val === "object" ? sanitize(val) : val))
      .filter((val) => !isEmpty(val));
  }
  if (object && typeof object === "object") {
    const copy = { ...object };
    for (const key of Object.keys(copy)) {
      if (copy[key] && typeof copy[key] === "object") copy[key] = sanitize(copy[key]);
      const val = copy[key];
      if (
        (Array.isArray(val) && val.every(isEmpty)) ||
        (val && typeof val === "object" && !Array.isArray(val) && !Object.keys(val).length) ||
        isEmpty(val)
      ) {
        delete copy[key];
      }
    }
    return copy;
  }
  return object;
};

// Put keys in the order the CMS form defines them; keys not in the form go last.
const order = (value, fields) => {
  if (!fields) return value;
  if (Array.isArray(value)) return value.map((item) => order(item, fields));
  if (!value || typeof value !== "object") return value;
  const result = {};
  for (const field of fields.map(resolve)) {
    if (field.name in value) result[field.name] = order(value[field.name], field.fields);
  }
  for (const key of Object.keys(value)) {
    if (!(key in result)) result[key] = value[key];
  }
  return result;
};

const format = (source, fields) => {
  const data = YAML.parse(source, { strict: false, uniqueKeys: false }) ?? {};
  const cleaned = sanitize(order(data, fields));
  return Object.keys(cleaned).length ? YAML.stringify(cleaned) : "";
};

const files = [];
for (const entry of config.content) {
  if (entry.type === "file") {
    files.push({ file: path.join(ROOT, entry.path), fields: entry.fields });
  } else {
    const dir = path.join(ROOT, entry.path);
    for (const name of fs.readdirSync(dir).sort()) {
      if (/\.ya?ml$/.test(name) && !name.startsWith("_")) {
        files.push({ file: path.join(dir, name), fields: entry.fields });
      }
    }
  }
}

const changed = [];
for (const { file, fields } of files) {
  const source = fs.readFileSync(file, "utf8");
  let formatted;
  try {
    formatted = format(source, fields);
  } catch (error) {
    console.error(`${path.relative(ROOT, file)}: invalid YAML\n  ${error.message}`);
    process.exitCode = 1;
    continue;
  }
  if (formatted !== source) {
    changed.push(path.relative(ROOT, file));
    if (!check) fs.writeFileSync(file, formatted);
  }
}

if (check && changed.length) {
  console.error(`${changed.length} file(s) are not formatted like Pages CMS saves them:`);
  for (const file of changed) console.error(`  - ${file}`);
  console.error("\nRun `npm install && npm run format` and commit the result.");
  process.exitCode = 1;
} else {
  console.log(check ? "All content files are formatted." : `Formatted ${changed.length} of ${files.length} file(s).`);
}
