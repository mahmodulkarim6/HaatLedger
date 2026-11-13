# HaatLedger: Farmer-to-Market Crop Trading Management System (CSE 311)

Next.js (frontend + API routes) with a MySQL database. Deploys to Vercel.

## Pages
Login (one shared admin password), Dashboard (market price ticker, charts), Farmers, Crops, Markets, Buyers, Supplies and Purchases (add, edit, delete, search) and Report (Excel downloads).

## Run on your computer
1. Install Node.js 20+ and MySQL (or use a free cloud MySQL, see below).
2. `npm install`
3. Copy `.env.example` to `.env.local` and fill in your database details (use `DB_SSL=false` for local MySQL) and choose an `ADMIN_PASSWORD`.
4. Create the tables and sample data: `npm run db:setup` (use `npm run db:reset` to start over).
5. `npm run dev` and open https://haatledger.vercel.app/

## Deploy to Vercel
Vercel does not host MySQL, so use a cloud MySQL first. Free options: TiDB Cloud Serverless, Aiven, Railway.
1. Create a MySQL database and copy its connection string.
2. Put it in `.env.local` as `DATABASE_URL`, with `DB_SSL=true`, then run `npm run db:setup` once from your computer.
3. Push this folder to a GitHub repository (`.env.local` is git-ignored; never upload it).
4. In Vercel choose "Add New Project", import the repository (framework: Next.js).
5. Add the environment variables `DATABASE_URL`, `DB_SSL=true` and `ADMIN_PASSWORD`, then deploy.

## Reports (Excel)
The Report page downloads .xlsx files: one full workbook (summary plus every table), one file per table, or an individual report for a chosen farmer, buyer or crop. The files are built on the server by `lib/reports.js` and `lib/xlsx.js` (no extra package needed).

## Database files
- `database/schema.sql`: 6 tables (Farmer, Crop, Market, Buyer, Supply, Purchase) with primary keys, foreign keys and checks.
- `database/seed.sql`: sample data (7 farmers, 6 crops, 4 markets, 5 buyers, 12 supplies, 15 purchases).
- `database/queries.sql`: every required SQL operation (SELECT, WHERE, ORDER BY, JOIN, COUNT, SUM, AVG, MAX, MIN, GROUP BY, INSERT, UPDATE, DELETE) for the demonstration.

## Business rules
- A purchase cannot be larger than the quantity still unsold in its supply.
- A supply's quantity cannot be reduced below what is already sold.
- `Purchase.total_price` is stored at purchase time and recalculated automatically if the supply price is edited.
- A record that other records depend on cannot be deleted (foreign keys).
- One admin user: every page and API route needs the shared `ADMIN_PASSWORD` login (7-day cookie). Use "Log out" in the menu to sign out.
