// Builds the Excel reports. `query(sql, params)` must resolve to an array of row objects.
import { buildXlsx, tableSheet, summarySheet } from './xlsx';

export class ReportError extends Error { constructor(status, message) { super(message); this.status = status; } }

const J = {
  supply: 'FROM Supply s JOIN Farmer f ON f.farmer_id = s.farmer_id JOIN Crop c ON c.crop_id = s.crop_id JOIN Market m ON m.market_id = s.market_id',
  purchase: 'FROM Purchase p JOIN Supply s ON s.supply_id = p.supply_id JOIN Crop c ON c.crop_id = s.crop_id JOIN Farmer f ON f.farmer_id = s.farmer_id JOIN Buyer b ON b.buyer_id = p.buyer_id JOIN Market m ON m.market_id = s.market_id',
};

const supplySql = (where = '') => `SELECT s.supply_id, s.supply_date, f.name AS farmer, c.crop_name AS crop, m.market_name AS market,
  s.quantity_kg, s.price_per_kg, COALESCE(SUM(p.quantity_kg), 0) AS sold_kg, s.quantity_kg - COALESCE(SUM(p.quantity_kg), 0) AS left_kg
  ${J.supply} LEFT JOIN Purchase p ON p.supply_id = s.supply_id ${where}
  GROUP BY s.supply_id, s.supply_date, f.name, c.crop_name, m.market_name, s.quantity_kg, s.price_per_kg ORDER BY s.supply_id`;

const purchaseSql = (where = '') => `SELECT p.purchase_id, p.purchase_date, c.crop_name AS crop, f.name AS farmer, b.name AS buyer, b.buyer_type,
  m.market_name AS market, p.quantity_kg, s.price_per_kg, p.total_price, p.payment_status
  ${J.purchase} ${where} ORDER BY p.purchase_id`;

const cols = {
  supplies: [
    { h: 'ID', k: 'supply_id', t: 'id', w: 8 }, { h: 'Date', k: 'supply_date', t: 'date', w: 13 },
    { h: 'Farmer', k: 'farmer', w: 22 }, { h: 'Crop', k: 'crop', w: 16 }, { h: 'Market', k: 'market', w: 24 },
    { h: 'Quantity (kg)', k: 'quantity_kg', t: 'qty', w: 15 }, { h: 'Price (Tk/kg)', k: 'price_per_kg', t: 'money', w: 15 },
    { h: 'Sold (kg)', k: 'sold_kg', t: 'qty', w: 12 }, { h: 'Left (kg)', k: 'left_kg', t: 'qty', w: 12 },
  ],
  purchases: [
    { h: 'ID', k: 'purchase_id', t: 'id', w: 8 }, { h: 'Date', k: 'purchase_date', t: 'date', w: 13 },
    { h: 'Crop', k: 'crop', w: 16 }, { h: 'Farmer', k: 'farmer', w: 22 }, { h: 'Buyer', k: 'buyer', w: 22 },
    { h: 'Buyer type', k: 'buyer_type', w: 13 }, { h: 'Market', k: 'market', w: 24 },
    { h: 'Quantity (kg)', k: 'quantity_kg', t: 'qty', w: 15 }, { h: 'Price (Tk/kg)', k: 'price_per_kg', t: 'money', w: 15 },
    { h: 'Total (Tk)', k: 'total_price', t: 'money', w: 15 }, { h: 'Payment', k: 'payment_status', w: 11 },
  ],
};

const sum = (rows, k) => Math.round(rows.reduce((a, r) => a + (Number(r[k]) || 0), 0) * 100) / 100;
const sumWhere = (rows, k, pred) => sum(rows.filter(pred), k);
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'report';
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dhaka' }).format(new Date());
const stamp = () => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', dateStyle: 'medium', timeStyle: 'short' }).format(new Date()) + ' (Bangladesh time)';

const listSheets = {
  farmers: (query) => query(`SELECT f.farmer_id, f.name, f.phone, f.village, f.district,
    (SELECT COUNT(*) FROM Supply s WHERE s.farmer_id = f.farmer_id) AS supplies,
    (SELECT COALESCE(SUM(s.quantity_kg), 0) FROM Supply s WHERE s.farmer_id = f.farmer_id) AS supplied_kg,
    (SELECT COALESCE(SUM(p.total_price), 0) FROM Purchase p JOIN Supply s ON s.supply_id = p.supply_id WHERE s.farmer_id = f.farmer_id) AS sales_value
    FROM Farmer f ORDER BY f.farmer_id`).then((rows) => tableSheet('Farmers', 'HaatLedger: Farmers report', [
    { h: 'ID', k: 'farmer_id', t: 'id', w: 8 }, { h: 'Name', k: 'name', w: 24 }, { h: 'Phone', k: 'phone', w: 16 },
    { h: 'Village', k: 'village', w: 18 }, { h: 'District', k: 'district', w: 16 }, { h: 'Supplies', k: 'supplies', t: 'int', w: 11 },
    { h: 'Supplied (kg)', k: 'supplied_kg', t: 'qty', w: 15 }, { h: 'Sales value (Tk)', k: 'sales_value', t: 'money', w: 17 },
  ], rows, ['supplies', 'supplied_kg', 'sales_value'])),

  buyers: (query) => query(`SELECT b.buyer_id, b.name, b.buyer_type, b.phone, m.market_name AS market,
    (SELECT COUNT(*) FROM Purchase p WHERE p.buyer_id = b.buyer_id) AS purchases,
    (SELECT COALESCE(SUM(p.quantity_kg), 0) FROM Purchase p WHERE p.buyer_id = b.buyer_id) AS bought_kg,
    (SELECT COALESCE(SUM(p.total_price), 0) FROM Purchase p WHERE p.buyer_id = b.buyer_id) AS spent,
    (SELECT COALESCE(SUM(p.total_price), 0) FROM Purchase p WHERE p.buyer_id = b.buyer_id AND p.payment_status = 'Due') AS due
    FROM Buyer b JOIN Market m ON m.market_id = b.market_id ORDER BY b.buyer_id`).then((rows) => tableSheet('Buyers', 'HaatLedger: Buyers report', [
    { h: 'ID', k: 'buyer_id', t: 'id', w: 8 }, { h: 'Name', k: 'name', w: 24 }, { h: 'Type', k: 'buyer_type', w: 13 },
    { h: 'Phone', k: 'phone', w: 16 }, { h: 'Market', k: 'market', w: 24 }, { h: 'Purchases', k: 'purchases', t: 'int', w: 12 },
    { h: 'Bought (kg)', k: 'bought_kg', t: 'qty', w: 14 }, { h: 'Total spent (Tk)', k: 'spent', t: 'money', w: 17 },
    { h: 'Payment due (Tk)', k: 'due', t: 'money', w: 17 },
  ], rows, ['purchases', 'bought_kg', 'spent', 'due'])),

  crops: (query) => query(`SELECT c.crop_id, c.crop_name, c.category,
    (SELECT COUNT(*) FROM Supply s WHERE s.crop_id = c.crop_id) AS supplies,
    (SELECT COALESCE(SUM(s.quantity_kg), 0) FROM Supply s WHERE s.crop_id = c.crop_id) AS supplied_kg,
    (SELECT ROUND(AVG(s.price_per_kg), 2) FROM Supply s WHERE s.crop_id = c.crop_id) AS avg_price,
    (SELECT COALESCE(SUM(p.total_price), 0) FROM Purchase p JOIN Supply s ON s.supply_id = p.supply_id WHERE s.crop_id = c.crop_id) AS sales_value
    FROM Crop c ORDER BY c.crop_id`).then((rows) => tableSheet('Crops', 'HaatLedger: Crops report', [
    { h: 'ID', k: 'crop_id', t: 'id', w: 8 }, { h: 'Crop', k: 'crop_name', w: 20 }, { h: 'Category', k: 'category', w: 14 },
    { h: 'Supplies', k: 'supplies', t: 'int', w: 11 }, { h: 'Supplied (kg)', k: 'supplied_kg', t: 'qty', w: 15 },
    { h: 'Avg price (Tk/kg)', k: 'avg_price', t: 'money', w: 17 }, { h: 'Sales value (Tk)', k: 'sales_value', t: 'money', w: 17 },
  ], rows, ['supplies', 'supplied_kg', 'sales_value'])),

  markets: (query) => query(`SELECT m.market_id, m.market_name, m.district, m.market_day,
    (SELECT COUNT(*) FROM Buyer b WHERE b.market_id = m.market_id) AS buyers,
    (SELECT COUNT(*) FROM Supply s WHERE s.market_id = m.market_id) AS supplies,
    (SELECT COALESCE(SUM(s.quantity_kg), 0) FROM Supply s WHERE s.market_id = m.market_id) AS supplied_kg
    FROM Market m ORDER BY m.market_id`).then((rows) => tableSheet('Markets', 'HaatLedger: Markets report', [
    { h: 'ID', k: 'market_id', t: 'id', w: 8 }, { h: 'Market', k: 'market_name', w: 26 }, { h: 'District', k: 'district', w: 16 },
    { h: 'Market day', k: 'market_day', w: 14 }, { h: 'Buyers', k: 'buyers', t: 'int', w: 10 },
    { h: 'Supplies', k: 'supplies', t: 'int', w: 11 }, { h: 'Supplied (kg)', k: 'supplied_kg', t: 'qty', w: 15 },
  ], rows, ['buyers', 'supplies', 'supplied_kg'])),

  supplies: (query) => query(supplySql()).then((rows) => tableSheet('Supplies', 'HaatLedger: Supplies report', cols.supplies, rows, ['quantity_kg', 'sold_kg', 'left_kg'])),
  purchases: (query) => query(purchaseSql()).then((rows) => tableSheet('Purchases', 'HaatLedger: Purchases report', cols.purchases, rows, ['quantity_kg', 'total_price'])),
};

const files = (name) => `${name}-${today()}.xlsx`;

async function fullReport(query) {
  const names = ['farmers', 'buyers', 'crops', 'markets', 'supplies', 'purchases'];
  const sheets = await Promise.all(names.map((n) => listSheets[n](query)));
  const supplies = await query(supplySql());
  const purchases = await query(purchaseSql());
  const paid = sumWhere(purchases, 'total_price', (r) => r.payment_status === 'Paid');
  const due = sumWhere(purchases, 'total_price', (r) => r.payment_status === 'Due');
  const summary = summarySheet('Summary', 'HaatLedger: Full report', [
    ['Generated', stamp()],
    ['Farmers', sheets[0].rows.length, 'int'], ['Buyers', sheets[1].rows.length, 'int'], ['Crops', sheets[2].rows.length, 'int'],
    ['Markets', sheets[3].rows.length, 'int'], ['Supplies', supplies.length, 'int'], ['Purchases', purchases.length, 'int'],
    ['Total supplied (kg)', sum(supplies, 'quantity_kg'), 'qty'], ['Total sales (Tk)', sum(purchases, 'total_price'), 'money'],
    ['Paid (Tk)', paid, 'money'], ['Payment due (Tk)', due, 'money'],
  ]);
  return { filename: files('haatledger-full-report'), buffer: buildXlsx([summary, ...sheets]) };
}

async function individual(type, id, query) {
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) throw new ReportError(400, `Choose a ${type} first.`);
  const cfg = {
    farmer: { sql: 'SELECT * FROM Farmer WHERE farmer_id = ?', nameKey: 'name', sWhere: 'WHERE s.farmer_id = ?', pWhere: 'WHERE s.farmer_id = ?' },
    buyer: { sql: 'SELECT b.*, m.market_name AS market FROM Buyer b JOIN Market m ON m.market_id = b.market_id WHERE b.buyer_id = ?', nameKey: 'name', pWhere: 'WHERE p.buyer_id = ?' },
    crop: { sql: 'SELECT * FROM Crop WHERE crop_id = ?', nameKey: 'crop_name', sWhere: 'WHERE s.crop_id = ?', pWhere: 'WHERE s.crop_id = ?' },
  }[type];
  const [row] = await query(cfg.sql, [num]);
  if (!row) throw new ReportError(404, `That ${type} was not found.`);
  const supplies = cfg.sWhere ? await query(supplySql(cfg.sWhere), [num]) : [];
  const purchases = await query(purchaseSql(cfg.pWhere), [num]);
  const paid = sumWhere(purchases, 'total_price', (r) => r.payment_status === 'Paid');
  const due = sumWhere(purchases, 'total_price', (r) => r.payment_status === 'Due');
  const name = row[cfg.nameKey];
  const head = [['Generated', stamp()]];
  const pairs = {
    farmer: [...head, ['Farmer', name], ['Phone', row.phone], ['Village', row.village], ['District', row.district],
      ['Supplies', supplies.length, 'int'], ['Total supplied (kg)', sum(supplies, 'quantity_kg'), 'qty'], ['Sold so far (kg)', sum(supplies, 'sold_kg'), 'qty'],
      ['Sales value (Tk)', sum(purchases, 'total_price'), 'money'], ['Paid (Tk)', paid, 'money'], ['Payment due (Tk)', due, 'money']],
    buyer: [...head, ['Buyer', name], ['Type', row.buyer_type], ['Phone', row.phone], ['Market', row.market],
      ['Purchases', purchases.length, 'int'], ['Total bought (kg)', sum(purchases, 'quantity_kg'), 'qty'],
      ['Total spent (Tk)', sum(purchases, 'total_price'), 'money'], ['Paid (Tk)', paid, 'money'], ['Payment due (Tk)', due, 'money']],
    crop: [...head, ['Crop', name], ['Category', row.category],
      ['Supplies', supplies.length, 'int'], ['Total supplied (kg)', sum(supplies, 'quantity_kg'), 'qty'],
      ['Average price (Tk/kg)', supplies.length ? Math.round((supplies.reduce((a, r) => a + Number(r.price_per_kg), 0) / supplies.length) * 100) / 100 : 0, 'money'],
      ['Sales value (Tk)', sum(purchases, 'total_price'), 'money'], ['Paid (Tk)', paid, 'money'], ['Payment due (Tk)', due, 'money']],
  }[type];
  const label = type[0].toUpperCase() + type.slice(1);
  const sheets = [summarySheet('Summary', `HaatLedger: ${label} report`, pairs)];
  if (cfg.sWhere) sheets.push(tableSheet('Supplies', `${name}: supplies`, cols.supplies, supplies, ['quantity_kg', 'sold_kg', 'left_kg']));
  sheets.push(tableSheet('Purchases', `${name}: purchases`, cols.purchases, purchases, ['quantity_kg', 'total_price']));
  return { filename: files(`${type}-${slug(name)}-report`), buffer: buildXlsx(sheets) };
}

export async function buildReport(type, id, query) {
  if (type === 'all') return fullReport(query);
  if (listSheets[type]) {
    const sheet = await listSheets[type](query);
    return { filename: files(`haatledger-${type}-report`), buffer: buildXlsx([sheet]) };
  }
  if (['farmer', 'buyer', 'crop'].includes(type)) return individual(type, id, query);
  throw new ReportError(400, 'Unknown report type.');
}
