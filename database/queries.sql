-- CSE 311 SQL demonstration: Farmer-to-Market Crop Trading Management System
-- Run after schema.sql and seed.sql (npm run db:setup does both).

-- 1. SELECT with WHERE: farmers from Rajshahi district
SELECT name, village, district FROM Farmer WHERE district = 'Rajshahi';

-- 2. ORDER BY: supplies by price, highest first
SELECT supply_id, quantity_kg, price_per_kg, supply_date
FROM Supply ORDER BY price_per_kg DESC;

-- 3. JOIN: each supply with farmer, crop and market name
SELECT s.supply_id, f.name AS farmer, c.crop_name AS crop, m.market_name AS market, s.quantity_kg, s.price_per_kg
FROM Supply s
JOIN Farmer f ON f.farmer_id = s.farmer_id
JOIN Crop c   ON c.crop_id   = s.crop_id
JOIN Market m ON m.market_id = s.market_id
ORDER BY s.supply_date DESC;

-- 4. SUM + GROUP BY: total quantity supplied per crop
SELECT c.crop_name, SUM(s.quantity_kg) AS total_kg
FROM Supply s JOIN Crop c ON c.crop_id = s.crop_id
GROUP BY c.crop_name ORDER BY total_kg DESC;

-- 5. AVG + GROUP BY: average price per kg of each crop
SELECT c.crop_name, ROUND(AVG(s.price_per_kg), 2) AS avg_price
FROM Supply s JOIN Crop c ON c.crop_id = s.crop_id
GROUP BY c.crop_name ORDER BY avg_price DESC;

-- 6. COUNT + GROUP BY (LEFT JOIN): number of purchases by each buyer
SELECT b.name AS buyer, COUNT(p.purchase_id) AS purchases
FROM Buyer b LEFT JOIN Purchase p ON p.buyer_id = b.buyer_id
GROUP BY b.buyer_id, b.name ORDER BY purchases DESC;

-- 7. MAX / MIN: highest and lowest price per kg recorded
SELECT MAX(price_per_kg) AS highest_price, MIN(price_per_kg) AS lowest_price FROM Supply;

-- 8. Payments still due, per buyer (WHERE + JOIN + GROUP BY)
SELECT b.name AS buyer, SUM(p.total_price) AS amount_due
FROM Purchase p JOIN Buyer b ON b.buyer_id = p.buyer_id
WHERE p.payment_status = 'Due'
GROUP BY b.buyer_id, b.name ORDER BY amount_due DESC;

-- 9. Quantity still unsold in each supply
SELECT s.supply_id, c.crop_name, s.quantity_kg - COALESCE(SUM(p.quantity_kg), 0) AS kg_left
FROM Supply s
JOIN Crop c ON c.crop_id = s.crop_id
LEFT JOIN Purchase p ON p.supply_id = s.supply_id
GROUP BY s.supply_id, c.crop_name, s.quantity_kg
ORDER BY s.supply_id;

-- 10. INSERT: add a new farmer
INSERT INTO Farmer (name, phone, village, district) VALUES ('Sample Farmer', '01700-000000', 'Test Village', 'Rajshahi');

-- 11. UPDATE: mark a purchase as paid
UPDATE Purchase SET payment_status = 'Paid' WHERE purchase_id = 2;

-- 12. DELETE: remove farmers who have no supply record (removes the row inserted in step 10)
DELETE FROM Farmer WHERE farmer_id NOT IN (SELECT DISTINCT farmer_id FROM Supply);
