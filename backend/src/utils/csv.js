/**
 * Minimal CSV helpers - no external dependency needed.
 * Handles quoted fields, embedded commas, and escaped quotes ("").
 */

function escapeCsvField(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCsvField(c.label)).join(',');
  const lines = rows.map((row) =>
    columns.map((c) => escapeCsvField(row[c.key])).join(',')
  );
  return [header, ...lines].join('\r\n');
}

/**
 * Parses raw CSV text into an array of objects keyed by the header row.
 * Supports quoted fields with embedded commas/newlines/escaped quotes.
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = '';
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  const clean = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      pushField();
    } else if (ch === '\n') {
      pushRow();
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) pushRow();

  const nonEmptyRows = rows.filter((r) => !(r.length === 1 && r[0] === ''));
  if (nonEmptyRows.length === 0) return [];

  const header = nonEmptyRows[0].map((h) => h.trim().toLowerCase());
  return nonEmptyRows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, idx) => {
      obj[h] = (r[idx] || '').trim();
    });
    return obj;
  });
}

module.exports = { toCsv, parseCsv, escapeCsvField };