// ============================================================
// إعداد Supabase Client وطبقة الربط بقاعدة البيانات الحقيقية
// يعمل كـ Singleton - يُستخدم من جميع ملفات المشروع
// ============================================================

const SUPABASE_URL = "https://gulodbqdycnoptvqptga.supabase.co";
const SUPABASE_KEY = "sb_publishable_XK0AXXGv_RMpF4zQIayWuQ__lL_Izek";

// إنشاء الـ Client من CDN المحمّل في index.html
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false // نستخدم نظام جلسة خاص بنا في auth.js
  }
});

// ====================================================================
// قاعدة البيانات الهجينة: Supabase (حقيقية) + localStorage (Cache سريع)
// ====================================================================
// الاستراتيجية:
//   القراءة  ← من localStorage (فوري) مع إعادة تحميل من Supabase كلما لزم
//   الكتابة  ← localStorage فوراً + Supabase في الخلفية
// ====================================================================

class SupabaseDB {
  constructor() {
    this.supabase = _supabase;
    this.ready = false;
    this.readyCallbacks = [];
    this.dbNotInitialized = false;
    this.missingTables = [];
  }

  // التحقق من وجود جدول معين في قاعدة البيانات لمنع أخطاء الـ schema cache
  async checkTableExists(tableName) {
    try {
      const { error } = await this.supabase.from(tableName).select("*").limit(0);
      if (error) {
        if (error.code === "PGRST205" || 
            (error.message && error.message.includes("Could not find the table")) ||
            (error.message && error.message.includes("does not exist"))) {
          return false;
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // عرض إشعار بارز في حال كانت الجداول مفقودة
  showInitErrorNotification() {
    const renderBanner = () => {
      const existingBanner = document.getElementById("db-init-error-banner");
      if (existingBanner) return;

      const banner = document.createElement("div");
      banner.id = "db-init-error-banner";
      banner.style.cssText = `
        background: linear-gradient(135deg, #e05a36 0%, #be123c 100%);
        color: white;
        padding: 16px 24px;
        text-align: right;
        font-family: 'Cairo', sans-serif;
        font-size: 0.95rem;
        position: relative;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(224, 90, 54, 0.2);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 15px;
        flex-wrap: wrap;
        border-bottom: 2px solid rgba(255, 255, 255, 0.1);
      `;

      banner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 1.4rem;">⚠️</span>
          <div>
            <strong style="font-weight: 700;">قاعدة البيانات غير مهيأة!</strong>
            <span style="opacity: 0.9; margin-right: 5px;">قاعدة بيانات Supabase متصلة ولكنها لا تحتوي على الجداول المطلوبة. يرجى تهيئتها لتشغيل الموقع بشكل صحيح.</span>
          </div>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button id="db-run-init-instructions-btn" style="
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.4);
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-family: 'Cairo', sans-serif;
            font-weight: 600;
            font-size: 0.85rem;
            transition: all 0.3s;
          ">طريقة التهيئة</button>
        </div>
      `;

      const btn = banner.querySelector("#db-run-init-instructions-btn");
      if (btn) {
        btn.addEventListener("click", () => {
          alert(`كيفية تهيئة قاعدة البيانات:
1. افتح لوحة تحكم Supabase الخاصة بك.
2. اذهب إلى SQL Editor.
3. أنشئ استعلاماً جديداً (New Query).
4. انسخ محتويات ملف "schema.sql" الموجود في مجلد المشروع والصقها هناك.
5. اضغط على Run لتنفيذ الاستعلام وتهيئة الجداول بالكامل.
أو قم بتشغيل سكريبت التهيئة التلقائي باستخدام Node.js:
node init-db.js`);
        });
      }

      document.body.prepend(banner);
    };

    if (document.body) {
      renderBanner();
    } else {
      window.addEventListener("DOMContentLoaded", renderBanner);
    }
  }

  // -------------------------------------------------------
  // تحميل كل البيانات من Supabase إلى localStorage عند البدء
  // -------------------------------------------------------
  async loadAllFromSupabase() {
    this.dbNotInitialized = false;
    this.missingTables = [];
    const requiredTables = ["settings", "categories", "products", "users", "coupons", "orders", "reviews", "notifications"];

    try {
      // التحقق من وجود الجداول أولاً قبل المحاولة في القراءة
      for (const table of requiredTables) {
        const exists = await this.checkTableExists(table);
        if (!exists) {
          this.missingTables.push(table);
        }
      }

      if (this.missingTables.length > 0) {
        this.dbNotInitialized = true;
        console.error("⚠️ الجداول التالية مفقودة في قاعدة البيانات:", this.missingTables.join(", "));
        this.showInitErrorNotification();
        this.ready = true;
        this.readyCallbacks.forEach(cb => cb());
        return;
      }

      // تحميل الإعدادات
      const { data: settingsRows } = await this.supabase.from("settings").select("data").single();
      if (settingsRows?.data) {
        localStorage.setItem("restaurant_settings", JSON.stringify(settingsRows.data));
      }

      // تحميل الأقسام
      const { data: categories } = await this.supabase.from("categories").select("*").order("order");
      if (categories?.length) {
        const mapped = categories.map(c => ({ id: c.id, name: c.name, image: c.image, order: c.order }));
        localStorage.setItem("categories", JSON.stringify(mapped));
      }

      // تحميل المنتجات
      const { data: products } = await this.supabase.from("products").select("*");
      if (products?.length) {
        const mapped = products.map(p => ({
          id: p.id,
          name: p.name,
          categoryId: p.category_id,
          description: p.description,
          price: parseFloat(p.price),
          discountPrice: p.discount_price ? parseFloat(p.discount_price) : null,
          stock: p.stock,
          isAvailable: p.is_available,
          image: p.image,
          gallery: p.gallery || [p.image],
          rating: parseFloat(p.rating),
          reviewsCount: p.reviews_count,
          popular: p.popular,
          newest: p.newest
        }));
        localStorage.setItem("products", JSON.stringify(mapped));
      }

      // تحميل المستخدمين
      const { data: users } = await this.supabase.from("users").select("*");
      if (users?.length) {
        const mapped = users.map(u => ({
          id: u.id,
          email: u.email,
          password: u.password,
          role: u.role,
          name: u.name,
          phone: u.phone,
          address: u.address,
          suspended: u.suspended
        }));
        localStorage.setItem("users", JSON.stringify(mapped));
      }

      // تحميل الكوبونات
      const { data: coupons } = await this.supabase.from("coupons").select("*");
      if (coupons?.length) {
        const mapped = coupons.map(c => ({
          code: c.code,
          discountPercentage: parseFloat(c.discount_percentage),
          description: c.description
        }));
        localStorage.setItem("coupons", JSON.stringify(mapped));
      }

      // تحميل الطلبات
      const { data: orders } = await this.supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (orders?.length) {
        const mapped = orders.map(o => ({
          id: o.id,
          userId: o.user_id,
          customerName: o.customer_name,
          phone: o.phone,
          address: o.address,
          deliveryArea: o.delivery_area,
          items: o.items || [],
          couponCode: o.coupon_code,
          discountAmount: parseFloat(o.discount_amount),
          deliveryFee: parseFloat(o.delivery_fee),
          taxAmount: parseFloat(o.tax_amount),
          subtotal: parseFloat(o.subtotal),
          grandTotal: parseFloat(o.grand_total),
          status: o.status,
          date: o.date,
          time: o.time,
          notes: o.notes,
          estimatedDeliveryTime: o.estimated_delivery_time
        }));
        localStorage.setItem("orders", JSON.stringify(mapped));
      }

      // تحميل التقييمات
      const { data: reviews } = await this.supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (reviews?.length) {
        const mapped = reviews.map(r => ({
          id: r.id,
          productId: r.product_id,
          userName: r.user_name,
          rating: r.rating,
          comment: r.comment,
          date: r.date,
          approved: r.approved
        }));
        localStorage.setItem("reviews", JSON.stringify(mapped));
      }

      // تحميل الإشعارات
      const { data: notifications } = await this.supabase.from("notifications").select("*").order("created_at", { ascending: false });
      if (notifications?.length) {
        const mapped = notifications.map(n => ({
          id: n.id,
          userId: n.user_id,
          title: n.title,
          content: n.content,
          type: n.type,
          read: n.read,
          date: n.date,
          time: n.time
        }));
        localStorage.setItem("notifications", JSON.stringify(mapped));
      }

      console.log("✅ تم تحميل البيانات من Supabase بنجاح");

    } catch (err) {
      console.warn("⚠️ تعذّر الاتصال بـ Supabase، سيتم استخدام البيانات المحلية:", err.message);
    }

    this.ready = true;
    this.readyCallbacks.forEach(cb => cb());
  }

  onReady(cb) {
    if (this.ready) {
      cb();
    } else {
      this.readyCallbacks.push(cb);
    }
  }

  // -------------------------------------------------------
  // دوال الكتابة في الخلفية إلى Supabase
  // -------------------------------------------------------

  // حفظ الإعدادات في Supabase
  async _pushSettings(settings) {
    const { error } = await this.supabase.from("settings").update({ data: settings }).eq("id", 1);
    if (error) {
      // إذا فشل الـ UPDATE، جرب INSERT
      await this.supabase.from("settings").upsert({ id: 1, data: settings });
    }
  }

  // حفظ قسم جديد أو تحديث قسم
  async _pushCategory(cat) {
    const row = { id: cat.id, name: cat.name, image: cat.image, order: cat.order };
    const { error } = await this.supabase.from("categories").upsert(row);
    if (error) console.error("خطأ في حفظ القسم:", error.message);
  }

  // حذف قسم
  async _deleteCategory(id) {
    await this.supabase.from("categories").delete().eq("id", id);
  }

  // حفظ منتج جديد أو تحديث منتج
  async _pushProduct(p) {
    const row = {
      id: p.id,
      name: p.name,
      category_id: p.categoryId,
      description: p.description,
      price: p.price,
      discount_price: p.discountPrice || null,
      stock: p.stock,
      is_available: p.isAvailable,
      image: p.image,
      gallery: p.gallery || [p.image],
      rating: p.rating,
      reviews_count: p.reviewsCount,
      popular: p.popular,
      newest: p.newest
    };
    const { error } = await this.supabase.from("products").upsert(row);
    if (error) console.error("خطأ في حفظ المنتج:", error.message);
  }

  // حذف منتج
  async _deleteProduct(id) {
    await this.supabase.from("products").delete().eq("id", id);
  }

  // حفظ مستخدم
  async _pushUser(u) {
    const row = {
      id: u.id,
      email: u.email,
      password: u.password,
      role: u.role,
      name: u.name,
      phone: u.phone,
      address: u.address,
      suspended: u.suspended
    };
    const { error } = await this.supabase.from("users").upsert(row);
    if (error) console.error("خطأ في حفظ المستخدم:", error.message);
  }

  // حذف مستخدم
  async _deleteUser(id) {
    await this.supabase.from("users").delete().eq("id", id);
  }

  // حفظ طلب جديد
  async _pushOrder(o) {
    const row = {
      id: o.id,
      user_id: o.userId,
      customer_name: o.customerName,
      phone: o.phone,
      address: o.address,
      delivery_area: o.deliveryArea,
      items: o.items,
      coupon_code: o.couponCode || null,
      discount_amount: o.discountAmount,
      delivery_fee: o.deliveryFee,
      tax_amount: o.taxAmount,
      subtotal: o.subtotal,
      grand_total: o.grandTotal,
      status: o.status,
      date: o.date,
      time: o.time,
      notes: o.notes || "",
      estimated_delivery_time: o.estimatedDeliveryTime
    };
    const { error } = await this.supabase.from("orders").upsert(row);
    if (error) console.error("خطأ في حفظ الطلب:", error.message);
  }

  // تحديث حالة الطلب فقط
  async _updateOrderStatus(id, status) {
    const { error } = await this.supabase.from("orders").update({ status }).eq("id", id);
    if (error) console.error("خطأ في تحديث حالة الطلب:", error.message);
  }

  // حفظ تقييم
  async _pushReview(r) {
    const row = {
      id: r.id,
      product_id: r.productId,
      user_name: r.userName,
      rating: r.rating,
      comment: r.comment,
      date: r.date,
      approved: r.approved
    };
    const { error } = await this.supabase.from("reviews").upsert(row);
    if (error) console.error("خطأ في حفظ التقييم:", error.message);
  }

  // تحديث حالة الموافقة على التقييم
  async _approveReview(id) {
    const { error } = await this.supabase.from("reviews").update({ approved: true }).eq("id", id);
    if (error) console.error("خطأ في الموافقة على التقييم:", error.message);
  }

  // حذف تقييم
  async _deleteReview(id) {
    await this.supabase.from("reviews").delete().eq("id", id);
  }

  // حفظ إشعار
  async _pushNotification(n) {
    const row = {
      id: n.id,
      user_id: n.userId,
      title: n.title,
      content: n.content,
      type: n.type,
      read: n.read,
      date: n.date,
      time: n.time
    };
    const { error } = await this.supabase.from("notifications").upsert(row);
    if (error) console.error("خطأ في حفظ الإشعار:", error.message);
  }

  // تحديث الإشعارات كمقروءة
  async _markNotificationsRead(userId) {
    const query = userId === "admin"
      ? this.supabase.from("notifications").update({ read: true }).eq("user_id", "admin")
      : this.supabase.from("notifications").update({ read: true }).eq("user_id", userId);
    const { error } = await query;
    if (error) console.error("خطأ في تحديث الإشعارات:", error.message);
  }

  // تحديث نجوم المنتج في Supabase
  async _updateProductRating(productId, rating, reviewsCount) {
    const { error } = await this.supabase
      .from("products")
      .update({ rating, reviews_count: reviewsCount })
      .eq("id", productId);
    if (error) console.error("خطأ في تحديث تقييم المنتج:", error.message);
  }
}

// إنشاء كائن واحد عالمي لاستخدامه من db.js
window.supabaseDB = new SupabaseDB();
