// Minimal .xlsx writer with no dependencies (an .xlsx file is a zip of XML files).
import { deflateRawSync } from 'node:zlib';

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

function zip(files) {
  const parts = [], central = [];
  let offset = 0;
  for (const f of files) {
    const name = Buffer.from(f.name), data = Buffer.from(f.data, 'utf8'), comp = deflateRawSync(data), crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8);
    lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0x21, 12); lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(name.length, 26);
    parts.push(lh, name, comp);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(8, 10); ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0x21, 14); ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(name.length, 28);
    ch.writeUInt32LE(offset, 42);
    central.push(ch, name);
    offset += 30 + name.length + comp.length;
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cd, end]);
}

const esc = (s) => String(s).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const colName = (i) => { let s = ''; for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s; return s; };

// Cell types and the style index each one uses (see STYLES below).
const STYLE = { text: 2, int: 3, money: 4, qty: 4, date: 5, label: 6, id: 10 };
const TOTAL_STYLE = { int: 8, money: 9, qty: 9 };

const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy\\-mm\\-dd"/></numFmts>
<fonts count="4">
<font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="15"/><color rgb="FF1D3FAE"/><name val="Calibri"/></font>
</fonts>
<fills count="4">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF1D3FAE"/><bgColor indexed="64"/></patternFill></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFEEF1FB"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="2">
<border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFD0D5E8"/></left><right style="thin"><color rgb="FFD0D5E8"/></right><top style="thin"><color rgb="FFD0D5E8"/></top><bottom style="thin"><color rgb="FFD0D5E8"/></bottom><diagonal/></border>
</borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="11">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/>
<xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="4" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
<xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="3" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="4" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1"/>
<xf numFmtId="1" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

const dateSerial = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s));
  return m ? Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000) : null;
};

function cellXml(ref, c) {
  const v = c?.v, t = c?.t || 'text';
  if (v === null || v === undefined || v === '') return `<c r="${ref}" s="${STYLE[t] ?? 2}"/>`;
  if (t === 'date') {
    const n = dateSerial(v);
    if (n !== null) return `<c r="${ref}" s="5"><v>${n}</v></c>`;
  } else if (t === 'int' || t === 'money' || t === 'qty' || t === 'id') {
    const n = Number(v);
    if (Number.isFinite(n)) return `<c r="${ref}" s="${STYLE[t]}"><v>${n}</v></c>`;
  }
  return `<c r="${ref}" s="${t === 'label' ? 6 : 2}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
}

function sheetXml(sh, first) {
  const rows = [];
  let r = 1;
  const width = Math.max(sh.widths?.length || 0, sh.header?.length || 0, ...sh.rows.map((x) => x.length), 1);
  if (sh.title) { rows.push(`<row r="1" ht="24" customHeight="1"><c r="A1" s="7" t="inlineStr"><is><t>${esc(sh.title)}</t></is></c></row>`); r = 3; }
  let headerRow = 0;
  if (sh.header) {
    headerRow = r;
    rows.push(`<row r="${r}" ht="24" customHeight="1">${sh.header.map((h, i) => `<c r="${colName(i)}${r}" s="1" t="inlineStr"><is><t>${esc(h)}</t></is></c>`).join('')}</row>`);
    r++;
  }
  const firstData = r;
  for (const row of sh.rows) {
    rows.push(`<row r="${r}">${row.map((c, i) => cellXml(`${colName(i)}${r}`, c)).join('')}</row>`);
    r++;
  }
  const lastData = r - 1;
  if (sh.totals?.length && sh.rows.length) {
    const cells = [];
    for (let i = 0; i < width; i++) {
      const ref = `${colName(i)}${r}`;
      if (i === 0) cells.push(`<c r="${ref}" s="6" t="inlineStr"><is><t>Total</t></is></c>`);
      else if (sh.totals.includes(i)) {
        const sum = sh.rows.reduce((a, row) => a + (Number(row[i]?.v) || 0), 0);
        const type = sh.rows[0][i]?.t;
        cells.push(`<c r="${ref}" s="${TOTAL_STYLE[type] || 9}"><f>SUM(${colName(i)}${firstData}:${colName(i)}${lastData})</f><v>${Math.round(sum * 100) / 100}</v></c>`);
      } else cells.push(`<c r="${ref}" s="6"/>`);
    }
    rows.push(`<row r="${r}">${cells.join('')}</row>`);
  }
  const pane = headerRow ? `<pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/>` : '';
  const cols = (sh.widths || []).map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('');
  const filter = headerRow && sh.rows.length ? `<autoFilter ref="A${headerRow}:${colName(width - 1)}${lastData}"/>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"${first ? ' tabSelected="1"' : ''}>${pane}</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>${cols ? `<cols>${cols}</cols>` : ''}<sheetData>${rows.join('')}</sheetData>${filter}</worksheet>`;
}

export function buildXlsx(sheets) {
  const seen = new Set();
  const names = sheets.map((s) => {
    let base = s.name.replace(/[\\/?*[\]:]/g, ' ').trim().slice(0, 31) || 'Sheet', n = base, i = 2;
    while (seen.has(n.toLowerCase())) n = base.slice(0, 28) + ' ' + i++;
    seen.add(n.toLowerCase());
    return n;
  });
  const ns = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const files = [
    { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>` },
    { name: '_rels/.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${ns}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="${ns}"><sheets>${names.map((n, i) => `<sheet name="${esc(n)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${ns}/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length + 1}" Type="${ns}/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', data: STYLES },
    ...sheets.map((s, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, data: sheetXml(s, i === 0) })),
  ];
  return zip(files);
}

// Helpers used by lib/reports.js
// cols: [{ h: 'Header', k: 'row_key', t: 'text|int|money|qty|date|id', w: width }]
export function tableSheet(name, title, cols, rows, totalKeys = []) {
  return {
    name, title,
    header: cols.map((c) => c.h),
    widths: cols.map((c) => c.w || 16),
    rows: rows.map((r) => cols.map((c) => ({ v: r[c.k], t: c.t || 'text' }))),
    totals: totalKeys.map((k) => cols.findIndex((c) => c.k === k)).filter((i) => i > 0),
  };
}
// pairs: [label, value, type]
export function summarySheet(name, title, pairs) {
  return { name, title, header: null, widths: [30, 34], rows: pairs.map(([l, v, t]) => [{ v: l, t: 'label' }, { v, t: t || 'text' }]) };
}
