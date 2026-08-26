CREATE TABLE IF NOT EXISTS calculator_items (
 id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), item_type VARCHAR(10) NOT NULL CHECK(item_type IN('base','addon')),
 item_key VARCHAR(80) UNIQUE NOT NULL, label_zh VARCHAR(120) NOT NULL, icon VARCHAR(20) DEFAULT '⚙️',
 price_per_sqm NUMERIC(12,2) NOT NULL DEFAULT 0, is_active BOOLEAN NOT NULL DEFAULT true,
 sort_order INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO calculator_items(item_type,item_key,label_zh,icon,price_per_sqm,sort_order) VALUES
('base','glass','玻璃温室（文洛型）','🏗️',500,10),('base','pc','PC板温室（阳光板）','☀️',350,20),('base','solar','日光温室','🌱',280,30),('base','multi-span','薄膜连栋温室','🏛️',200,40),('base','arch','单体拱棚','⛺',120,50),
('addon','cooling','降温系统','❄️',40,10),('addon','heating','升温系统','🔥',30,20),('addon','irrigation','水肥一体化','💧',30,30),('addon','lighting','补光系统','💡',50,40),('addon','smart_control','智能控制','🤖',20,50)
ON CONFLICT(item_key) DO NOTHING;
