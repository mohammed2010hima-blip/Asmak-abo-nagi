const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("=========================================");
console.log("تهيئة قاعدة بيانات Supabase تلقائياً");
console.log("=========================================");

// 1. التحقق من وجود حزمة pg وتثبيتها تلقائياً إن لم تكن موجودة
try {
  require.resolve('pg');
} catch (e) {
  console.log("📦 حزمة 'pg' غير مثبتة. جاري تثبيتها تلقائياً...");
  try {
    execSync('npm install pg --no-save', { stdio: 'inherit' });
    console.log("✅ تم تثبيت حزمة 'pg' بنجاح.");
  } catch (err) {
    console.error("❌ فشل تثبيت حزمة 'pg' تلقائياً. يرجى تشغيل 'npm install pg' يدوياً.");
    process.exit(1);
  }
}

const { Client } = require('pg');

// 2. الحصول على رابط الاتصال بقاعدة البيانات
// يمكنك الحصول عليه من Supabase Dashboard -> Project Settings -> Database -> Connection string -> URI
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.log("\n⚠️ لم يتم العثور على متغير البيئة DATABASE_URL.");
  console.log("يرجى إدخال رابط اتصال PostgreSQL الخاص بـ Supabase.");
  console.log("يمكنك نسخه من: Supabase Dashboard -> Project Settings -> Database -> Connection string (URI)\n");
  
  // قراءة مدخلات المستخدم من الكونسول
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  readline.question('الرجاء إدخال Connection String: ', (answer) => {
    readline.close();
    if (!answer.trim()) {
      console.error("❌ لم يتم إدخال رابط الاتصال. تم إلغاء العملية.");
      process.exit(1);
    }
    runMigration(answer.trim());
  });
} else {
  runMigration(connectionString);
}

async function runMigration(uri) {
  const sqlPath = path.join(__dirname, 'schema.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ لم يتم العثور على ملف schema.sql في المسار: ${sqlPath}`);
    process.exit(1);
  }

  console.log("📖 جاري قراءة ملف schema.sql...");
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log("🔌 جاري الاتصال بقاعدة بيانات Supabase...");
  const client = new Client({
    connectionString: uri,
    ssl: {
      rejectUnauthorized: false // مطلوب للاتصال بـ Supabase
    }
  });

  try {
    await client.connect();
    console.log("🔌 تم الاتصال بنجاح. جاري تنفيذ استعلامات SQL لتهيئة قاعدة البيانات...");
    
    // تنفيذ الـ SQL بالكامل دفعة واحدة
    await client.query(sql);
    
    console.log("\n=========================================");
    console.log("✅ تمت تهيئة قاعدة البيانات بنجاح!");
    console.log("   - تم إنشاء جميع الجداول الثمانية.");
    console.log("   - تم إنشاء الفهارس والقيود بنجاح.");
    console.log("   - تم إدخال البيانات التجريبية الافتراضية.");
    console.log("   - تم إنشاء حساب المدير الجديد: admin@elborj.com");
    console.log("=========================================");
    
  } catch (error) {
    console.error("\n❌ حدث خطأ أثناء تهيئة قاعدة البيانات:");
    console.error(error.message);
  } finally {
    await client.end();
  }
}
