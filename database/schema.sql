-- ============================================
-- 山东京阳温室科技有限公司 数据库设计
-- PostgreSQL Schema  v2.0
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 管理员用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(100) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(50) DEFAULT 'admin',
  is_active     BOOLEAN DEFAULT true,
  last_login    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 客户咨询表 (messages)
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(200) NOT NULL,
  country         VARCHAR(100),
  phone           VARCHAR(50),
  email           VARCHAR(255),
  greenhouse_type VARCHAR(100),
  area            DECIMAL(10,2),
  message         TEXT,
  status          VARCHAR(50) DEFAULT 'new',
  source          VARCHAR(50) DEFAULT 'website',
  ip_address      VARCHAR(50),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 产品表
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          VARCHAR(200) UNIQUE NOT NULL,
  category      VARCHAR(100) NOT NULL,
  cover_image   VARCHAR(500),
  video_url     VARCHAR(500),
  price_per_sqm DECIMAL(10,2),
  is_active     BOOLEAN DEFAULT true,
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_translations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  lang        VARCHAR(10) NOT NULL,
  name        VARCHAR(300) NOT NULL,
  description TEXT,
  features    JSONB,
  specs       JSONB,
  is_locked   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, lang)
);

-- ============================================
-- 工程案例表
-- ============================================
CREATE TABLE IF NOT EXISTS cases (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            VARCHAR(200) UNIQUE NOT NULL,
  country         VARCHAR(100),
  province        VARCHAR(100),
  area            DECIMAL(12,2),
  greenhouse_type VARCHAR(100),
  cover_image     VARCHAR(500),
  images          JSONB DEFAULT '[]',
  video_url       VARCHAR(500),
  completion_date DATE,
  is_active       BOOLEAN DEFAULT true,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_translations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id     UUID REFERENCES cases(id) ON DELETE CASCADE,
  lang        VARCHAR(10) NOT NULL,
  title       VARCHAR(300) NOT NULL,
  description TEXT,
  highlights  JSONB,
  is_locked   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(case_id, lang)
);

-- ============================================
-- 新闻/文章表
-- ============================================
CREATE TABLE IF NOT EXISTS articles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug         VARCHAR(200) UNIQUE NOT NULL,
  cover_image  VARCHAR(500),
  category     VARCHAR(100) DEFAULT 'news',
  author_id    UUID REFERENCES users(id),
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  view_count   INTEGER DEFAULT 0,
  created_at   TIMESTAMP DEFAULT NOW(),
  updated_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_translations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  article_id       UUID REFERENCES articles(id) ON DELETE CASCADE,
  lang             VARCHAR(10) NOT NULL,
  title            VARCHAR(300) NOT NULL,
  summary          TEXT,
  content          TEXT,
  meta_title       VARCHAR(200),
  meta_description VARCHAR(300),
  is_locked        BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMP DEFAULT NOW(),
  UNIQUE(article_id, lang)
);

-- ============================================
-- 媒体文件表
-- ============================================
CREATE TABLE IF NOT EXISTS media (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename      VARCHAR(500) NOT NULL,
  original_name VARCHAR(500),
  file_type     VARCHAR(50),
  file_size     INTEGER,
  url           VARCHAR(500) NOT NULL,
  uploaded_by   UUID REFERENCES users(id),
  created_at    TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 预算计算记录
-- ============================================
CREATE TABLE IF NOT EXISTS calculator_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  greenhouse_type VARCHAR(100),
  area            DECIMAL(12,2),
  addons          JSONB DEFAULT '[]',
  total_price     DECIMAL(14,2),
  ip_address      VARCHAR(50),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 网站配置表
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  key        VARCHAR(200) PRIMARY KEY,
  value      TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calculator_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_type VARCHAR(10) NOT NULL CHECK(item_type IN('base','addon')),
  item_key VARCHAR(80) UNIQUE NOT NULL,
  label_zh VARCHAR(120) NOT NULL,
  icon VARCHAR(20) DEFAULT '⚙️',
  price_per_sqm NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contacts_status  ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_cat     ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active  ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_cases_active     ON cases(is_active);
CREATE INDEX IF NOT EXISTS idx_articles_pub     ON articles(is_published, published_at DESC);

-- ============================================
-- 管理员账号
-- 密码: Admin@123456  (bcrypt $2b$12, cost=12)
-- 这是 "password" 的 bcrypt hash，用于测试：$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.
-- 实际部署后请用 scripts/create-admin.js 重新生成
-- ============================================
INSERT INTO users (username, email, password_hash, role) VALUES
(
  'admin',
  'admin@jingyang-greenhouse.com',
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'superadmin'
)
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = 'superadmin';

-- ============================================
-- 产品数据
-- ============================================
INSERT INTO products (slug, category, price_per_sqm, sort_order) VALUES
  ('wenlo-glass',      'tech',    500, 1),
  ('pc-panel',         'tech',    350, 2),
  ('solar-room',       'tech',    280, 3),
  ('film-multispan',   'tech',    200, 4),
  ('single-arch',      'tech',    120, 5),
  ('cooling-sys',      'system',    0, 6),
  ('heating-sys',      'system',    0, 7),
  ('irrigation-sys',   'system',    0, 8),
  ('lighting-sys',     'system',    0, 9),
  ('seedbed-sys',      'system',    0,10),
  ('core-parts',       'parts',     0,11),
  ('struct-parts',     'parts',     0,12),
  ('heat-drive-parts', 'parts',     0,13)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO product_translations (product_id, lang, name, description, features, specs)
SELECT id,'zh','文洛型玻璃温室',
  '主体结构采用热镀锌钢制骨架，覆盖材料为国产优质浮法玻璃，透光率超过97%，顶部及周边为专业铝型材。外形美观、透光性强、寿命长，可配套内外遮阳、通风、水帘风机等系统实现自动化管理。',
  '["热镀锌钢骨架，耐久抗腐","透光率>97%，采光极佳","铝型材边框，外观精美","可配套全自动环控系统","适合花卉、蔬菜、育种"]',
  '{"跨度":"9.6m/12m","开间":"4m/5m","檐高":"4-6m","玻璃厚度":"4mm浮法玻璃","使用寿命":"20年以上"}'
FROM products WHERE slug='wenlo-glass' ON CONFLICT(product_id,lang) DO NOTHING;

INSERT INTO product_translations (product_id, lang, name, description, features, specs)
SELECT id,'zh','阳光板温室（PC板）',
  '主体结构采用冷轧高频焊管材，热镀锌螺栓连接，防腐性能好。覆盖材料为聚碳酸酯中空板（PC板），采光好、强度高、防结露，可配套各类环控系统实现自动化管理。',
  '["冷轧热镀锌骨架","PC板采光好强度高","防结露内表面处理","安装便捷重量轻","性价比高适合商业种植"]',
  '{"跨度":"8-12m","开间":"4-6m","檐高":"3-5m","PC板厚度":"8-16mm","使用寿命":"15年以上"}'
FROM products WHERE slug='pc-panel' ON CONFLICT(product_id,lang) DO NOTHING;

INSERT INTO product_translations (product_id, lang, name, description, features, specs)
SELECT id,'zh','日光温室',
  '通过配备内外遮阳、通风、水帘风机等系统实现对温度、湿度、光照等指标的自动化管控。保温效果好、投资低，受广大农村客户青睐，特别适合北方越冬生产。',
  '["保温效果极佳北方越冬首选","投资成本低","可配套遮阳通风系统","自动卷帘系统可选","适合蔬菜果树越冬生产"]',
  '{"跨度":"8-12m","长度":"60-100m","后墙高度":"2.5-3.5m","采光角":"≥26°","使用寿命":"15年以上"}'
FROM products WHERE slug='solar-room' ON CONFLICT(product_id,lang) DO NOTHING;

INSERT INTO product_translations (product_id, lang, name, description, features, specs)
SELECT id,'zh','薄膜连栋温室',
  '主体结构采用冷轧热镀锌管材，热镀锌螺栓连接，防腐性能好。顶部采用聚乙烯PO膜，外层防紫外线，内层防结露。外观大方，保温性能好，制造成本较低。',
  '["多跨连体土地利用率高","PO膜透光率高耐候性好","防紫外线+防结露双效","造价经济建设快","适合大规模蔬菜瓜果种植"]',
  '{"单跨跨度":"8-10m","连跨数量":"2-20跨","开间":"4m","檐高":"3-4m","薄膜寿命":"3-5年"}'
FROM products WHERE slug='film-multispan' ON CONFLICT(product_id,lang) DO NOTHING;

INSERT INTO product_translations (product_id, lang, name, description, features, specs)
SELECT id,'zh','单体拱棚（椭圆管棚）',
  '结构简单，造价低廉，搭建灵活，适用于各类作物种植、畜牧养殖，是最经济实用的温室类型之一，在农业生产中应用广泛。',
  '["结构简单造价最低","安装拆卸灵活便捷","适合多种作物种植","养殖种植两用","农村推广首选"]',
  '{"跨度":"6-12m","长度":"30-100m","肩高":"1.2-1.8m","顶高":"2.5-4m","骨架材料":"椭圆管/圆管"}'
FROM products WHERE slug='single-arch' ON CONFLICT(product_id,lang) DO NOTHING;

INSERT INTO product_translations (product_id, lang, name, description, features, specs)
SELECT id,'zh','温室降温系统',
  '湿帘波纹型设计采用空间交换技术，高吸水、抗霉变、使用寿命长，降温效率可达80%。风机配备高效节能电机，通过3C认证（IP55），采用进口轴承，风量大，运转费用低。',
  '["降温效率≥80%","湿帘高吸水抗霉变","风机通过3C认证IP55","进口轴承运行安静","全自动温控联动"]',
  '{"湿帘规格":"150mm/100mm厚","风机直径":"1380mm/1000mm","电机功率":"0.55-2.2kW"}'
FROM products WHERE slug='cooling-sys' ON CONFLICT(product_id,lang) DO NOTHING;

INSERT INTO product_translations (product_id, lang, name, description, features, specs)
SELECT id,'zh','温室升温系统',
  '锅炉系列采用循环燃烧技术，大幅提高燃烧效率，能在短时间内产生大量热水，运用物联网技术实现供水与水温自动化管理。暖风机系列风量大，热能效率高，可全自动运行。',
  '["循环燃烧高效节能","物联网自动化水温管理","暖风机风量大热效率高","全自动运行无需值守","适合北方寒冷地区"]',
  '{"锅炉功率":"10万-100万大卡","暖风机风量":"5000-30000m³/h","燃料类型":"天然气/燃油/生物质"}'
FROM products WHERE slug='heating-sys' ON CONFLICT(product_id,lang) DO NOTHING;

INSERT INTO product_translations (product_id, lang, name, description, features, specs)
SELECT id,'zh','温室喷灌系统',
  '利用高压泵喷淋，经喷头均匀喷洒在作物上，集灌溉、施肥和自动化管理于一体。可分为移动式灌溉、固定式灌溉和半固定式喷灌系统，满足不同规模需求。',
  '["水肥一体化管理","均匀喷洒节水高效","移动/固定/半固定三种模式","自动定时灌溉","适配各类温室规模"]',
  '{"灌溉方式":"喷灌/微灌/滴灌","控制方式":"手动/全自动","水泵功率":"0.75-7.5kW"}'
FROM products WHERE slug='irrigation-sys' ON CONFLICT(product_id,lang) DO NOTHING;

INSERT INTO product_translations (product_id, lang, name, description, features, specs)
SELECT id,'zh','温室补光系统',
  '采用灯光为植物提供生长所需光源，最大限度捕捉光能。尤其针对冬春两季日照时间短的特点，及时补光，防止作物生长缓慢、霉病、减产等问题。',
  '["LED/高压钠灯可选","针对冬春季补光","防止作物减产霉病","自动光照感应联动","节能长寿命灯具"]',
  '{"灯具类型":"LED植物灯/高压钠灯","功率":"50W-1000W","寿命":"50000小时+"}'
FROM products WHERE slug='lighting-sys' ON CONFLICT(product_id,lang) DO NOTHING;

INSERT INTO product_translations (product_id, lang, name, description, features, specs)
SELECT id,'zh','苗床系统',
  '苗床网面平整，承重性好，抗腐蚀且耐用。主体结构采用铝合金边框、热镀锌材料，防腐性能高、寿命长，利用面积可达90%以上，大幅提高温室空间利用率。',
  '["铝合金边框耐久防腐","空间利用率≥90%","网面平整承重性好","固定式/移动式可选","适合育苗花卉栽培"]',
  '{"苗床宽度":"1.2-1.8m","高度":"0.7-0.9m","网孔规格":"10×10mm","承重":"≥150kg/m²"}'
FROM products WHERE slug='seedbed-sys' ON CONFLICT(product_id,lang) DO NOTHING;

INSERT INTO product_translations (product_id, lang, name, description, features, specs)
SELECT id,'zh','温室核心作业与环境调控配件',
  '提供电力运输车、播种机、卷膜器、拉幕电机等核心配件，覆盖温室生产全流程，高效助力环境调控与作业管理。',
  '["电力运输车提升效率","自动播种机精准播种","卷膜器方便通风","拉幕电机自动遮阳","全流程配件覆盖"]',
  '{"配件类型":"运输/播种/卷膜/拉幕","电机功率":"25W-370W"}'
FROM products WHERE slug='core-parts' ON CONFLICT(product_id,lang) DO NOTHING;

INSERT INTO product_translations (product_id, lang, name, description, features, specs)
SELECT id,'zh','温室配套材料与结构件',
  '精选托幕线、保温棉被、遮阳网、卡膜箍、湿帘、风机等配套材料与结构件，为温室建设与运维提供稳定可靠的保障。',
  '["优质托幕线经久耐用","保温棉被保温效果好","遮阳网多规格可选","卡膜箍密封防风","湿帘风机配套齐全"]',
  '{"遮阳率":"30%-90%可选","棉被克重":"350-600g/m²"}'
FROM products WHERE slug='struct-parts' ON CONFLICT(product_id,lang) DO NOTHING;

INSERT INTO product_translations (product_id, lang, name, description, features, specs)
SELECT id,'zh','温室供暖与传动配件',
  '提供暖风炉、齿条、钢材等配件，精准调控温室温度与传动系统，为作物生长创造理想环境。',
  '["暖风炉高热效率","齿条传动精准可靠","优质钢材强度保障","规格齐全定制供应","售后服务有保障"]',
  '{"暖风炉功率":"5万-50万大卡","齿条模数":"M4/M6可选"}'
FROM products WHERE slug='heat-drive-parts' ON CONFLICT(product_id,lang) DO NOTHING;

-- ============================================
-- 工程案例数据
-- ============================================
INSERT INTO cases (slug, country, province, area, greenhouse_type, completion_date, sort_order) VALUES
  ('shandong-sunrise-seed',  '中国','山东省',  8000, '薄膜连栋温室','2023-06-01',1),
  ('shaanxi-qianxian-veggie','中国','陕西省',  5000, '日光温室',    '2023-03-01',2),
  ('liaocheng-zhengxin',     '中国','山东聊城',12000,'薄膜连栋温室','2022-10-01',3),
  ('liaocheng-ruitai',       '中国','山东聊城', 6000,'玻璃温室',    '2022-05-01',4),
  ('henan-youlin',           '中国','河南省',   4000,'薄膜连栋温室','2023-08-01',5)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO case_translations (case_id, lang, title, description)
SELECT id,'zh','山东旭日种业有限公司',
  '为山东旭日种业有限公司承建薄膜连栋温室8000平方米，采用热镀锌骨架+PO膜覆盖，配套降温、补光、喷灌系统，主要用于蔬菜育种，项目得到客户高度好评。'
FROM cases WHERE slug='shandong-sunrise-seed' ON CONFLICT(case_id,lang) DO NOTHING;

INSERT INTO case_translations (case_id, lang, title, description)
SELECT id,'zh','陕西省乾县阳洪蔬菜种植基地',
  '在陕西省乾县阳洪镇承建日光温室5000平方米，配套自动卷帘、升温、喷灌系统，主要用于冬季蔬菜越冬生产，有效解决当地冬季蔬菜供应问题。'
FROM cases WHERE slug='shaanxi-qianxian-veggie' ON CONFLICT(case_id,lang) DO NOTHING;

INSERT INTO case_translations (case_id, lang, title, description)
SELECT id,'zh','聊城市正信味业晒棚生产基地',
  '为聊城市正信味业承建大型晒棚生产基地12000平方米，采用薄膜连栋结构，通风采光优良，满足调味品晾晒生产需求，项目按时交付，质量优良。'
FROM cases WHERE slug='liaocheng-zhengxin' ON CONFLICT(case_id,lang) DO NOTHING;

INSERT INTO case_translations (case_id, lang, title, description)
SELECT id,'zh','聊城市瑞泰农产品有限公司基地',
  '为聊城市瑞泰农产品有限公司承建文洛型玻璃温室6000平方米，配套全套内外遮阳、湿帘降温、水肥一体化系统，用于高端花卉和蔬菜种植，自动化程度高。'
FROM cases WHERE slug='liaocheng-ruitai' ON CONFLICT(case_id,lang) DO NOTHING;

INSERT INTO case_translations (case_id, lang, title, description)
SELECT id,'zh','河南省佑林事业温室种植基地',
  '在河南省承建薄膜连栋温室4000平方米，配套降温、补光、喷灌系统，主要用于蔬菜和水果种植，客户对建造质量和工期均表示满意。'
FROM cases WHERE slug='henan-youlin' ON CONFLICT(case_id,lang) DO NOTHING;

-- ============================================
-- 网站配置（真实公司信息）
-- ============================================
INSERT INTO site_settings (key, value) VALUES
  ('company_name_zh',       '山东京阳温室科技有限公司'),
  ('company_name_en',       'Shandong Jingyang Greenhouse Technology Co., Ltd.'),
  ('company_phone_1',       '15275898666'),
  ('company_phone_2',       '15275898779'),
  ('company_contact',       '王静'),
  ('company_email',         'jingyangwenshikeji@163.com'),
  ('company_address_zh',    '山东省聊城市莘县工业园区鸿图街8号'),
  ('company_address_en',    'No.8 Hongtu Street, Shenxian Industrial Zone, Liaocheng, Shandong, China'),
  ('company_hours',         '周一至周六 08:30 – 17:30'),
  ('company_service_area',  '山东、河南、河北、东北、山西、陕西、江苏、安徽等全国各地'),
  ('company_founded',       '2015'),
  ('company_projects',      '15+'),
  ('company_provinces',     '8+'),
  ('company_partners',      '3'),
  ('company_whatsapp',      '8615275898666'),
  ('icp_number',            '鲁ICP备XXXXXXXX号')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ============================================
-- v3 补丁：articles 补充 video_url 列
-- ============================================
ALTER TABLE articles ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);

-- ============================================
-- v4 补丁：修复 calculator_records 字段缺失
-- ============================================
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS has_smart_control BOOLEAN DEFAULT false;
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS has_irrigation BOOLEAN DEFAULT false;
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS has_lighting BOOLEAN DEFAULT false;
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS has_cooling BOOLEAN DEFAULT false;
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS has_heating BOOLEAN DEFAULT false;
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS base_price_per_sqm DECIMAL(10,2);
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS lang VARCHAR(10) DEFAULT 'zh';
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS contact_name VARCHAR(200);
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE calculator_records ADD COLUMN IF NOT EXISTS submitted BOOLEAN DEFAULT false;

-- ============================================
-- v4 新增：操作日志表
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  username    VARCHAR(100),
  action      VARCHAR(50) NOT NULL,   -- create | update | delete | login
  resource    VARCHAR(100),           -- products | cases | articles | contacts | users
  resource_id VARCHAR(200),
  detail      TEXT,
  ip_address  VARCHAR(50),
  created_at  TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs(user_id);
