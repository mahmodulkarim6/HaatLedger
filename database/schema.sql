-- Farmer-to-Market Crop Trading Management System (CSE 311)
CREATE TABLE IF NOT EXISTS Farmer (
  farmer_id INT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  phone     VARCHAR(20),
  village   VARCHAR(100),
  district  VARCHAR(100) NOT NULL
);
CREATE TABLE IF NOT EXISTS Crop (
  crop_id   INT AUTO_INCREMENT PRIMARY KEY,
  crop_name VARCHAR(60) NOT NULL UNIQUE,
  category  VARCHAR(40)
);
CREATE TABLE IF NOT EXISTS Market (
  market_id   INT AUTO_INCREMENT PRIMARY KEY,
  market_name VARCHAR(100) NOT NULL,
  district    VARCHAR(100) NOT NULL,
  market_day  VARCHAR(20)
);
CREATE TABLE IF NOT EXISTS Buyer (
  buyer_id   INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  buyer_type VARCHAR(20) NOT NULL DEFAULT 'Wholesaler',
  phone      VARCHAR(20),
  market_id  INT NOT NULL,
  FOREIGN KEY (market_id) REFERENCES Market(market_id)
);
CREATE TABLE IF NOT EXISTS Supply (
  supply_id    INT AUTO_INCREMENT PRIMARY KEY,
  farmer_id    INT NOT NULL,
  crop_id      INT NOT NULL,
  market_id    INT NOT NULL,
  quantity_kg  DECIMAL(10,2) NOT NULL CHECK (quantity_kg > 0),
  price_per_kg DECIMAL(8,2)  NOT NULL CHECK (price_per_kg > 0),
  supply_date  DATE NOT NULL,
  FOREIGN KEY (farmer_id) REFERENCES Farmer(farmer_id),
  FOREIGN KEY (crop_id)   REFERENCES Crop(crop_id),
  FOREIGN KEY (market_id) REFERENCES Market(market_id)
);
CREATE TABLE IF NOT EXISTS Purchase (
  purchase_id    INT AUTO_INCREMENT PRIMARY KEY,
  supply_id      INT NOT NULL,
  buyer_id       INT NOT NULL,
  quantity_kg    DECIMAL(10,2) NOT NULL CHECK (quantity_kg > 0),
  total_price    DECIMAL(12,2) NOT NULL,
  purchase_date  DATE NOT NULL,
  payment_status VARCHAR(10) NOT NULL DEFAULT 'Due' CHECK (payment_status IN ('Paid','Due')),
  FOREIGN KEY (supply_id) REFERENCES Supply(supply_id),
  FOREIGN KEY (buyer_id)  REFERENCES Buyer(buyer_id)
);
