-- ============================================================
-- قاعدة بيانات مطعم أسماك أبو ناجي للمأكولات البحرية
-- تشغيل هذا الملف في Supabase SQL Editor أو عبر سكريبت init-db.js
-- ============================================================

-- حذف الجداول القديمة إن وجدت (ترتيب معكوس لتجنب أخطاء الـ Foreign Keys)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- ============================================================
-- 1. جدول الإعدادات العامة للمطعم
-- ============================================================
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. جدول الأقسام
-- ============================================================
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT DEFAULT '',
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. جدول المنتجات والأطباق
-- ============================================================
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_price NUMERIC(10,2),
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  image TEXT DEFAULT '',
  gallery JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC(3,1) DEFAULT 5.0,
  reviews_count INTEGER DEFAULT 0,
  popular BOOLEAN DEFAULT FALSE,
  newest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 4. جدول المستخدمين والعملاء
-- ============================================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. جدول الكوبونات وأكواد الخصم
-- ============================================================
CREATE TABLE coupons (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code TEXT UNIQUE NOT NULL,
  discount_percentage NUMERIC(5,2) NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 6. جدول الطلبات
-- ============================================================
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  delivery_area TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  coupon_code TEXT,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  grand_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','preparing','shipping','delivered','cancelled')),
  date TEXT DEFAULT '',
  time TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  estimated_delivery_time TEXT DEFAULT '45 دقيقة',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 7. جدول التقييمات والمراجعات
-- ============================================================
CREATE TABLE reviews (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id TEXT REFERENCES products(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  date TEXT DEFAULT '',
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 8. جدول الإشعارات
-- ============================================================
CREATE TABLE notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT DEFAULT '',
  type TEXT DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
  read BOOLEAN DEFAULT FALSE,
  date TEXT DEFAULT '',
  time TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- إنشاء الفهارس (Indexes) لتحسين الأداء وتسريع عمليات البحث
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ============================================================
-- تفعيل RLS (Row Level Security) للأمان
-- ============================================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- سياسات الأمان - القراءة مفتوحة للجميع
-- ============================================================
CREATE POLICY "public_read_settings" ON settings FOR SELECT USING (true);
CREATE POLICY "public_read_categories" ON categories FOR SELECT USING (true);
CREATE POLICY "public_read_products" ON products FOR SELECT USING (true);
CREATE POLICY "public_read_coupons" ON coupons FOR SELECT USING (true);
CREATE POLICY "public_read_approved_reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "public_read_users" ON users FOR SELECT USING (true);
CREATE POLICY "public_read_orders" ON orders FOR SELECT USING (true);
CREATE POLICY "public_read_notifications" ON notifications FOR SELECT USING (true);

-- الكتابة للجميع (anon) - مناسب للـ prototype
CREATE POLICY "anon_write_settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_write_categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_write_products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_write_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_write_coupons" ON coupons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_write_orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_write_reviews" ON reviews FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "anon_write_notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- دوال مساعدة
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- بيانات تجريبية افتراضية (Seed Data)
-- ============================================================

-- إعدادات المطعم
INSERT INTO settings (id, data) VALUES (1, '{
  "name": "مطعم أسماك أبو ناجي للمأكولات البحرية",
  "logo": "🌊",
  "bannerImage": "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=1200&q=80",
  "heroTitle": "أقوى طواجن وفسفور في مصر",
  "heroSubtitle": "طازة من البحر لطاولتك.. طعم إسكندراني على أصوله مع خلطة أسماك أبو ناجي السرية",
  "whatsappNumber": "+201012345678",
  "phoneNumber": "01012345678",
  "email": "info@abunaji-seafood.com",
  "address": "طريق الكورنيش، بجوار قلعة قايتباي، الأنفوشي، الإسكندرية",
  "workingHours": "يومياً من 12:00 ظهراً حتى 12:00 منتصف الليل",
  "facebookLink": "https://facebook.com",
  "instagramLink": "https://instagram.com",
  "deliveryFee": 35,
  "minimumOrder": 150,
  "taxPercentage": 14,
  "currency": "ج.م",
  "seoTitle": "مطعم أسماك أبو ناجي للمأكولات البحرية | أفضل مطعم سمك وسي فود في الإسكندرية",
  "seoDescription": "استمتع بأشهى المأكولات البحرية الطازجة - سمك بلطي وبوري ودنيس وطواجن سي فود وجمبري جامبو. توصيل سريع في الإسكندرية.",
  "seoKeywords": "مطعم سمك, سي فود, الإسكندرية, جمبري, سمك بوري, طاجن سي فود, مطعم أسماك أبو ناجي",
  "deliveryAreas": [
    {"name": "الأنفوشي والمنشية", "fee": 20},
    {"name": "محطة الرمل والأزاريطة", "fee": 25},
    {"name": "كامب شيزار وسبورتنج", "fee": 30},
    {"name": "مصطفى كامل ورشدي", "fee": 35},
    {"name": "سموحة وسيدي جابر", "fee": 40},
    {"name": "جليم وستانلي", "fee": 45}
  ]
}'::jsonb);

-- الأقسام
INSERT INTO categories (id, name, image, "order") VALUES
('fish',       'الأسماك الطازجة',      'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=300&q=80', 1),
('tawajeen',   'الطواجن الفسفورية',    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=300&q=80', 2),
('grill-fried','المشاوي والمقالي',     'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=300&q=80', 3),
('soup-rice',  'الشوربة والأرز',       'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80', 4),
('salads',     'السلطات والمقبلات',   'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80', 5),
('drinks',     'مشروبات منعشة',       'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80', 6);

-- المنتجات
INSERT INTO products (id, name, category_id, description, price, discount_price, stock, is_available, image, gallery, rating, reviews_count, popular, newest) VALUES
('p1', 'سمك بوري سنجاري بالخلطة الإسكندراني', 'fish', 'سمك بوري طازج مفتوح سنجاري، مخبوز في الفرن مع البصل والطماطم والكرفس والثوم والفلفل الحار والليمون مع خلطة البهارات السرية.', 180, 160, 25, true, 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=500&q=80', '["https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=500&q=80"]'::jsonb, 4.8, 15, true, false),
('p2', 'سمك بلطي مقلي مقرمش', 'grill-fried', 'سمك بلطي بلدي متبل بالثوم والكمون والليمون، مقلي ومقرمش جداً يقدم مع شرائح الليمون الأخضر.', 90, NULL, 50, true, 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=500&q=80', '["https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=500&q=80"]'::jsonb, 4.6, 22, true, false),
('p3', 'طاجن جمبري إسكندراني بالكريمة والجبنة', 'tawajeen', 'قطع جمبري وسط مطبوخة مع الكريمة اللباني الغنية والفلفل الملون والثوم وجبنة الموتزاريلا الذائبة في الفرن البلدي.', 240, 220, 15, true, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80', '["https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80"]'::jsonb, 4.9, 34, true, true),
('p4', 'شوربة سي فود مخلية بالكريمة (سوبر فسفور)', 'soup-rice', 'شوربة غنية بالكريمة تحتوي على جمبري مخلي وكاليماري وقطع فيليه سمك وكابوريا وبلح البحر بالتتبيلة الإسكندرانية.', 130, NULL, 40, true, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80', '["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80"]'::jsonb, 4.9, 45, true, false),
('p5', 'أرز صيادية بالبصل المكرمل اللذيذ', 'soup-rice', 'أرز مصري مفلفل مطبوخ على طريقة الصيادين الإسكندرانية بالبصل المكرمل والكمون والبهارات السرية للمطعم.', 35, NULL, 100, true, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80', '["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80"]'::jsonb, 4.5, 60, false, false),
('p6', 'جمبري جامبو مشوي على الفحم (بالكيلو)', 'grill-fried', 'جمبري بحري جامبو طازج مشوي بخلطة المستردة والليمون وزيت الزيتون على الفحم الطبيعي.', 580, 550, 10, true, 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=80', '["https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=80"]'::jsonb, 4.9, 18, true, true),
('p7', 'طاجن سبيط بالصلصة الحارة', 'tawajeen', 'قطع سبيط بلدي مطبوخة في طاجن فخار مع صلصة الطماطم الغنية بالثوم والكسبرة والفلفل الحار والخل.', 190, NULL, 18, true, 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80', '["https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80"]'::jsonb, 4.7, 12, false, false),
('p8', 'كاليماري مقلي مقرمش بخلطة الثوم', 'grill-fried', 'حلقات كاليماري بلدي مغطاة بطبقة مقرمشة مقلية لتقدم مع صوص التارتار والليمون.', 160, NULL, 22, true, 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=500&q=80', '["https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=500&q=80"]'::jsonb, 4.7, 20, false, true),
('p9', 'سلطة طحينة بلدي بالثوم والخل', 'salads', 'طحينة بيضاء خام مجهزة بالثوم المفروم والكمون والليمون والخل وزيت الزيتون - المقبلات الأساسية مع السمك.', 15, NULL, 150, true, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80', '["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80"]'::jsonb, 4.4, 88, false, false),
('p10', 'ليمون بالنعناع فريش ومنعش', 'drinks', 'عصير ليمون طازج مخفوق مع أوراق النعناع الأخضر والثلج المجروش والحليب الخفيف لمنع المرارة.', 25, NULL, 200, true, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80', '["https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"]'::jsonb, 4.8, 42, false, false);

-- المستخدمون الافتراضيون (تم تحديث حساب الأدمن الافتراضي طبقاً للطلب)
INSERT INTO users (id, email, password, role, name, phone, address) VALUES
('u1', 'admin@elborj.com', 'admin123', 'admin', 'أحمد أسماك أبو ناجي (المدير)', '01012345678', 'مكتب الإدارة - مطعم أسماك أبو ناجي - الإسكندرية'),
('u2', 'user@example.com', 'user123', 'user', 'محمد المصري', '01234567890', '15 شارع طلعت حرب - وسط البلد - القاهرة');

-- الكوبونات
INSERT INTO coupons (code, discount_percentage, description) VALUES
('EGYPT20', 20, 'خصم 20% بمناسبة الافتتاح'),
('FOSFOR10', 10, 'خصم 10% على جميع المأكولات'),
('ABUNAJI', 15, 'خصم خاص لزبائن مطعم أسماك أبو ناجي');

-- التقييمات
INSERT INTO reviews (id, product_id, user_name, rating, comment, date, approved) VALUES
('r1', 'p3', 'كريم عبد العزيز', 5, 'طاجن الجمبري بالكريمة حكاية! الجبنة بتمط وطعم الكريمة غني جداً. أنصح بيه بشدة لو بتعشق الفسفور.', '25/06/2026', true),
('r2', 'p1', 'منى زكي', 5, 'السمك البوري السنجاري طازة والخلطة الإسكندرانية بهاراتها مظبوطة بالملي. التوصيل كان سريع وسخن.', '28/06/2026', true),
('r3', 'p4', 'ياسر جلال', 4, 'الشوربة تحفة ومليانة جمبري وكاليماري مخلية. بس كمية الكريمة دسمة شوية. ممتازة عموماً.', '29/06/2026', true),
('r4', 'p2', 'مي عز الدين', 5, 'البلطي المقلي مقرمش ولونه دهبي جميل، والتتبيلة واصلة لحد اللحم جوة. بجد تسلم إيديكم.', '30/06/2026', false);

-- الطلبات التجريبية
INSERT INTO orders (id, user_id, customer_name, phone, address, delivery_area, items, coupon_code, discount_amount, delivery_fee, tax_amount, subtotal, grand_total, status, date, time, notes, estimated_delivery_time) VALUES
('ord-1001', 'u2', 'محمد المصري', '01234567890', '15 شارع طلعت حرب - وسط البلد - القاهرة', 'محطة الرمل والأزاريطة',
 '[{"productId":"p3","name":"طاجن جمبري إسكندراني بالكريمة والجبنة","price":220,"quantity":1},{"productId":"p4","name":"شوربة سي فود مخلية بالكريمة","price":130,"quantity":2},{"productId":"p5","name":"أرز صيادية بالبصل المكرمل","price":35,"quantity":2}]'::jsonb,
 'FOSFOR10', 55, 25, 69.3, 550, 589.3, 'delivered', '28/06/2026', '03:15 م', 'ياريت الجمبري مستوي كويس والأرز سخن.', '45 دقيقة'),
('ord-1002', 'u2', 'محمد المصري', '01234567890', '15 شارع طلعت حرب - وسط البلد - القاهرة', 'محطة الرمل والأزاريطة',
 '[{"productId":"p1","name":"سمك بوري سنجاري بالخلطة الإسكندراني","price":160,"quantity":2},{"productId":"p5","name":"أرز صيادية بالبصل المكرمل","price":35,"quantity":3}]'::jsonb,
 NULL, 0, 25, 59.5, 425, 509.5, 'preparing', '01/07/2026', '04:30 م', 'زيادة بصل على الأرز من فضلكم.', '60 دقيقة'),
('ord-1003', 'u2', 'محمد المصري', '01234567890', '15 شارع طلعت حرب - وسط البلد - القاهرة', 'محطة الرمل والأزاريطة',
 '[{"productId":"p6","name":"جمبري جامبو مشوي على الفحم (بالكيلو)","price":550,"quantity":1}]'::jsonb,
 'EGYPT20', 110, 25, 61.6, 550, 526.6, 'pending', '01/07/2026', '05:00 م', 'معاه طحينة زيادة وسلطة خضراء.', '50 دقيقة');

-- ============================================================
-- ✅ انتهت عملية إنشاء وتعبئة قاعدة البيانات بنجاح
-- ============================================================
