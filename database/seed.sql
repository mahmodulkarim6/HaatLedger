-- Sample data (run after schema.sql)
INSERT INTO Farmer (name, phone, village, district) VALUES
('Abdur Rahim', '01711-100001', 'Mohanpur', 'Rajshahi'),
('Kamal Hossain', '01711-100002', 'Shibganj', 'Bogura'),
('Nasima Begum', '01811-100003', 'Godagari', 'Rajshahi'),
('Jahangir Alam', '01911-100004', 'Sherpur', 'Bogura'),
('Rafiqul Islam', '01611-100005', 'Pabna Sadar', 'Pabna'),
('Shirin Akter', '01511-100006', 'Ishwardi', 'Pabna'),
('Mizanur Rahman', '01711-100007', 'Savar', 'Dhaka');
INSERT INTO Crop (crop_name, category) VALUES
('Potato', 'Vegetable'),
('Rice (Aman)', 'Grain'),
('Tomato', 'Vegetable'),
('Mango', 'Fruit'),
('Onion', 'Spice'),
('Lentil', 'Pulse');
INSERT INTO Market (market_name, district, market_day) VALUES
('Shahjahanpur Haat', 'Bogura', 'Monday'),
('Kawran Bazar', 'Dhaka', 'Daily'),
('Rajshahi Aratdar Market', 'Rajshahi', 'Saturday'),
('Pabna Mohan Bazar', 'Pabna', 'Thursday');
INSERT INTO Buyer (name, buyer_type, phone, market_id) VALUES
('Karim Traders', 'Wholesaler', '01722-200001', 2),
('Salam Enterprise', 'Wholesaler', '01822-200002', 1),
('Fresh Bite Restaurant', 'Restaurant', '01922-200003', 2),
('Rina Grocery', 'Retailer', '01622-200004', 3),
('Alam Brothers', 'Wholesaler', '01522-200005', 4);
INSERT INTO Supply (farmer_id, crop_id, market_id, quantity_kg, price_per_kg, supply_date) VALUES
(1, 1, 3, 500, 26, '2026-09-02'),
(1, 5, 3, 300, 48, '2026-09-05'),
(2, 1, 1, 800, 24, '2026-09-03'),
(2, 3, 1, 400, 35, '2026-09-08'),
(3, 4, 3, 250, 95, '2026-09-10'),
(3, 2, 3, 1000, 52, '2026-09-12'),
(4, 1, 2, 600, 29, '2026-09-14'),
(4, 6, 2, 350, 110, '2026-09-15'),
(5, 3, 4, 450, 32, '2026-09-17'),
(5, 5, 4, 500, 45, '2026-09-18'),
(6, 2, 4, 900, 50, '2026-09-20'),
(7, 3, 2, 300, 38, '2026-09-22');
INSERT INTO Purchase (supply_id, buyer_id, quantity_kg, total_price, purchase_date, payment_status) VALUES
(1, 4, 300, 7800, '2026-09-03', 'Paid'),
(1, 1, 200, 5200, '2026-09-04', 'Due'),
(2, 4, 300, 14400, '2026-09-06', 'Paid'),
(3, 2, 500, 12000, '2026-09-04', 'Paid'),
(3, 1, 300, 7200, '2026-09-05', 'Due'),
(4, 2, 400, 14000, '2026-09-09', 'Paid'),
(5, 4, 250, 23750, '2026-09-11', 'Due'),
(6, 4, 600, 31200, '2026-09-13', 'Paid'),
(7, 1, 400, 11600, '2026-09-15', 'Paid'),
(7, 3, 200, 5800, '2026-09-16', 'Due'),
(8, 3, 350, 38500, '2026-09-16', 'Paid'),
(9, 5, 450, 14400, '2026-09-18', 'Due'),
(10, 5, 500, 22500, '2026-09-19', 'Paid'),
(11, 5, 900, 45000, '2026-09-21', 'Paid'),
(12, 1, 300, 11400, '2026-09-23', 'Due');
