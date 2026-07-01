// ملف التشغيل والربط الرئيسي للمنصة (Orchestrator)
// يربط قاعدة البيانات، المصادقة، السلة، والتنقل لتشكيل واجهة تفاعلية كاملة

class App {
  constructor() {
    this.activeFilters = {
      categoryId: "",
      searchQuery: "",
      minPrice: "",
      maxPrice: "",
      minRating: 0,
      sortBy: "popular", // popular, price-asc, price-desc, rating, newest
      onlyAvailable: false
    };
    
    this.init();
  }

  init() {
    // إعداد الوضع المظلم الافتراضي وتفضيلات النظام
    this.initTheme();

    // ربط التنقلات بين الصفحات
    this.setupRoutes();

    // ربط الأحداث العامة
    this.bindEvents();

    // تهيئة الهيدر والتنبيهات
    this.renderHeader();
    this.updateCartBadge();
    this.renderNotifications();

    // التحقق من وجود كوبونات نشطة أو مناطق توصيل محفوظة
    if (window.cart.activeCoupon) {
      this.activeCoupon = window.cart.activeCoupon;
    }
  }

  // --- الوضع المظلم ---
  initTheme() {
    const savedTheme = localStorage.getItem("elborj_theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }

  toggleTheme() {
    const isDark = document.body.classList.toggle("dark-theme");
    localStorage.setItem("elborj_theme", isDark ? "dark" : "light");
    this.showToast(isDark ? "تم تفعيل الوضع المظلم 🌙" : "تم تفعيل الوضع المضيء ☀️", "info");
  }

  compressAndConvertImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 600;
          const MAX_HEIGHT = 600;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          // ضغط الصورة وحفظها كـ JPEG بجودة 70%
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  }

  async handleImageFileChange(input, previewId) {
    const file = input.files[0];
    if (file) {
      try {
        const previewImg = document.getElementById(previewId);
        const container = previewImg.parentElement;
        container.style.display = "block";
        previewImg.src = "https://i.giphy.com/media/v1.Y2lkPTc5MGI3NjExM2k2amx5N3N1cGN3bnR1cTh0NnFhdWxhdmpxcmYwdWxtazhzMmcyMCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7bu3XilJ5BOiSGic/giphy.gif"; // مؤشر تحميل مؤقت

        const base64 = await this.compressAndConvertImage(file);
        previewImg.src = base64;
      } catch (err) {
        this.showToast("خطأ أثناء معالجة الصورة، يرجى إعادة المحاولة.", "error");
        input.value = "";
      }
    }
  }

  // --- موجه الصفحات والربط ---
  setupRoutes() {
    // الصفحة الرئيسية
    window.router.addRoute("#/", () => this.renderHome());
    
    // صفحة المنيو والطلب
    window.router.addRoute("#/menu", () => this.renderMenu());
    
    // صفحة الدخول والتسجيل
    window.router.addRoute("#/login", () => this.renderLogin());
    window.router.addRoute("#/register", () => this.renderRegister());
    
    // حساب المستخدم وتتبع الطلب
    window.router.addRoute("#/account", (params) => this.renderAccount(params));
    window.router.addRoute("#/track-order", (params) => this.renderTrackOrder(params));
    
    // إتمام الطلب
    window.router.addRoute("#/checkout", () => this.renderCheckout());
    
    // لوحة تحكم المدير
    window.router.addRoute("#/admin/dashboard", () => this.renderAdminDashboard());
    window.router.addRoute("#/admin/products", () => this.renderAdminProducts());
    window.router.addRoute("#/admin/categories", () => this.renderAdminCategories());
    window.router.addRoute("#/admin/orders", () => this.renderAdminOrders());
    window.router.addRoute("#/admin/users", () => this.renderAdminUsers());
    window.router.addRoute("#/admin/reviews", () => this.renderAdminReviews());
    window.router.addRoute("#/admin/settings", () => this.renderAdminSettings());
  }

  bindEvents() {
    // التنقل بالضغط على الشعار
    document.addEventListener("click", (e) => {
      const target = e.target.closest("[data-nav]");
      if (target) {
        e.preventDefault();
        const route = target.getAttribute("data-nav");
        window.router.navigateTo(route);
      }
    });

    // تبديل الوضع الداكن
    document.addEventListener("click", (e) => {
      if (e.target.closest("#theme-toggle-btn")) {
        this.toggleTheme();
      }
    });

    // فتح وإغلاق سلة المشتريات
    document.addEventListener("click", (e) => {
      if (e.target.closest("#cart-toggle-btn")) {
        document.getElementById("cart-drawer-overlay").classList.add("open");
        this.renderCartDrawer();
      }
      if (e.target.closest("#close-cart-btn") || e.target.id === "cart-drawer-overlay") {
        document.getElementById("cart-drawer-overlay").classList.remove("open");
      }
    });

    // فتح وإغلاق الإشعارات
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("#notif-toggle-btn");
      const dropdown = document.getElementById("notif-dropdown");
      if (btn) {
        e.stopPropagation();
        dropdown.classList.toggle("open");
        if (dropdown.classList.contains("open")) {
          const user = window.auth.getCurrentUser();
          const role = user ? (user.role === "admin" ? "admin" : user.id) : "guest";
          window.db.markNotificationsAsRead(role);
          this.renderNotifications();
        }
      } else if (!e.target.closest("#notif-dropdown") && dropdown) {
        dropdown.classList.remove("open");
      }
    });

    // تحديث السلة تلقائياً عند تغيير البيانات
    window.addEventListener("cart_change", () => {
      this.updateCartBadge();
      this.renderCartDrawer();
      // تحديث شاشة الكاش أوت لو كنا فيها
      if (window.location.hash === "#/checkout") {
        this.renderCheckout();
      }
    });

    // تحديث الهيدر والـ SEO عند تبدل الصفحات
    window.addEventListener("page_changed", (e) => {
      const { hash } = e.detail;
      this.renderHeader();
      this.updateSEO(hash);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // إغلاق مودال المنتج
    document.addEventListener("click", (e) => {
      if (e.target.closest(".close-modal-btn") || e.target.classList.contains("modal-overlay")) {
        const modal = document.getElementById("product-detail-modal");
        if (modal) modal.classList.remove("open");
      }
    });
  }

  // --- تحديث وتحسين محركات البحث (SEO) ---
  updateSEO(hash) {
    const settings = window.db.getSettings();
    let title = settings.seoTitle;
    let description = settings.seoDescription;
    let keywords = settings.seoKeywords;

    switch (hash) {
      case "#/":
        title = `${settings.name} | الرئيسية`;
        break;
      case "#/menu":
        title = `منيو المأكولات البحرية الطازجة | ${settings.name}`;
        description = "تصفح تشكيلتنا الكبيرة من أشهى الأسماك المقلية والمشوية، الطواجن الإسكندرانية والجمبري المقرمش.";
        break;
      case "#/checkout":
        title = `إتمام طلب المأكولات البحرية | ${settings.name}`;
        break;
      case "#/account":
        title = `حسابي وطلباتي | ${settings.name}`;
        break;
      case "#/login":
        title = `تسجيل الدخول | ${settings.name}`;
        break;
      case "#/register":
        title = `إنشاء حساب جديد | ${settings.name}`;
        break;
      case "#/admin/dashboard":
        title = `لوحة تحكم المدير | ${settings.name}`;
        break;
    }

    document.title = title;
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", description);
    
    const metaKeys = document.querySelector('meta[name="keywords"]');
    if (metaKeys) metaKeys.setAttribute("content", keywords);

    // تحديث JSON-LD Schema للرئيسية للتأكيد على الـ Structured Data
    this.updateJsonLdSchema(settings);
  }

  updateJsonLdSchema(settings) {
    let script = document.getElementById("json-ld-schema");
    if (!script) {
      script = document.createElement("script");
      script.id = "json-ld-schema";
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      "name": settings.name,
      "image": settings.bannerImage,
      "telephone": settings.phoneNumber,
      "email": settings.email,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": settings.address,
        "addressLocality": "Alexandria",
        "addressCountry": "EG"
      },
      "openingHoursSpecification": {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
        ],
        "opens": "12:00",
        "closes": "23:59"
      },
      "priceRange": "$$"
    };

    script.textContent = JSON.stringify(schema);
  }

  // --- تحديث عناصر واجهة المستخدم المشتركة ---
  renderHeader() {
    const user = window.auth.getCurrentUser();
    const isAdmin = window.auth.isAdmin();
    const currentHash = window.location.hash || "#/";

    const navElement = document.getElementById("main-nav");
    if (navElement) {
      if (isAdmin) {
        navElement.innerHTML = `
          <a href="#/admin/dashboard" class="nav-link ${currentHash.startsWith('#/admin') ? 'active' : ''}">لوحة التحكم</a>
          <a href="#/admin/orders" class="nav-link ${currentHash === '#/admin/orders' ? 'active' : ''}">متابعة الطلبات 📋</a>
          <a href="#/menu" class="nav-link ${currentHash === '#/menu' ? 'active' : ''}">المنيو</a>
          <a href="#/" class="nav-link">معاينة الموقع</a>
          <a href="javascript:void(0)" onclick="window.app.handleLogout()" class="nav-link" style="color: var(--error-color); margin-right: 15px; font-weight: 700;">تسجيل الخروج 🚪</a>
        `;
      } else if (user) {
        navElement.innerHTML = `
          <a href="#/" class="nav-link ${currentHash === '#/' ? 'active' : ''}">الرئيسية</a>
          <a href="#/menu" class="nav-link ${currentHash === '#/menu' ? 'active' : ''}">المنيو</a>
          <a href="#/account?tab=orders" class="nav-link ${currentHash === '#/account' && window.location.hash.includes('tab=orders') ? 'active' : ''}">متابعة الطلبات 📦</a>
          <a href="#/account" class="nav-link ${currentHash === '#/account' && !window.location.hash.includes('tab=orders') ? 'active' : ''}">حسابي</a>
          <a href="javascript:void(0)" onclick="window.app.handleLogout()" class="nav-link" style="color: var(--error-color); margin-right: 15px; font-weight: 700;">تسجيل الخروج 🚪</a>
        `;
      } else {
        navElement.innerHTML = `
          <a href="#/" class="nav-link ${currentHash === '#/' ? 'active' : ''}">الرئيسية</a>
          <a href="#/menu" class="nav-link ${currentHash === '#/menu' ? 'active' : ''}">المنيو</a>
          <a href="#/login" class="nav-link ${currentHash === '#/login' ? 'active' : ''}">تسجيل الدخول</a>
        `;
      }
    }

    // زر الحساب الشخصي
    const accountBtn = document.getElementById("account-toggle-btn");
    if (accountBtn) {
      if (user) {
        accountBtn.innerHTML = `👤`;
        accountBtn.title = `حساب: ${user.name}`;
        accountBtn.onclick = () => window.router.navigateTo(isAdmin ? "#/admin/dashboard" : "#/account");
      } else {
        accountBtn.innerHTML = `🔑`;
        accountBtn.title = "تسجيل الدخول";
        accountBtn.onclick = () => window.router.navigateTo("#/login");
      }
    }

    // تحديث القائمة الجانبية للموبايل لتطابق الصلاحيات
    const mobileNavOverlay = document.getElementById("mobile-nav-overlay");
    if (mobileNavOverlay) {
      const drawer = mobileNavOverlay.querySelector(".mobile-nav-drawer");
      if (drawer) {
        if (isAdmin) {
          drawer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
              <span style="font-weight: 800; font-size: 1.2rem; color: var(--primary-color);">🌊 مطعم البرج (إدارة)</span>
              <button onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
            </div>
            <a href="#/admin/dashboard" class="mobile-nav-link" onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')">📊 لوحة التحكم</a>
            <a href="#/admin/orders" class="mobile-nav-link" onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')">📋 متابعة الطلبات</a>
            <a href="#/menu" class="mobile-nav-link" onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')">🦐 المنيو</a>
            <a href="#/" class="mobile-nav-link" onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')">🏠 معاينة الموقع</a>
            <a href="javascript:void(0)" class="mobile-nav-link" onclick="window.app.handleLogout(); document.getElementById('mobile-nav-overlay').classList.remove('open')" style="color: var(--error-color);">🚪 تسجيل الخروج</a>
            <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid var(--border-color);">
              <button class="btn btn-primary" onclick="window.app && window.app.toggleTheme(); document.getElementById('mobile-nav-overlay').classList.remove('open')" style="width: 100%;">🌙 تبديل الوضع المظلم</button>
            </div>
          `;
        } else if (user) {
          drawer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
              <span style="font-weight: 800; font-size: 1.2rem; color: var(--primary-color);">🌊 مطعم البرج</span>
              <button onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
            </div>
            <a href="#/" class="mobile-nav-link" onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')">🏠 الرئيسية</a>
            <a href="#/menu" class="mobile-nav-link" onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')">🦐 المنيو</a>
            <a href="#/account?tab=orders" class="mobile-nav-link" onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')">📦 متابعة الطلبات</a>
            <a href="#/account" class="mobile-nav-link" onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')">👤 حسابي</a>
            <a href="javascript:void(0)" class="mobile-nav-link" onclick="window.app.handleLogout(); document.getElementById('mobile-nav-overlay').classList.remove('open')" style="color: var(--error-color);">🚪 تسجيل الخروج</a>
            <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid var(--border-color);">
              <button class="btn btn-primary" onclick="window.app && window.app.toggleTheme(); document.getElementById('mobile-nav-overlay').classList.remove('open')" style="width: 100%;">🌙 تبديل الوضع المظلم</button>
            </div>
          `;
        } else {
          drawer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 15px;">
              <span style="font-weight: 800; font-size: 1.2rem; color: var(--primary-color);">🌊 مطعم البرج</span>
              <button onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-muted);">&times;</button>
            </div>
            <a href="#/" class="mobile-nav-link" onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')">🏠 الرئيسية</a>
            <a href="#/menu" class="mobile-nav-link" onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')">🦐 المنيو</a>
            <a href="#/login" class="mobile-nav-link" onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')">🔑 تسجيل الدخول</a>
            <a href="#/register" class="mobile-nav-link" onclick="document.getElementById('mobile-nav-overlay').classList.remove('open')">👤 إنشاء حساب</a>
            <div style="margin-top: auto; padding-top: 20px; border-top: 1px solid var(--border-color);">
              <button class="btn btn-primary" onclick="window.app && window.app.toggleTheme(); document.getElementById('mobile-nav-overlay').classList.remove('open')" style="width: 100%;">🌙 تبديل الوضع المظلم</button>
            </div>
          `;
        }
      }
    }
  }

  updateCartBadge() {
    const badge = document.getElementById("cart-count-badge");
    if (badge) {
      const count = window.cart.getCartCount();
      badge.textContent = count;
      badge.style.display = count > 0 ? "flex" : "none";
    }
  }

  renderNotifications() {
    const user = window.auth.getCurrentUser();
    const role = user ? (user.role === "admin" ? "admin" : user.id) : "guest";
    const notifications = window.db.getNotifications(role);
    
    // تحديث أيقونة جرس التنبيهات
    const badge = document.getElementById("notif-count-badge");
    const unreadCount = notifications.filter(n => !n.read).length;
    if (badge) {
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? "flex" : "none";
    }

    // تحديث قائمة الإشعارات
    const notifList = document.getElementById("notif-list-items");
    if (notifList) {
      if (notifications.length === 0) {
        notifList.innerHTML = `<div class="notif-item" style="text-align: center; color: var(--text-muted);">لا توجد إشعارات حالياً.</div>`;
      } else {
        notifList.innerHTML = notifications.map(n => `
          <div class="notif-item ${n.read ? '' : 'unread'}" onclick="window.app.handleNotifClick('${n.id}', '${n.userId}')">
            <div class="notif-item-title" style="color: ${n.type === 'success' ? '#10b981' : n.type === 'warning' ? '#f59e0b' : n.type === 'error' ? '#ef4444' : 'var(--text-color)'};">
              ${n.title}
            </div>
            <div class="notif-item-desc">${n.content}</div>
            <div class="notif-item-time">${n.date} - ${n.time}</div>
          </div>
        `).join("");
      }
    }
  }

  handleNotifClick(notifId, userId) {
    const notifications = window.db.getData("notifications");
    const notif = notifications.find(n => n.id === notifId);
    if (notif) {
      notif.read = true;
      window.db.setData("notifications", notifications);
      this.renderNotifications();
      
      // التوجيه الذكي بناءً على التنبيه
      if (userId === "admin") {
        if (notif.title.includes("طلب")) {
          window.router.navigateTo("#/admin/orders");
        } else if (notif.title.includes("تقييم")) {
          window.router.navigateTo("#/admin/reviews");
        } else if (notif.title.includes("مخزون")) {
          window.router.navigateTo("#/admin/products");
        }
      } else {
        if (notif.title.includes("طلبك")) {
          window.router.navigateTo("#/account");
        }
      }
    }
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let icon = "ℹ️";
    if (type === "success") icon = "✅";
    if (type === "error") icon = "❌";
    if (type === "warning") icon = "⚠️";

    toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
    container.appendChild(toast);

    // إزالة التنبيه بعد 4 ثوانٍ
    setTimeout(() => {
      toast.style.animation = "slideInLeft 0.3s ease reverse forwards";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // --- الصفحة الرئيسية ---
  renderHome() {
    const settings = window.db.getSettings();
    const categories = window.db.getCategories();
    const products = window.db.getProducts().filter(p => p.popular && p.isAvailable).slice(0, 4);
    const reviews = window.db.getReviews().filter(r => r.approved).slice(0, 3);

    const view = document.getElementById("router-view");
    view.innerHTML = `
      <section class="hero" style="background-image: linear-gradient(135deg, rgba(13, 148, 136, 0.9) 0%, rgba(17, 24, 39, 0.9) 100%), url('${settings.bannerImage}'); background-size: cover; background-position: center; color: white;">
        <div class="hero-content">
          <span class="hero-badge">${settings.name}</span>
          <h1 style="color: white;">${settings.heroTitle}</h1>
          <p style="color: #d1d5db;">${settings.heroSubtitle}</p>
          <div class="hero-actions">
            <button class="btn btn-primary" onclick="window.router.navigateTo('#/menu')">اطلب الآن 🦐</button>
            <a href="#/menu" class="btn btn-secondary" style="color: white; border-color: rgba(255,255,255,0.3);">عرض المنيو</a>
          </div>
        </div>
      </section>

      <section style="padding: 60px 0;">
        <div class="container">
          <div class="section-title-wrap">
            <h2 class="section-title">أقسام المطعم</h2>
            <p class="section-subtitle">اختر قسمك المفضل وجرب طعم البحر الحقيقي</p>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 20px; margin-top: 30px;">
            ${categories.map(cat => `
              <div onclick="window.app.openCategory('${cat.id}')" style="background: var(--surface-color); border: 1px solid var(--border-color); padding: 20px; border-radius: var(--radius-md); text-align: center; cursor: pointer; box-shadow: var(--shadow-sm); transition: var(--transition);" class="category-card">
                <img src="${cat.image}" alt="${cat.name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; margin-bottom: 15px; border: 3px solid var(--primary-color);">
                <h4 style="font-weight: 800;">${cat.name}</h4>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <section style="padding: 60px 0; background: var(--surface-color); border-top: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color);">
        <div class="container">
          <div class="section-title-wrap">
            <h2 class="section-title">الأكثر طلباً 🔥</h2>
            <p class="section-subtitle">الأطباق والوجبات الأكثر شهرة ومبيعاً لدينا</p>
          </div>
          <div class="products-grid" style="margin-top: 30px;">
            ${products.map(p => this.createProductCardHtml(p)).join("")}
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <button class="btn btn-primary" onclick="window.router.navigateTo('#/menu')">تصفح المنيو الكامل</button>
          </div>
        </div>
      </section>

      <section style="padding: 60px 0;">
        <div class="container">
          <div class="section-title-wrap">
            <h2 class="section-title">آراء زبائننا 🗣️</h2>
            <p class="section-subtitle">ماذا يقول عشاق السي فود والفسفور عن مطعم البرج</p>
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-top: 30px;">
            ${reviews.map(r => `
              <div style="background: var(--surface-color); border: 1px solid var(--border-color); padding: 25px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); position: relative;">
                <div style="color: #f59e0b; font-size: 1.1rem; margin-bottom: 10px;">
                  ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                </div>
                <p style="font-style: italic; margin-bottom: 15px; font-size: 0.95rem;">"${r.comment}"</p>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-color); padding-top: 15px;">
                  <strong style="font-weight: 700;">${r.userName}</strong>
                  <span style="color: var(--text-muted); font-size: 0.8rem;">${r.date}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </section>
    `;

    this.lazyLoadImages();
  }

  openCategory(catId) {
    this.activeFilters.categoryId = catId;
    window.router.navigateTo("#/menu");
  }

  // --- صفحة المنيو والفلترة الفورية ---
  renderMenu() {
    const categories = window.db.getCategories();
    const view = document.getElementById("router-view");
    
    view.innerHTML = `
      <div class="container">
        <div class="menu-page-layout">
          <aside class="sidebar-filters">
            <div class="filter-group">
              <div class="filter-title">الأقسام 🌊</div>
              <ul class="category-list">
                <li class="category-item ${this.activeFilters.categoryId === '' ? 'active' : ''}" onclick="window.app.setMenuCategory('')">
                  <span>كل المأكولات</span>
                  <span class="category-item-count">${window.db.getProducts().length}</span>
                </li>
                ${categories.map(cat => {
                  const count = window.db.getProducts().filter(p => p.categoryId === cat.id).length;
                  return `
                    <li class="category-item ${this.activeFilters.categoryId === cat.id ? 'active' : ''}" onclick="window.app.setMenuCategory('${cat.id}')">
                      <span>${cat.name}</span>
                      <span class="category-item-count">${count}</span>
                    </li>
                  `;
                }).join("")}
              </ul>
            </div>

            <div class="filter-group">
              <div class="filter-title">السعر (ج.م) 💰</div>
              <div class="price-range-inputs">
                <input type="number" id="filter-min-price" placeholder="من" value="${this.activeFilters.minPrice}" oninput="window.app.setPriceFilter()">
                <input type="number" id="filter-max-price" placeholder="إلى" value="${this.activeFilters.maxPrice}" oninput="window.app.setPriceFilter()">
              </div>
            </div>

            <div class="filter-group">
              <div class="filter-title">التقييم ⭐</div>
              <div class="rating-filters">
                ${[5, 4, 3].map(stars => `
                  <label class="rating-filter-item">
                    <input type="radio" name="rating-filter" ${this.activeFilters.minRating === stars ? 'checked' : ''} onclick="window.app.setRatingFilter(${stars})">
                    <span class="stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</span> وأكثر
                  </label>
                `).join("")}
                <label class="rating-filter-item">
                  <input type="radio" name="rating-filter" ${this.activeFilters.minRating === 0 ? 'checked' : ''} onclick="window.app.setRatingFilter(0)">
                  <span>الكل</span>
                </label>
              </div>
            </div>

            <div class="filter-group">
              <div class="filter-title">التوفر في المخزن 📦</div>
              <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; font-weight: 500;">
                <input type="checkbox" id="filter-available" ${this.activeFilters.onlyAvailable ? 'checked' : ''} onchange="window.app.setAvailabilityFilter(this.checked)" style="width: 18px; height: 18px; accent-color: var(--primary-color);">
                المتوفر فقط
              </label>
            </div>

            <button class="btn btn-secondary" onclick="window.app.resetFilters()" style="width: 100%; margin-top: 15px; font-size: 0.9rem;">إعادة ضبط الفلاتر</button>
          </aside>

          <section class="menu-content-wrap">
            <div class="search-sort-bar">
              <div class="search-input-wrap">
                <span class="search-icon">🔍</span>
                <input type="text" id="menu-search" placeholder="ابحث باسم الوجبة، القسم أو الوصف..." value="${this.activeFilters.searchQuery}" oninput="window.app.setSearchQuery(this.value)">
              </div>
              <select class="sort-select" onchange="window.app.setSortBy(this.value)">
                <option value="popular" ${this.activeFilters.sortBy === 'popular' ? 'selected' : ''}>الأكثر شعبية</option>
                <option value="newest" ${this.activeFilters.sortBy === 'newest' ? 'selected' : ''}>الأحدث</option>
                <option value="price-asc" ${this.activeFilters.sortBy === 'price-asc' ? 'selected' : ''}>السعر: من الأقل للأعلى</option>
                <option value="price-desc" ${this.activeFilters.sortBy === 'price-desc' ? 'selected' : ''}>السعر: من الأعلى للأقل</option>
                <option value="rating" ${this.activeFilters.sortBy === 'rating' ? 'selected' : ''}>الأعلى تقييماً</option>
              </select>
            </div>

            <div id="products-list-container" class="products-grid">
              <!-- سيتم تعبئتها ديناميكياً بدالة الفلترة -->
            </div>
          </section>
        </div>
      </div>
    `;

    this.filterAndRenderProducts();
  }

  setMenuCategory(catId) {
    this.activeFilters.categoryId = catId;
    const items = document.querySelectorAll(".category-item");
    items.forEach(el => el.classList.remove("active"));
    
    // تفعيل التحديد البصري
    event.currentTarget.classList.add("active");
    this.filterAndRenderProducts();
  }

  setSearchQuery(query) {
    this.activeFilters.searchQuery = query;
    this.filterAndRenderProducts();
  }

  setPriceFilter() {
    this.activeFilters.minPrice = document.getElementById("filter-min-price").value;
    this.activeFilters.maxPrice = document.getElementById("filter-max-price").value;
    this.filterAndRenderProducts();
  }

  setRatingFilter(stars) {
    this.activeFilters.minRating = stars;
    this.filterAndRenderProducts();
  }

  setAvailabilityFilter(checked) {
    this.activeFilters.onlyAvailable = checked;
    this.filterAndRenderProducts();
  }

  setSortBy(value) {
    this.activeFilters.sortBy = value;
    this.filterAndRenderProducts();
  }

  resetFilters() {
    this.activeFilters = {
      categoryId: "",
      searchQuery: "",
      minPrice: "",
      maxPrice: "",
      minRating: 0,
      sortBy: "popular",
      onlyAvailable: false
    };
    this.renderMenu();
  }

  filterAndRenderProducts() {
    let products = window.db.getProducts();

    // 1. فلترة القسم
    if (this.activeFilters.categoryId) {
      products = products.filter(p => p.categoryId === this.activeFilters.categoryId);
    }

    // 2. فلترة البحث
    if (this.activeFilters.searchQuery) {
      const q = this.activeFilters.searchQuery.toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        (window.db.getCategories().find(c => c.id === p.categoryId)?.name.toLowerCase().includes(q) || false)
      );
    }

    // 3. فلترة السعر
    if (this.activeFilters.minPrice) {
      products = products.filter(p => (p.discountPrice || p.price) >= parseFloat(this.activeFilters.minPrice));
    }
    if (this.activeFilters.maxPrice) {
      products = products.filter(p => (p.discountPrice || p.price) <= parseFloat(this.activeFilters.maxPrice));
    }

    // 4. فلترة التقييم
    if (this.activeFilters.minRating) {
      products = products.filter(p => p.rating >= this.activeFilters.minRating);
    }

    // 5. فلترة التوفر
    if (this.activeFilters.onlyAvailable) {
      products = products.filter(p => p.isAvailable && p.stock > 0);
    }

    // 6. الفرز
    switch (this.activeFilters.sortBy) {
      case "newest":
        products.sort((a, b) => b.newest - a.newest || b.id.localeCompare(a.id));
        break;
      case "price-asc":
        products.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
        break;
      case "price-desc":
        products.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
        break;
      case "rating":
        products.sort((a, b) => b.rating - a.rating);
        break;
      case "popular":
      default:
        products.sort((a, b) => b.popular - a.popular || b.rating - a.rating);
        break;
    }

    const container = document.getElementById("products-list-container");
    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--text-muted);">
          <h3>عذراً، لم نجد أي وجبة تطابق خيارات البحث 🐟</h3>
          <p>جرب تعديل خيارات الفلترة أو ابحث بكلمة أخرى.</p>
        </div>
      `;
    } else {
      container.innerHTML = products.map(p => this.createProductCardHtml(p)).join("");
    }

    this.lazyLoadImages();
  }

  createProductCardHtml(p) {
    const isFav = this.isFavorite(p.id);
    const hasDiscount = p.discountPrice !== null;
    const finalPrice = hasDiscount ? p.discountPrice : p.price;

    return `
      <div class="product-card" id="card-${p.id}">
        <div class="product-image-wrapper">
          <img data-src="${p.image}" class="lazy-image" alt="${p.name}" onclick="window.app.openProductDetails('${p.id}')">
          <button class="fav-btn ${isFav ? 'active' : ''}" onclick="window.app.toggleFavorite('${p.id}')" title="أضف للمفضلة">
            ♥
          </button>
          ${hasDiscount ? `<span class="product-badge badge-discount">خصم ${Math.round((p.price - p.discountPrice)/p.price * 100)}%</span>` : ""}
          ${p.newest ? `<span class="product-badge badge-new">جديد ✨</span>` : ""}
        </div>
        <div class="product-info">
          <div class="product-category">${window.db.getCategories().find(c => c.id === p.categoryId)?.name || ""}</div>
          <h3 class="product-name" onclick="window.app.openProductDetails('${p.id}')">${p.name}</h3>
          <p class="product-desc">${p.description}</p>
          
          <div class="product-rating">
            <span style="color: #f59e0b;">★ ${p.rating}</span>
            <span class="rating-count">(${p.reviewsCount} تقييم)</span>
          </div>

          <div class="product-footer">
            <div class="price-wrap">
              ${hasDiscount ? `
                <span class="old-price">${p.price} ج.م</span>
                <span class="current-price">${p.discountPrice} ج.م</span>
              ` : `
                <span class="current-price">${p.price} ج.م</span>
              `}
            </div>
            ${p.isAvailable && p.stock > 0 ? `
              <button class="add-cart-btn" onclick="window.app.addToCartDirect('${p.id}')" title="أضف للسلة">+</button>
            ` : `
              <span class="out-of-stock-btn">نفد</span>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // --- تفاصيل المنتج والمودال والتفاعل مراجعات ---
  openProductDetails(productId) {
    const p = window.db.getProductById(productId);
    if (!p) return;

    let selectedQty = 1;
    let selectedStar = 5;

    const modal = document.getElementById("product-detail-modal");
    if (!modal) return;

    const reviews = window.db.getReviewsByProductId(p.id);

    modal.innerHTML = `
      <div class="modal-content">
        <button class="close-modal-btn">&times;</button>
        <div class="product-detail-layout">
          <div class="product-gallery-wrap">
            <img src="${p.image}" id="modal-main-img" class="main-gallery-image" alt="${p.name}">
            <div class="gallery-thumbs">
              ${p.gallery.map((img, i) => `
                <img src="${img}" class="gallery-thumb-item ${i === 0 ? 'active' : ''}" onclick="document.getElementById('modal-main-img').src='${img}'; document.querySelectorAll('.gallery-thumb-item').forEach(el=>el.classList.remove('active')); this.classList.add('active');">
              `).join("")}
            </div>
          </div>

          <div class="product-detail-info">
            <div style="font-weight: 700; color: var(--secondary-color); margin-bottom: 8px;">
              ${window.db.getCategories().find(c => c.id === p.categoryId)?.name || ""}
            </div>
            <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 10px;">${p.name}</h2>
            <div style="color: #f59e0b; font-size: 1.1rem; margin-bottom: 15px;">
              ★ ${p.rating} <span style="color: var(--text-muted); font-size: 0.9rem;">(${p.reviewsCount} تقييم)</span>
            </div>
            <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.95rem;">${p.description}</p>
            
            <div style="font-size: 1.6rem; font-weight: 800; color: var(--primary-color); margin-bottom: 20px;">
              ${p.discountPrice ? `${p.discountPrice} ج.م <span style="text-decoration: line-through; font-size: 1rem; color: var(--text-muted); font-weight: normal; margin-right: 10px;">${p.price} ج.م</span>` : `${p.price} ج.م`}
            </div>

            <div style="font-weight: 700; font-size: 0.9rem; margin-bottom: 10px; color: ${p.stock > 5 ? 'var(--success-color)' : 'var(--error-color)'};">
              المخزون المتاح: ${p.stock} قطعة
            </div>

            ${p.isAvailable && p.stock > 0 ? `
              <div class="qty-selector">
                <button class="qty-btn" onclick="window.app.updateModalQty(-1, ${p.stock})">-</button>
                <span class="qty-val" id="modal-qty">1</span>
                <button class="qty-btn" onclick="window.app.updateModalQty(1, ${p.stock})">+</button>
              </div>
              <button class="btn btn-primary" onclick="window.app.addModalToCart('${p.id}')" style="margin-top: 10px;">أضف للسلة 🛒</button>
            ` : `
              <button class="btn btn-secondary" style="cursor: not-allowed; opacity: 0.5;" disabled>غير متوفر مؤقتاً</button>
            `}
          </div>

          <div class="reviews-section">
            <h3 style="font-weight: 800;">التقييمات والمراجعات (${reviews.length})</h3>
            <div class="reviews-list">
              ${reviews.length === 0 ? `
                <div style="text-align: center; color: var(--text-muted); padding: 20px;">لا توجد تقييمات معتمدة بعد لهذا الطبق. كن أول من يقيم!</div>
              ` : reviews.map(r => `
                <div class="review-item">
                  <div class="review-header">
                    <span class="review-user">${r.userName}</span>
                    <span class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                    <span class="review-date">${r.date}</span>
                  </div>
                  <p class="review-comment">${r.comment}</p>
                </div>
              `).join("")}
            </div>

            <div class="add-review-form">
              <h4 style="font-weight: 800;">أضف تقييمك للطبق ✍️</h4>
              <div class="rating-select">
                ${[1, 2, 3, 4, 5].map(num => `
                  <span class="rating-star-option" data-star="${num}" onclick="window.app.setReviewRating(${num})" style="color: ${num <= 5 ? '#f59e0b' : 'var(--text-muted)'};">★</span>
                `).join("")}
              </div>
              <div class="form-group">
                <textarea id="review-comment" placeholder="اكتب رأيك بصراحة في التتبيلة، الطعم والتسوية..." rows="3"></textarea>
              </div>
              <button class="btn btn-secondary" onclick="window.app.submitReview('${p.id}')">إرسال التقييم للمراجعة</button>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.classList.add("open");
  }

  updateModalQty(change, maxStock) {
    const el = document.getElementById("modal-qty");
    if (!el) return;
    let qty = parseInt(el.textContent) + change;
    if (qty < 1) qty = 1;
    if (qty > maxStock) {
      qty = maxStock;
      this.showToast(`أقصى كمية متاحة هي ${maxStock}`, "warning");
    }
    el.textContent = qty;
  }

  addModalToCart(productId) {
    const qty = parseInt(document.getElementById("modal-qty").textContent);
    try {
      window.cart.addItem(productId, qty);
      this.showToast("تم إضافة المنتج للسلة بنجاح 🍤", "success");
      document.getElementById("product-detail-modal").classList.remove("open");
    } catch (err) {
      this.showToast(err.message, "error");
    }
  }

  addToCartDirect(productId) {
    try {
      window.cart.addItem(productId, 1);
      this.showToast("تم إضافة المنتج للسلة 🍤", "success");
    } catch (err) {
      this.showToast(err.message, "error");
    }
  }

  setReviewRating(rating) {
    this.selectedReviewRating = rating;
    const stars = document.querySelectorAll(".rating-star-option");
    stars.forEach(s => {
      const val = parseInt(s.getAttribute("data-star"));
      s.style.color = val <= rating ? "#f59e0b" : "var(--text-muted)";
    });
  }

  submitReview(productId) {
    const user = window.auth.getCurrentUser();
    if (!user) {
      this.showToast("يجب عليك تسجيل الدخول أولاً لكتابة تقييم.", "error");
      document.getElementById("product-detail-modal").classList.remove("open");
      window.router.navigateTo("#/login");
      return;
    }

    const comment = document.getElementById("review-comment").value.trim();
    if (!comment) {
      this.showToast("برجاء كتابة تعليق على التقييم.", "warning");
      return;
    }

    const rating = this.selectedReviewRating || 5;

    window.db.addReview({
      productId,
      userName: user.name,
      rating,
      comment
    });

    this.showToast("تم إرسال تقييمك بنجاح! سينشر فوراً بعد مراجعة الإدارة.", "success");
    document.getElementById("product-detail-modal").classList.remove("open");
  }

  // --- المفضلة ---
  isFavorite(productId) {
    const favs = JSON.parse(localStorage.getItem("elborj_favorites")) || [];
    return favs.includes(productId);
  }

  toggleFavorite(productId) {
    event.stopPropagation();
    let favs = JSON.parse(localStorage.getItem("elborj_favorites")) || [];
    const index = favs.indexOf(productId);
    
    if (index !== -1) {
      favs.splice(index, 1);
      this.showToast("تم الحذف من المفضلة", "info");
    } else {
      favs.push(productId);
      this.showToast("تم الإضافة للمفضلة ♥", "success");
    }

    localStorage.setItem("elborj_favorites", JSON.stringify(favs));
    
    // تحديث التنشيط البصري فوراً
    const btn = document.querySelector(`#card-${productId} .fav-btn`);
    if (btn) btn.classList.toggle("active");
  }

  // --- سلة المشتريات (Drawer) ---
  renderCartDrawer() {
    const items = window.cart.getItems();
    const listEl = document.getElementById("cart-items-list-container");
    if (!listEl) return;

    if (items.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 40px 0; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 10px;">🛒</div>
          <p>سلتك فاضية حالياً. روح للمنيو واطلب أحلى الأطباق!</p>
          <button class="btn btn-primary" onclick="document.getElementById('cart-drawer-overlay').classList.remove('open'); window.router.navigateTo('#/menu')" style="margin-top: 15px;">اذهب للمنيو</button>
        </div>
      `;
      document.getElementById("cart-footer-container").style.display = "none";
    } else {
      listEl.innerHTML = items.map(item => `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}" class="cart-item-img">
          <div class="cart-item-details">
            <span class="cart-item-name">${item.name}</span>
            <span class="cart-item-price">${item.price} ج.م</span>
            <div class="cart-item-actions">
              <div class="cart-item-qty">
                <button class="cart-qty-btn" onclick="window.app.updateCartQty('${item.productId}', ${item.quantity - 1})">-</button>
                <span style="font-weight: 700;">${item.quantity}</span>
                <button class="cart-qty-btn" onclick="window.app.updateCartQty('${item.productId}', ${item.quantity + 1})">+</button>
              </div>
              <button class="cart-item-delete" onclick="window.cart.removeItem('${item.productId}')" title="حذف">🗑️</button>
            </div>
          </div>
        </div>
      `).join("");

      // الفوتر والحسابات
      const subtotal = window.cart.getSubtotal();
      const discount = window.cart.getDiscountAmount();
      const tax = window.cart.getTaxAmount();
      const delivery = window.cart.getDeliveryFee();
      const total = window.cart.getGrandTotal();

      const footerEl = document.getElementById("cart-footer-container");
      footerEl.style.display = "block";
      footerEl.innerHTML = `
        <div class="cart-summary-row">
          <span>المجموع الفرعي:</span>
          <span>${subtotal.toFixed(1)} ج.م</span>
        </div>
        ${discount > 0 ? `
          <div class="cart-summary-row" style="color: var(--success-color);">
            <span>الخصم (${window.cart.activeCoupon.discountPercentage}%):</span>
            <span>-${discount.toFixed(1)} ج.م</span>
          </div>
        ` : ""}
        <div class="cart-summary-row">
          <span>الضريبة (14%):</span>
          <span>${tax.toFixed(1)} ج.م</span>
        </div>
        <div class="cart-summary-row">
          <span>رسوم التوصيل:</span>
          <span>${delivery} ج.م</span>
        </div>
        <div class="cart-summary-row cart-summary-total">
          <span>الإجمالي الكلي:</span>
          <span>${total.toFixed(1)} ج.m</span>
        </div>

        <div class="coupon-section">
          <input type="text" id="coupon-code-input" placeholder="كود الخصم" value="${window.cart.activeCoupon ? window.cart.activeCoupon.code : ''}">
          ${window.cart.activeCoupon ? `
            <button class="btn" onclick="window.app.removeCoupon()" style="background: var(--error-color);">إلغاء</button>
          ` : `
            <button class="btn" onclick="window.app.applyCoupon()">تطبيق</button>
          `}
        </div>

        <button class="btn btn-primary" onclick="window.app.checkoutRedirect()" style="width: 100%; padding: 14px; font-size: 1.05rem; margin-top: 10px;">إتمام الطلب 🤝</button>
      `;
    }
  }

  updateCartQty(productId, qty) {
    try {
      window.cart.updateQuantity(productId, qty);
    } catch (err) {
      this.showToast(err.message, "error");
    }
  }

  applyCoupon() {
    const code = document.getElementById("coupon-code-input").value.trim();
    if (!code) return;
    try {
      const coupon = window.cart.applyCoupon(code);
      this.showToast(`تم تطبيق الكود بنجاح: خصم ${coupon.discountPercentage}%! 🎁`, "success");
    } catch (err) {
      this.showToast(err.message, "error");
    }
  }

  removeCoupon() {
    window.cart.removeCoupon();
    this.showToast("تم إزالة كوبون الخصم.", "info");
  }

  checkoutRedirect() {
    document.getElementById("cart-drawer-overlay").classList.remove("open");
    window.router.navigateTo("#/checkout");
  }

  // --- شاشة إتمام الطلب (Checkout) ---
  renderCheckout() {
    const items = window.cart.getItems();
    if (items.length === 0) {
      window.router.navigateTo("#/menu");
      return;
    }

    const user = window.auth.getCurrentUser();
    const settings = window.db.getSettings();
    const view = document.getElementById("router-view");

    // حسابات الأسعار الحالية
    const subtotal = window.cart.getSubtotal();
    const discount = window.cart.getDiscountAmount();
    const tax = window.cart.getTaxAmount();
    const delivery = window.cart.getDeliveryFee();
    const total = window.cart.getGrandTotal();

    view.innerHTML = `
      <div class="container">
        <div class="section-title-wrap" style="margin-top: 30px;">
          <h2 class="section-title">إتمام الطلب وتأكيده</h2>
          <p class="section-subtitle">املأ بيانات التوصيل وأكد طلب المأكولات البحرية اللذيذة</p>
        </div>

        <div class="checkout-layout">
          <form id="checkout-form" onsubmit="window.app.placeOrder(event)" style="background: var(--surface-color); border: 1px solid var(--border-color); padding: 30px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
            <h3 style="margin-bottom: 20px; font-weight: 800; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">بيانات المستلم</h3>
            
            <div class="form-group">
              <label for="checkout-name">الاسم بالكامل *</label>
              <input type="text" id="checkout-name" value="${user ? user.name : ''}" required>
            </div>

            <div class="form-group">
              <label for="checkout-phone">رقم الموبايل *</label>
              <input type="tel" id="checkout-phone" placeholder="01xxxxxxxxx" value="${user ? user.phone : ''}" required>
            </div>

            <div class="form-group">
              <label for="checkout-area">منطقة التوصيل *</label>
              <select id="checkout-area" onchange="window.app.changeCheckoutArea(this.value)" required>
                <option value="">اختر المنطقة للتوصيل</option>
                ${settings.deliveryAreas.map(area => `
                  <option value="${area.name}" ${window.cart.selectedDeliveryArea && window.cart.selectedDeliveryArea.name === area.name ? 'selected' : ''}>
                    ${area.name} (التوصيل: ${area.fee} ج.م)
                  </option>
                `).join("")}
              </select>
            </div>

            <div class="form-group">
              <label for="checkout-address">العنوان بالتفصيل *</label>
              <textarea id="checkout-address" rows="3" placeholder="اسم الشارع، رقم العمارة، رقم الشقة، علامة مميزة" required>${user ? user.address : ''}</textarea>
            </div>

            <div class="form-group">
              <label for="checkout-notes">ملاحظات للمطبخ / الدليفري</label>
              <textarea id="checkout-notes" rows="2" placeholder="مثال: ياريت السمك مشوي زيادة، الدليفري يكلمني قبل التوصيل..."></textarea>
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 1.1rem; margin-top: 20px;">أكد الطلب الآن (الدفع عند الاستلام) 🤝</button>
          </form>

          <aside style="background: var(--surface-color); border: 1px solid var(--border-color); padding: 30px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); height: fit-content;">
            <h3 style="margin-bottom: 20px; font-weight: 800; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">ملخص الطلب</h3>
            <div style="max-height: 200px; overflow-y: auto; margin-bottom: 20px; padding-left: 5px;">
              ${items.map(item => `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                  <div>
                    <span style="font-weight: 700;">${item.name}</span>
                    <div style="font-size: 0.8rem; color: var(--text-muted);">الكمية: ${item.quantity} x ${item.price} ج.م</div>
                  </div>
                  <strong style="font-weight: 700;">${item.price * item.quantity} ج.م</strong>
                </div>
              `).join("")}
            </div>

            <div style="border-top: 1px dashed var(--border-color); padding-top: 15px;">
              <div class="cart-summary-row">
                <span>المجموع الفرعي:</span>
                <span>${subtotal.toFixed(1)} ج.م</span>
              </div>
              ${discount > 0 ? `
                <div class="cart-summary-row" style="color: var(--success-color);">
                  <span>الخصم:</span>
                  <span>-${discount.toFixed(1)} ج.م</span>
                </div>
              ` : ""}
              <div class="cart-summary-row">
                <span>الضريبة (14%):</span>
                <span>${tax.toFixed(1)} ج.م</span>
              </div>
              <div class="cart-summary-row">
                <span>توصيل إلى (${window.cart.selectedDeliveryArea ? window.cart.selectedDeliveryArea.name : 'لم يتم التحديد'}):</span>
                <span>${delivery} ج.م</span>
              </div>
              <div class="cart-summary-row cart-summary-total">
                <span>الإجمالي الكلي:</span>
                <span>${total.toFixed(1)} ج.م</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    `;
  }

  changeCheckoutArea(areaName) {
    window.cart.setDeliveryArea(areaName);
    this.renderCheckout();
  }

  placeOrder(e) {
    e.preventDefault();

    const name = document.getElementById("checkout-name").value.trim();
    const phone = document.getElementById("checkout-phone").value.trim();
    const area = document.getElementById("checkout-area").value;
    const address = document.getElementById("checkout-address").value.trim();
    const notes = document.getElementById("checkout-notes").value.trim();

    // التحقق من رقم الموبايل المصري
    try {
      window.auth.validateName(name);
      window.auth.validatePhone(phone);
    } catch (err) {
      this.showToast(err.message, "error");
      return;
    }

    if (!area) {
      this.showToast("برجاء اختيار منطقة توصيل صالحة.", "warning");
      return;
    }

    const subtotal = window.cart.getSubtotal();
    const settings = window.db.getSettings();
    if (subtotal < settings.minimumOrder) {
      this.showToast(`عذراً، الحد الأدنى للطلب في هذا المطعم هو ${settings.minimumOrder} ج.م.`, "error");
      return;
    }

    const user = window.auth.getCurrentUser();
    const newOrder = {
      userId: user.id,
      customerName: name,
      phone,
      address,
      deliveryArea: area,
      items: window.cart.getItems(),
      couponCode: window.cart.activeCoupon ? window.cart.activeCoupon.code : null,
      discountAmount: window.cart.getDiscountAmount(),
      deliveryFee: window.cart.getDeliveryFee(),
      taxAmount: window.cart.getTaxAmount(),
      subtotal,
      grandTotal: window.cart.getGrandTotal(),
      status: "pending",
      notes,
      estimatedDeliveryTime: "50-60 دقيقة"
    };

    const placed = window.db.addOrder(newOrder);
    window.cart.clear(); // تفريغ السلة

    this.showToast("تم إرسال الطلب بنجاح! وجاري مراجعته 🐟", "success");
    window.router.navigateTo(`#/track-order?id=${placed.id}`);
  }

  // --- تتبع الطلب (Order Tracking) ---
  renderTrackOrder(params) {
    const orderId = params.id;
    const order = window.db.getOrderById(orderId);

    const view = document.getElementById("router-view");
    if (!order) {
      view.innerHTML = `
        <div class="container" style="text-align: center; padding: 60px 0;">
          <h3>الطلب غير موجود ❌</h3>
          <p>تأكد من كتابة رقم الطلب بشكل صحيح في الرابط.</p>
        </div>
      `;
      return;
    }

    // تحديد الفهرس النشط لحالات الاستلام
    const statuses = ["pending", "preparing", "shipping", "delivered"];
    const statusTitles = ["تم استلام الطلب", "جاري تحضير الطلب", "خرج للتوصيل", "تم التسليم"];
    const activeIndex = statuses.indexOf(order.status);

    view.innerHTML = `
      <div class="container">
        <div class="section-title-wrap" style="margin-top: 30px;">
          <h2 class="section-title">تتبع الطلب: #${order.id}</h2>
          <p class="section-subtitle">شاهد مراحل طهي وتوصيل وجبتك الفسفورية</p>
        </div>

        <div style="background: var(--surface-color); border: 1px solid var(--border-color); padding: 35px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); margin-bottom: 30px;">
          ${order.status === "cancelled" ? `
            <div style="text-align: center; padding: 20px; background: rgba(239, 68, 68, 0.1); color: var(--error-color); font-weight: bold; border-radius: var(--radius-sm); margin-bottom: 30px;">
              تم إلغاء هذا الطلب من قبل العميل أو الإدارة.
            </div>
          ` : `
            <div class="tracking-stepper">
              ${statuses.map((status, index) => {
                let stepClass = "";
                if (index < activeIndex) stepClass = "completed";
                else if (index === activeIndex) stepClass = "active";
                return `
                  <div class="step-item ${stepClass}">
                    <div class="step-icon">${index + 1}</div>
                    <div class="step-title">${statusTitles[index]}</div>
                  </div>
                `;
              }).join("")}
            </div>
          `}

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; border-top: 1px solid var(--border-color); padding-top: 30px;">
            <div>
              <h3 style="margin-bottom: 15px; font-weight: 800;">معلومات التوصيل</h3>
              <p><strong>اسم العميل:</strong> ${order.customerName}</p>
              <p><strong>رقم الموبايل:</strong> ${order.phone}</p>
              <p><strong>منطقة التوصيل:</strong> ${order.deliveryArea}</p>
              <p><strong>العنوان بالتفصيل:</strong> ${order.address}</p>
              <p><strong>وقت الطلب:</strong> ${order.date} - ${order.time}</p>
              ${order.notes ? `<p><strong>ملاحظات:</strong> ${order.notes}</p>` : ""}
            </div>

            <div>
              <h3 style="margin-bottom: 15px; font-weight: 800;">تفاصيل الحساب</h3>
              <p><strong>حالة الدفع:</strong> عند الاستلام (كاش أو محفظة)</p>
              <p><strong>وقت التوصيل التقريبي:</strong> ${order.status === 'delivered' ? 'تم التوصيل' : order.estimatedDeliveryTime}</p>
              <p><strong>إجمالي الفاتورة:</strong> <strong style="color: var(--primary-color); font-size: 1.25rem;">${order.grandTotal.toFixed(1)} ج.م</strong></p>
              <button class="btn btn-secondary" onclick="window.app.printInvoice('${order.id}')" style="margin-top: 20px;">تحميل الفاتورة 📄</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- حساب المستخدم (Account Tab) ---
  renderAccount(params) {
    const user = window.auth.getCurrentUser();
    const orders = window.db.getOrders().filter(o => o.userId === user.id);
    const view = document.getElementById("router-view");

    let subtab = params.tab || "orders"; // orders, profile, password

    view.innerHTML = `
      <div class="container">
        <div class="account-layout">
          <aside class="account-sidebar">
            <div class="account-user-card">
              <div class="account-avatar">${user.name.charAt(0)}</div>
              <h3 class="account-username">${user.name}</h3>
              <p class="account-useremail">${user.email}</p>
            </div>
            <ul class="account-menu">
              <li class="account-menu-item ${subtab === 'orders' ? 'active' : ''}" onclick="window.app.switchAccountTab('orders')">📦 طلباتي السابقة</li>
              <li class="account-menu-item ${subtab === 'profile' ? 'active' : ''}" onclick="window.app.switchAccountTab('profile')">👤 بيانات الحساب</li>
              <li class="account-menu-item ${subtab === 'password' ? 'active' : ''}" onclick="window.app.switchAccountTab('password')">🔒 تغيير كلمة المرور</li>
              <li class="account-menu-item" onclick="window.app.handleLogout()" style="color: var(--error-color); margin-top: 30px;">🚪 تسجيل الخروج</li>
            </ul>
          </aside>

          <main class="account-content" id="account-tab-content">
            <!-- سيتم حقن الصفحات الفرعية هنا -->
          </main>
        </div>
      </div>
    `;

    this.renderAccountSubtab(subtab, user, orders);
  }

  switchAccountTab(tab) {
    window.router.navigateTo(`#/account?tab=${tab}`);
  }

  renderAccountSubtab(tab, user, orders) {
    const contentEl = document.getElementById("account-tab-content");
    if (!contentEl) return;

    if (tab === "orders") {
      if (orders.length === 0) {
        contentEl.innerHTML = `
          <h2 style="font-weight: 800; margin-bottom: 20px;">طلباتي السابقة</h2>
          <div style="text-align: center; padding: 40px; color: var(--text-muted);">
            <h4>لا يوجد طلبات سابقة في حسابك.</h4>
            <p>اطلب وجبتك الأولى من قسم المنيو الآن!</p>
            <button class="btn btn-primary" onclick="window.router.navigateTo('#/menu')" style="margin-top: 15px;">عرض المنيو</button>
          </div>
        `;
      } else {
        contentEl.innerHTML = `
          <h2 style="font-weight: 800; margin-bottom: 20px;">طلباتي السابقة</h2>
          <div class="orders-table-wrapper">
            <table class="orders-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>التاريخ والوقت</th>
                  <th>الإجمالي</th>
                  <th>الحالة</th>
                  <th>إجراءات</th>
                </tr>
              </thead>
              <tbody>
                ${orders.map(o => `
                  <tr>
                    <td><strong>#${o.id}</strong></td>
                    <td>${o.date} - ${o.time}</td>
                    <td>${o.grandTotal.toFixed(1)} ج.م</td>
                    <td><span class="status-badge status-${o.status}">${this.getStatusTranslation(o.status)}</span></td>
                    <td style="display: flex; gap: 10px;">
                      <button class="btn btn-secondary" onclick="window.router.navigateTo('#/track-order?id=${o.id}')" style="padding: 6px 12px; font-size: 0.8rem;">تتبع</button>
                      <button class="btn btn-primary" onclick="window.app.repeatOrder('${o.id}')" style="padding: 6px 12px; font-size: 0.8rem;">إعادة طلب</button>
                      ${o.status === 'pending' ? `
                        <button class="btn" onclick="window.app.cancelOrderDirect('${o.id}')" style="padding: 6px 12px; font-size: 0.8rem; background: var(--error-color);">إلغاء</button>
                      ` : ""}
                    </td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;
      }
    } else if (tab === "profile") {
      contentEl.innerHTML = `
        <h2 style="font-weight: 800; margin-bottom: 25px;">بيانات الحساب</h2>
        <form onsubmit="window.app.handleProfileUpdate(event)">
          <div class="form-group">
            <label for="profile-name">الاسم بالكامل</label>
            <input type="text" id="profile-name" value="${user.name}" required>
          </div>
          <div class="form-group">
            <label for="profile-phone">رقم الموبايل</label>
            <input type="tel" id="profile-phone" value="${user.phone}" required>
          </div>
          <div class="form-group">
            <label for="profile-address">العنوان الافتراضي للتوصيل</label>
            <textarea id="profile-address" rows="3" required>${user.address}</textarea>
          </div>
          <button type="submit" class="btn btn-primary">حفظ التغييرات 💾</button>
        </form>
      `;
    } else if (tab === "password") {
      contentEl.innerHTML = `
        <h2 style="font-weight: 800; margin-bottom: 25px;">تغيير كلمة المرور</h2>
        <form onsubmit="window.app.handlePasswordChange(event)">
          <div class="form-group">
            <label for="old-pass">كلمة المرور الحالية</label>
            <input type="password" id="old-pass" required>
          </div>
          <div class="form-group">
            <label for="new-pass">كلمة المرور الجديدة</label>
            <input type="password" id="new-pass" required>
          </div>
          <button type="submit" class="btn btn-primary">تحديث كلمة المرور</button>
        </form>
      `;
    }
  }

  getStatusTranslation(status) {
    switch (status) {
      case "pending": return "تم استلام الطلب";
      case "preparing": return "جاري التحضير";
      case "shipping": return "خرج للتوصيل";
      case "delivered": return "تم التسليم";
      case "cancelled": return "تم الإلغاء";
      default: return "غير معروف";
    }
  }

  cancelOrderDirect(orderId) {
    if (confirm("هل أنت متأكد من إلغاء هذا الطلب؟")) {
      window.db.updateOrderStatus(orderId, "cancelled");
      this.showToast("تم إلغاء الطلب بنجاح.", "info");
      this.renderAccount({ tab: "orders" });
    }
  }

  repeatOrder(orderId) {
    const order = window.db.getOrderById(orderId);
    if (!order) return;

    try {
      order.items.forEach(item => {
        window.cart.addItem(item.productId, item.quantity);
      });
      this.showToast("تم إضافة محتويات الطلب السابق إلى سلتك 🍤", "success");
      document.getElementById("cart-drawer-overlay").classList.add("open");
      this.renderCartDrawer();
    } catch (err) {
      this.showToast(err.message, "error");
    }
  }

  handleProfileUpdate(e) {
    e.preventDefault();
    const name = document.getElementById("profile-name").value.trim();
    const phone = document.getElementById("profile-phone").value.trim();
    const address = document.getElementById("profile-address").value.trim();

    try {
      window.auth.updateProfile(name, phone, address);
      this.showToast("تم تحديث الملف الشخصي بنجاح.", "success");
      this.renderHeader();
      window.router.navigateTo("#/account");
    } catch (err) {
      this.showToast(err.message, "error");
    }
  }

  handlePasswordChange(e) {
    e.preventDefault();
    const oldPass = document.getElementById("old-pass").value;
    const newPass = document.getElementById("new-pass").value;

    try {
      window.auth.changePassword(oldPass, newPass);
      this.showToast("تم تغيير كلمة المرور بنجاح.", "success");
      document.getElementById("old-pass").value = "";
      document.getElementById("new-pass").value = "";
    } catch (err) {
      this.showToast(err.message, "error");
    }
  }

  handleLogout() {
    window.auth.logout();
    this.showToast("تم تسجيل الخروج بنجاح. مع السلامة! 👋", "info");
    window.router.navigateTo("#/");
  }

  // --- شاشات الدخول والإنشاء ---
  renderLogin() {
    const view = document.getElementById("router-view");
    view.innerHTML = `
      <div class="auth-container">
        <div class="auth-header">
          <h2>تسجيل الدخول</h2>
          <p>ادخل حسابك لمتابعة السلة وتتبع طلباتك</p>
        </div>
        <form onsubmit="window.app.handleLoginSubmit(event)">
          <div class="form-group">
            <label for="login-email">البريد الإلكتروني</label>
            <input type="email" id="login-email" required>
          </div>
          <div class="form-group">
            <label for="login-password">كلمة المرور</label>
            <input type="password" id="login-password" required>
          </div>
          <div class="remember-forgot">
            <label class="remember-me">
              <input type="checkbox" id="login-remember">
              تذكرني
            </label>
            <a href="javascript:void(0)" onclick="window.app.forgotPasswordMock()" class="forgot-password-link">نسيت كلمة المرور؟</a>
          </div>
          <button type="submit" class="btn btn-primary auth-btn">تسجيل الدخول</button>
        </form>
        <div class="auth-footer">
          ليس لديك حساب؟ <a href="#/register">إنشاء حساب جديد</a>
        </div>
      </div>
    `;

    // التحقق من حساب تذكرني
    const remembered = localStorage.getItem("remember_me_email");
    if (remembered) {
      document.getElementById("login-email").value = remembered;
      document.getElementById("login-remember").checked = true;
    }
  }

  handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const pass = document.getElementById("login-password").value;
    const remember = document.getElementById("login-remember").checked;

    try {
      const user = window.auth.login(email, pass, remember);
      this.showToast(`أهلاً بك مجدداً، ${user.name}! 😊`, "success");
      
      if (user.role === "admin") {
        window.router.navigateTo("#/admin/dashboard");
      } else {
        window.router.navigateTo("#/account");
      }
    } catch (err) {
      this.showToast(err.message, "error");
    }
  }

  forgotPasswordMock() {
    const email = prompt("أدخل بريدك الإلكتروني لاستعادة كلمة المرور:");
    if (email) {
      this.showToast("تم إرسال تعليمات استعادة كلمة المرور إلى بريدك الإلكتروني (محاكاة).", "info");
    }
  }

  renderRegister() {
    const view = document.getElementById("router-view");
    view.innerHTML = `
      <div class="auth-container">
        <div class="auth-header">
          <h2>إنشاء حساب جديد</h2>
          <p>سجل معنا مجاناً واطلب أحلى فسفور في مصر</p>
        </div>
        <form onsubmit="window.app.handleRegisterSubmit(event)">
          <div class="form-group">
            <label for="reg-name">الاسم بالكامل *</label>
            <input type="text" id="reg-name" required placeholder="الاسم الثلاثي">
          </div>
          <div class="form-group">
            <label for="reg-email">البريد الإلكتروني *</label>
            <input type="email" id="reg-email" required placeholder="name@example.com">
          </div>
          <div class="form-group">
            <label for="reg-phone">رقم الموبايل (مصر) *</label>
            <input type="tel" id="reg-phone" required placeholder="01xxxxxxxxx">
          </div>
          <div class="form-group">
            <label for="reg-address">العنوان بالتفصيل (اختياري)</label>
            <textarea id="reg-address" rows="2" placeholder="المدينة، اسم الشارع، العمارة"></textarea>
          </div>
          <div class="form-group">
            <label for="reg-password">كلمة المرور *</label>
            <input type="password" id="reg-password" required placeholder="6 أحرف على الأقل">
          </div>
          <button type="submit" class="btn btn-primary auth-btn">إنشاء حساب جديد</button>
        </form>
        <div class="auth-footer">
          لديك حساب بالفعل؟ <a href="#/login">تسجيل الدخول</a>
        </div>
      </div>
    `;
  }

  handleRegisterSubmit(e) {
    e.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const phone = document.getElementById("reg-phone").value.trim();
    const address = document.getElementById("reg-address").value.trim();
    const pass = document.getElementById("reg-password").value;

    try {
      window.auth.register(name, email, phone, pass, address);
      this.showToast("تم إنشاء الحساب بنجاح! أهلاً بك في مطعم البرج. 🎉", "success");
      window.router.navigateTo("#/account");
    } catch (err) {
      this.showToast(err.message, "error");
    }
  }

  // --- طباعة الفاتورة للتحميل ---
  printInvoice(orderId) {
    const order = window.db.getOrderById(orderId);
    if (!order) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html lang="ar" dir="rtl">
      <head>
        <title>فاتورة رقم #${order.id}</title>
        <style>
          body { font-family: 'Cairo', sans-serif; padding: 20px; line-height: 1.5; direction: rtl; text-align: right; }
          .invoice-box { max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
          table { width: 100%; line-height: inherit; text-align: right; border-collapse: collapse; }
          table td { padding: 8px; vertical-align: top; }
          table tr td:nth-child(2) { text-align: left; }
          table tr.heading td { background: #eee; border-bottom: 1px solid #ddd; font-weight: bold; }
          table tr.item td { border-bottom: 1px solid #eee; }
          table tr.total td:nth-child(2) { font-weight: bold; border-top: 2px solid #333; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <table cellpadding="0" cellspacing="0">
            <tr style="border-bottom: 2px solid #333;">
              <td colspan="2" style="font-size: 1.5rem; font-weight: bold; padding-bottom: 20px;">
                🌊 مطعم البرج للمأكولات البحرية
              </td>
            </tr>
            <tr>
              <td>
                رقم الفاتورة: #${order.id}<br>
                التاريخ: ${order.date}<br>
                التوقيت: ${order.time}
              </td>
              <td>
                العميل: ${order.customerName}<br>
                الهاتف: ${order.phone}<br>
                العنوان: ${order.address}
              </td>
            </tr>
            <tr class="heading" style="margin-top: 20px;">
              <td>الطبق</td>
              <td>المجموع</td>
            </tr>
            ${order.items.map(item => `
              <tr class="item">
                <td>${item.name} (كمية: ${item.quantity} x ${item.price} ج.م)</td>
                <td>${item.price * item.quantity} ج.م</td>
              </tr>
            `).join("")}
            <tr style="height: 20px;"><td></td><td></td></tr>
            <tr>
              <td>المجموع الفرعي</td>
              <td>${order.subtotal.toFixed(1)} ج.م</td>
            </tr>
            ${order.discountAmount > 0 ? `
              <tr style="color: green;">
                <td>الخصم والكوبون</td>
                <td>-${order.discountAmount.toFixed(1)} ج.م</td>
              </tr>
            ` : ""}
            <tr>
              <td>الضريبة (14%)</td>
              <td>${order.taxAmount.toFixed(1)} ج.م</td>
            </tr>
            <tr>
              <td>رسوم التوصيل</td>
              <td>${order.deliveryFee} ج.م</td>
            </tr>
            <tr class="total">
              <td>الإجمالي الكلي</td>
              <td>${order.grandTotal.toFixed(1)} ج.م</td>
            </tr>
          </table>
          <div style="text-align: center; margin-top: 30px; font-size: 0.85rem;">شكراً لتعاملك معنا وبالهنا والشفا! 🦈</div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  }

  // --- التحميل الكسول للصور (Lazy Loading) ---
  lazyLoadImages() {
    const images = document.querySelectorAll(".lazy-image");
    
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.getAttribute("data-src");
            img.onload = () => img.classList.add("loaded");
            observer.unobserve(img);
          }
        });
      });
      images.forEach(img => observer.observe(img));
    } else {
      // بديل للمتصفحات القديمة
      images.forEach(img => {
        img.src = img.getAttribute("data-src");
        img.classList.add("loaded");
      });
    }
  }

  // ==========================================
  // لوحة تحكم المدير (ADMIN DASHBOARD VIEWS)
  // ==========================================
  
  getAdminLayoutHtml(activeLink, contentHtml) {
    const user = window.auth.getCurrentUser();
    return `
      <div class="admin-layout">
        <aside class="admin-sidebar">
          <div style="text-align: center; padding-bottom: 15px; border-bottom: 1px solid var(--border-color);">
            <h3 style="color: var(--primary-color); font-weight: 900;">لوحة التحكم ⚙️</h3>
            <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 700;">مدير النظام: ${user.name}</span>
          </div>

          <div class="admin-menu-title">الإحصائيات والبيانات</div>
          <a href="#/admin/dashboard" class="account-menu-item ${activeLink === 'dashboard' ? 'active' : ''}">📊 الإحصائيات العامة</a>
          
          <div class="admin-menu-title">إدارة المطبخ والمنيو</div>
          <a href="#/admin/products" class="account-menu-item ${activeLink === 'products' ? 'active' : ''}">🍔 إدارة المنتجات</a>
          <a href="#/admin/categories" class="account-menu-item ${activeLink === 'categories' ? 'active' : ''}">📂 إدارة الأقسام</a>
          <a href="#/admin/orders" class="account-menu-item ${activeLink === 'orders' ? 'active' : ''}">📋 إدارة الطلبات</a>
          
          <div class="admin-menu-title">المستخدمين والمراجعات</div>
          <a href="#/admin/users" class="account-menu-item ${activeLink === 'users' ? 'active' : ''}">👥 إدارة المستخدمين</a>
          <a href="#/admin/reviews" class="account-menu-item ${activeLink === 'reviews' ? 'active' : ''}">⭐️ إدارة التقييمات</a>
          
          <div class="admin-menu-title">الضبط والموقع</div>
          <a href="#/admin/settings" class="account-menu-item ${activeLink === 'settings' ? 'active' : ''}">⚙️ إعدادات المطعم</a>
          
          <a href="#/" class="account-menu-item" style="margin-top: auto; color: var(--secondary-color);">🏠 العودة للموقع</a>
          <a href="javascript:void(0)" onclick="window.app.handleLogout()" class="account-menu-item" style="color: var(--error-color);">🚪 تسجيل الخروج</a>
        </aside>
        <main class="admin-content">
          ${contentHtml}
        </main>
      </div>
    `;
  }

  // 1. رئيسية الإحصائيات (Dashboard Home)
  renderAdminDashboard() {
    const orders = window.db.getOrders();
    const users = window.db.getUsers().filter(u => u.role !== 'admin');
    const products = window.db.getProducts();
    const reviews = window.db.getReviews();

    // حساب الـ 12 كارت إحصائي المطلوبين
    const totalOrders = orders.length;
    const totalCustomers = users.length;
    const totalProducts = products.length;

    // تصفية اليوم
    const todayStr = window.db.formatDate(new Date());
    const todayOrders = orders.filter(o => o.date === todayStr);
    const todayOrdersCount = todayOrders.length;
    const todayRevenue = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    
    // المبيعات الشهرية الإجمالية
    const monthlyRevenue = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.grandTotal, 0);

    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const preparingOrders = orders.filter(o => o.status === 'preparing').length;
    const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    const totalReviews = reviews.length;
    const avgRating = parseFloat((reviews.reduce((sum, r) => sum + r.rating, 0) / (totalReviews || 1)).toFixed(1));

    const dashboardHtml = `
      <h2 style="font-weight: 800; margin-bottom: 25px;">مؤشرات الأداء والإحصائيات الحية 📊</h2>
      
      <div class="admin-stats-grid">
        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-value">${totalOrders}</span>
            <span class="stat-label">إجمالي الطلبات</span>
          </div>
          <div class="stat-icon">📦</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-value">${totalCustomers}</span>
            <span class="stat-label">إجمالي الزبائن</span>
          </div>
          <div class="stat-icon">👥</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-value">${totalProducts}</span>
            <span class="stat-label">إجمالي المأكولات</span>
          </div>
          <div class="stat-icon">🦐</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-value">${todayOrdersCount}</span>
            <span class="stat-label">طلبات اليوم</span>
          </div>
          <div class="stat-icon">📅</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-value">${todayRevenue.toFixed(1)} ج.م</span>
            <span class="stat-label">إيرادات اليوم</span>
          </div>
          <div class="stat-icon">💵</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-value">${monthlyRevenue.toFixed(1)} ج.م</span>
            <span class="stat-label">إيرادات الشهر</span>
          </div>
          <div class="stat-icon">📈</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-value">${pendingOrders}</span>
            <span class="stat-label">طلبات معلقة</span>
          </div>
          <div class="stat-icon">⏳</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-value">${preparingOrders}</span>
            <span class="stat-label">جاري التحضير</span>
          </div>
          <div class="stat-icon">🍳</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-value">${deliveredOrders}</span>
            <span class="stat-label">تم تسليمها</span>
          </div>
          <div class="stat-icon">✅</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-value">${cancelledOrders}</span>
            <span class="stat-label">طلبات ملغية</span>
          </div>
          <div class="stat-icon">❌</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-value">${totalReviews}</span>
            <span class="stat-label">إجمالي التقييمات</span>
          </div>
          <div class="stat-icon">💬</div>
        </div>

        <div class="stat-card">
          <div class="stat-info">
            <span class="stat-value">${avgRating} / 5</span>
            <span class="stat-label">متوسط التقييم العام</span>
          </div>
          <div class="stat-icon">⭐</div>
        </div>
      </div>

      <div class="admin-charts-grid">
        <div class="chart-card">
          <div class="chart-card-title">
            <span>مخطط الإيرادات والمبيعات اليومية 💰</span>
          </div>
          <div class="canvas-container">
            <canvas id="revenue-line-chart"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card-title">
            <span>أقسام المأكولات الأكثر طلباً 🍕</span>
          </div>
          <div class="canvas-container">
            <canvas id="category-doughnut-chart"></canvas>
          </div>
        </div>
      </div>
    `;

    const view = document.getElementById("router-view");
    view.innerHTML = this.getAdminLayoutHtml("dashboard", dashboardHtml);

    // تهيئة ورسم المخططات البيانية
    setTimeout(() => {
      // 1. رسم بياني للإيرادات
      const last7Days = [];
      const revenueData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = window.db.formatDate(d);
        last7Days.push(dayStr.substring(0, 5)); // عرض اليوم والشهر فقط
        
        const rev = orders
          .filter(o => o.date === dayStr)
          .reduce((sum, o) => sum + o.grandTotal, 0);
        revenueData.push(rev);
      }
      window.CustomCharts.drawLineChart("revenue-line-chart", last7Days, revenueData);

      // 2. رسم بياني دائري للأقسام الأكثر طلباً
      const categories = window.db.getCategories();
      const catLabels = categories.map(c => c.name);
      const catCounts = categories.map(c => {
        // حساب عدد المبيعات لكل منتج تحت هذا القسم
        let count = 0;
        orders.forEach(o => {
          o.items.forEach(item => {
            const p = products.find(p => p.id === item.productId);
            if (p && p.categoryId === c.id) {
              count += item.quantity;
            }
          });
        });
        return count || 1; // 1 كقيمة افتراضية لعدم إفساد الدائرة
      });
      window.CustomCharts.drawDoughnutChart("category-doughnut-chart", catLabels, catCounts);
    }, 100);
  }

  // 2. إدارة المنتجات (CRUD)
  renderAdminProducts() {
    const products = window.db.getProducts();
    const categories = window.db.getCategories();

    const productsHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <h2 style="font-weight: 800;">إدارة المنتجات والأطباق 🦐</h2>
        <button class="btn btn-primary" onclick="window.app.openAddProductModal()">إضافة منتج جديد +</button>
      </div>

      <div class="orders-table-wrapper" style="background: var(--surface-color); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <table class="orders-table">
          <thead>
            <tr>
              <th>الصورة</th>
              <th>الاسم</th>
              <th>القسم</th>
              <th>السعر الحالي</th>
              <th>المخزون</th>
              <th>متاح للطلب</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${products.map(p => {
              const catName = categories.find(c => c.id === p.categoryId)?.name || "غير محدد";
              const priceText = p.discountPrice ? `${p.discountPrice} ج.م (${p.price})` : `${p.price} ج.م`;
              return `
                <tr>
                  <td><img src="${p.image}" alt="${p.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;"></td>
                  <td><strong>${p.name}</strong></td>
                  <td>${catName}</td>
                  <td>${priceText}</td>
                  <td><strong style="color: ${p.stock <= 5 ? 'var(--error-color)' : 'inherit'};">${p.stock}</strong></td>
                  <td><span class="status-badge status-${p.isAvailable ? 'delivered' : 'cancelled'}">${p.isAvailable ? 'نعم' : 'لا'}</span></td>
                  <td>
                    <button class="btn btn-secondary" onclick="window.app.openEditProductModal('${p.id}')" style="padding: 5px 10px; font-size: 0.8rem;">تعديل</button>
                    <button class="btn btn-primary" onclick="window.app.duplicateProduct('${p.id}')" style="padding: 5px 10px; font-size: 0.8rem; background: var(--secondary-color);">نسخ</button>
                    <button class="btn" onclick="window.app.deleteProduct('${p.id}')" style="padding: 5px 10px; font-size: 0.8rem; background: var(--error-color);">حذف</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;

    const view = document.getElementById("router-view");
    view.innerHTML = this.getAdminLayoutHtml("products", productsHtml);
  }

  duplicateProduct(id) {
    if (confirm("هل تريد عمل نسخة مكررة من هذا المنتج؟")) {
      window.db.duplicateProduct(id);
      this.showToast("تم تكرار المنتج بنجاح.", "success");
      this.renderAdminProducts();
    }
  }

  deleteProduct(id) {
    if (confirm("هل أنت متأكد من حذف هذا المنتج نهائياً من القائمة؟")) {
      window.db.deleteProduct(id);
      this.showToast("تم الحذف بنجاح.", "info");
      this.renderAdminProducts();
    }
  }

  openAddProductModal() {
    const modal = document.getElementById("product-detail-modal");
    const categories = window.db.getCategories();
    
    modal.innerHTML = `
      <div class="modal-content" style="padding: 30px; max-width: 600px;">
        <button class="close-modal-btn">&times;</button>
        <h2 style="font-weight: 800; margin-bottom: 20px;">إضافة طبق جديد</h2>
        <form onsubmit="window.app.saveNewProduct(event)">
          <div class="form-group">
            <label>اسم الطبق *</label>
            <input type="text" id="new-prod-name" required>
          </div>
          <div class="form-group">
            <label>القسم الأساسي *</label>
            <select id="new-prod-cat" required>
              ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>السعر الأساسي (ج.م) *</label>
            <input type="number" id="new-prod-price" required>
          </div>
          <div class="form-group">
            <label>سعر الخصم (ج.م - اختياري)</label>
            <input type="number" id="new-prod-discount">
          </div>
          <div class="form-group">
            <label>كمية المخزون المتاحة *</label>
            <input type="number" id="new-prod-stock" value="20" required>
          </div>
          <div class="form-group">
            <label>رفع صورة الطبق *</label>
            <input type="file" id="new-prod-image-file" accept="image/*" required style="width: 100%;" onchange="window.app.handleImageFileChange(this, 'new-prod-image-preview')">
            <div style="margin-top: 10px; display: none;" id="new-prod-image-preview-container">
              <img id="new-prod-image-preview" src="" style="max-width: 180px; max-height: 130px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            </div>
          </div>
          <div class="form-group">
            <label>وصف الوجبة وتفاصيل التتبيلة *</label>
            <textarea id="new-prod-desc" rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 10px;">
              <input type="checkbox" id="new-prod-available" checked style="width: 18px; height: 18px;">
              عرض المنتج للطلب فورا
            </label>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">حفظ المنتج الجديد ➕</button>
        </form>
      </div>
    `;

    modal.classList.add("open");
  }

  saveNewProduct(e) {
    e.preventDefault();
    const name = document.getElementById("new-prod-name").value.trim();
    const categoryId = document.getElementById("new-prod-cat").value;
    const price = parseFloat(document.getElementById("new-prod-price").value);
    const discInput = document.getElementById("new-prod-discount").value;
    const discountPrice = discInput ? parseFloat(discInput) : null;
    const stock = parseInt(document.getElementById("new-prod-stock").value);
    const image = document.getElementById("new-prod-image-preview").src;
    const description = document.getElementById("new-prod-desc").value.trim();
    const isAvailable = document.getElementById("new-prod-available").checked;

    if (!image || image.includes("giphy.gif")) {
      this.showToast("برجاء الانتظار حتى يتم تحميل ومعالجة الصورة بالكامل.", "warning");
      return;
    }

    window.db.addProduct({
      name,
      categoryId,
      price,
      discountPrice,
      stock,
      image,
      description,
      isAvailable,
      popular: false,
      newest: true
    });

    this.showToast("تم إضافة الطبق بنجاح للوجبات المتاحة.", "success");
    document.getElementById("product-detail-modal").classList.remove("open");
    this.renderAdminProducts();
  }

  openEditProductModal(productId) {
    const p = window.db.getProductById(productId);
    if (!p) return;

    const modal = document.getElementById("product-detail-modal");
    const categories = window.db.getCategories();
    
    modal.innerHTML = `
      <div class="modal-content" style="padding: 30px; max-width: 600px;">
        <button class="close-modal-btn">&times;</button>
        <h2 style="font-weight: 800; margin-bottom: 20px;">تعديل طبق: ${p.name}</h2>
        <form onsubmit="window.app.saveEditedProduct(event, '${p.id}')">
          <div class="form-group">
            <label>اسم الطبق *</label>
            <input type="text" id="edit-prod-name" value="${p.name}" required>
          </div>
          <div class="form-group">
            <label>القسم الأساسي *</label>
            <select id="edit-prod-cat" required>
              ${categories.map(c => `<option value="${c.id}" ${c.id === p.categoryId ? 'selected' : ''}>${c.name}</option>`).join("")}
            </select>
          </div>
          <div class="form-group">
            <label>السعر الأساسي (ج.م) *</label>
            <input type="number" id="edit-prod-price" value="${p.price}" required>
          </div>
          <div class="form-group">
            <label>سعر الخصم (ج.م - اختياري)</label>
            <input type="number" id="edit-prod-discount" value="${p.discountPrice || ''}">
          </div>
          <div class="form-group">
            <label>كمية المخزون المتاحة *</label>
            <input type="number" id="edit-prod-stock" value="${p.stock}" required>
          </div>
          <div class="form-group">
            <label>تغيير صورة الطبق (رفع ملف جديد)</label>
            <input type="file" id="edit-prod-image-file" accept="image/*" style="width: 100%;" onchange="window.app.handleImageFileChange(this, 'edit-prod-image-preview')">
            <div style="margin-top: 10px;" id="edit-prod-image-preview-container">
              <img id="edit-prod-image-preview" src="${p.image}" style="max-width: 180px; max-height: 130px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            </div>
          </div>
          <div class="form-group">
            <label>وصف الوجبة وتفاصيل التتبيلة *</label>
            <textarea id="edit-prod-desc" rows="3" required>${p.description}</textarea>
          </div>
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 10px;">
              <input type="checkbox" id="edit-prod-available" ${p.isAvailable ? 'checked' : ''} style="width: 18px; height: 18px;">
              عرض المنتج للطلب فورا
            </label>
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;">حفظ التغييرات 💾</button>
        </form>
      </div>
    `;

    modal.classList.add("open");
  }

  saveEditedProduct(e, id) {
    e.preventDefault();
    const name = document.getElementById("edit-prod-name").value.trim();
    const categoryId = document.getElementById("edit-prod-cat").value;
    const price = parseFloat(document.getElementById("edit-prod-price").value);
    const discInput = document.getElementById("edit-prod-discount").value;
    const discountPrice = discInput ? parseFloat(discInput) : null;
    const stock = parseInt(document.getElementById("edit-prod-stock").value);
    const image = document.getElementById("edit-prod-image-preview").src;
    const description = document.getElementById("edit-prod-desc").value.trim();
    const isAvailable = document.getElementById("edit-prod-available").checked;

    if (!image || image.includes("giphy.gif")) {
      this.showToast("برجاء الانتظار حتى يتم تحميل ومعالجة الصورة بالكامل.", "warning");
      return;
    }

    window.db.updateProduct(id, {
      name,
      categoryId,
      price,
      discountPrice,
      stock,
      image,
      description,
      isAvailable
    });

    this.showToast("تم تحديث الطبق بنجاح.", "success");
    document.getElementById("product-detail-modal").classList.remove("open");
    this.renderAdminProducts();
  }

  // 3. إدارة الأقسام
  renderAdminCategories() {
    const categories = window.db.getCategories();
    
    const catHtml = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
        <h2 style="font-weight: 800;">إدارة أقسام المطعم 📂</h2>
        <button class="btn btn-primary" onclick="window.app.openAddCategoryModal()">إضافة قسم جديد +</button>
      </div>

      <div class="orders-table-wrapper" style="background: var(--surface-color); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <table class="orders-table">
          <thead>
            <tr>
              <th>أيقونة/صورة</th>
              <th>اسم القسم</th>
              <th>ترتيب العرض</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${categories.map(c => `
              <tr>
                <td><img src="${c.image}" alt="${c.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
                <td><strong>${c.name}</strong></td>
                <td>${c.order}</td>
                <td>
                  <button class="btn btn-secondary" onclick="window.app.openEditCategoryModal('${c.id}')" style="padding: 5px 10px; font-size: 0.8rem;">تعديل</button>
                  <button class="btn" onclick="window.app.deleteCategory('${c.id}')" style="padding: 5px 10px; font-size: 0.8rem; background: var(--error-color);">حذف</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const view = document.getElementById("router-view");
    view.innerHTML = this.getAdminLayoutHtml("categories", catHtml);
  }

  deleteCategory(id) {
    if (confirm("تحذير: حذف القسم سيؤدي لحذف جميع المنتجات المربوطة به تلقائياً. هل تريد المتابعة؟")) {
      window.db.deleteCategory(id);
      this.showToast("تم حذف القسم والوجبات المرتبطة به.", "info");
      this.renderAdminCategories();
    }
  }

  openAddCategoryModal() {
    const modal = document.getElementById("product-detail-modal");
    modal.innerHTML = `
      <div class="modal-content" style="padding: 30px; max-width: 500px;">
        <button class="close-modal-btn">&times;</button>
        <h2 style="font-weight: 800; margin-bottom: 20px;">إضافة قسم جديد</h2>
        <form onsubmit="window.app.saveNewCategory(event)">
          <div class="form-group">
            <label>اسم القسم *</label>
            <input type="text" id="new-cat-name" required>
          </div>
          <div class="form-group">
            <label>رفع صورة القسم *</label>
            <input type="file" id="new-cat-image-file" accept="image/*" required style="width: 100%;" onchange="window.app.handleImageFileChange(this, 'new-cat-image-preview')">
            <div style="margin-top: 10px; display: none;" id="new-cat-image-preview-container">
              <img id="new-cat-image-preview" src="" style="max-width: 150px; max-height: 120px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">إضافة القسم الجديد ➕</button>
        </form>
      </div>
    `;
    modal.classList.add("open");
  }

  saveNewCategory(e) {
    e.preventDefault();
    const name = document.getElementById("new-cat-name").value.trim();
    const image = document.getElementById("new-cat-image-preview").src;

    if (!image || image.includes("giphy.gif")) {
      this.showToast("برجاء الانتظار حتى يتم تحميل ومعالجة الصورة بالكامل.", "warning");
      return;
    }

    window.db.addCategory({ name, image });
    this.showToast("تم إضافة القسم بنجاح.", "success");
    document.getElementById("product-detail-modal").classList.remove("open");
    this.renderAdminCategories();
  }

  openEditCategoryModal(id) {
    const categories = window.db.getCategories();
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    const modal = document.getElementById("product-detail-modal");
    modal.innerHTML = `
      <div class="modal-content" style="padding: 30px; max-width: 500px;">
        <button class="close-modal-btn">&times;</button>
        <h2 style="font-weight: 800; margin-bottom: 20px;">تعديل قسم: ${cat.name}</h2>
        <form onsubmit="window.app.saveEditedCategory(event, '${cat.id}')">
          <div class="form-group">
            <label>اسم القسم *</label>
            <input type="text" id="edit-cat-name" value="${cat.name}" required>
          </div>
          <div class="form-group">
            <label>تغيير صورة القسم (رفع ملف جديد)</label>
            <input type="file" id="edit-cat-image-file" accept="image/*" style="width: 100%;" onchange="window.app.handleImageFileChange(this, 'edit-cat-image-preview')">
            <div style="margin-top: 10px;" id="edit-cat-image-preview-container">
              <img id="edit-cat-image-preview" src="${cat.image}" style="max-width: 150px; max-height: 120px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%;">حفظ التغييرات 💾</button>
        </form>
      </div>
    `;
    modal.classList.add("open");
  }

  saveEditedCategory(e, id) {
    e.preventDefault();
    const name = document.getElementById("edit-cat-name").value.trim();
    const image = document.getElementById("edit-cat-image-preview").src;

    if (!image || image.includes("giphy.gif")) {
      this.showToast("برجاء الانتظار حتى يتم تحميل ومعالجة الصورة بالكامل.", "warning");
      return;
    }

    window.db.updateCategory(id, { name, image });
    this.showToast("تم تحديث القسم بنجاح.", "success");
    document.getElementById("product-detail-modal").classList.remove("open");
    this.renderAdminCategories();
  }

  // 4. إدارة الطلبات
  renderAdminOrders() {
    const orders = window.db.getOrders();

    const ordersHtml = `
      <h2 style="font-weight: 800; margin-bottom: 25px;">إدارة الطلبات الحالية 📋</h2>

      <div class="orders-table-wrapper" style="background: var(--surface-color); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <table class="orders-table">
          <thead>
            <tr>
              <th>الطلب</th>
              <th>العميل</th>
              <th>العنوان والمنطقة</th>
              <th>الإجمالي</th>
              <th>التاريخ والوقت</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td><strong>#${o.id}</strong></td>
                <td>${o.customerName}<br><span style="font-size:0.8rem; color:var(--text-muted);">${o.phone}</span></td>
                <td><strong>${o.deliveryArea}</strong><br><span style="font-size:0.8rem; color:var(--text-muted);">${o.address}</span></td>
                <td>${o.grandTotal.toFixed(1)} ج.م</td>
                <td>${o.date} - ${o.time}</td>
                <td><span class="status-badge status-${o.status}">${this.getStatusTranslation(o.status)}</span></td>
                <td>
                  <select onchange="window.app.updateOrderStatusByAdmin('${o.id}', this.value)" style="padding: 6px; font-weight: 600; font-size: 0.85rem;">
                    <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>تم الاستلام</option>
                    <option value="preparing" ${o.status === 'preparing' ? 'selected' : ''}>جاري التحضير</option>
                    <option value="shipping" ${o.status === 'shipping' ? 'selected' : ''}>خرج للتوصيل</option>
                    <option value="delivered" ${o.status === 'delivered' ? 'selected' : ''}>تم التسليم</option>
                    <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>تم الإلغاء</option>
                  </select>
                  <button class="btn btn-secondary" onclick="window.app.printInvoice('${o.id}')" style="padding: 6px 10px; font-size: 0.8rem; margin-right: 5px;">📄</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const view = document.getElementById("router-view");
    view.innerHTML = this.getAdminLayoutHtml("orders", ordersHtml);
  }

  updateOrderStatusByAdmin(orderId, newStatus) {
    window.db.updateOrderStatus(orderId, newStatus);
    this.showToast(`تم تحديث حالة الطلب #${orderId} بنجاح.`, "success");
    this.renderAdminOrders();
  }

  // 5. إدارة المستخدمين
  renderAdminUsers() {
    const users = window.db.getUsers().filter(u => u.role !== 'admin');

    const usersHtml = `
      <h2 style="font-weight: 800; margin-bottom: 25px;">إدارة حسابات المستخدمين والزبائن 👥</h2>

      <div class="orders-table-wrapper" style="background: var(--surface-color); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <table class="orders-table">
          <thead>
            <tr>
              <th>العميل</th>
              <th>البريد الإلكتروني</th>
              <th>الهاتف</th>
              <th>حالة الحساب</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td>${u.phone}</td>
                <td><span class="status-badge status-${u.suspended ? 'cancelled' : 'delivered'}">${u.suspended ? 'معلق ❌' : 'نشط ✅'}</span></td>
                <td>
                  <button class="btn ${u.suspended ? 'btn-primary' : 'btn-secondary'}" onclick="window.app.toggleUserSuspension('${u.id}', ${!u.suspended})" style="padding: 6px 12px; font-size: 0.8rem;">
                    ${u.suspended ? 'تنشيط الحساب' : 'تعليق الحساب'}
                  </button>
                  <button class="btn" onclick="window.app.deleteUser('${u.id}')" style="padding: 6px 12px; font-size: 0.8rem; background: var(--error-color);">حذف</button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const view = document.getElementById("router-view");
    view.innerHTML = this.getAdminLayoutHtml("users", usersHtml);
  }

  toggleUserSuspension(userId, state) {
    window.db.updateUser(userId, { suspended: state });
    this.showToast(state ? "تم تعليق حساب العميل بنجاح." : "تم تنشيط حساب العميل.", "info");
    this.renderAdminUsers();
  }

  deleteUser(userId) {
    if (confirm("هل تريد حذف هذا العميل نهائياً من قاعدة البيانات؟")) {
      window.db.deleteUser(userId);
      this.showToast("تم الحذف بنجاح.", "info");
      this.renderAdminUsers();
    }
  }

  // 6. إدارة التقييمات
  renderAdminReviews() {
    const reviews = window.db.getData("reviews");
    const products = window.db.getProducts();

    const reviewsHtml = `
      <h2 style="font-weight: 800; margin-bottom: 25px;">مراجعة تقييمات العملاء ⭐️</h2>

      <div class="orders-table-wrapper" style="background: var(--surface-color); padding: 20px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm);">
        <table class="orders-table">
          <thead>
            <tr>
              <th>المنتج</th>
              <th>العميل</th>
              <th>التقييم</th>
              <th>التعليق</th>
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${reviews.map(r => {
              const p = products.find(p => p.id === r.productId);
              return `
                <tr>
                  <td><strong>${p ? p.name : 'منتج محذوف'}</strong></td>
                  <td>${r.userName}</td>
                  <td><span class="stars">${'★'.repeat(r.rating)}${ '☆'.repeat(5 - r.rating)}</span></td>
                  <td><p style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${r.comment}</p></td>
                  <td><span class="status-badge status-${r.approved ? 'delivered' : 'preparing'}">${r.approved ? 'معتمد' : 'معلق للموافقة'}</span></td>
                  <td>
                    ${!r.approved ? `
                      <button class="btn btn-primary" onclick="window.app.approveReview('${r.id}')" style="padding: 5px 10px; font-size: 0.8rem;">موافقة ونشر</button>
                    ` : ""}
                    <button class="btn" onclick="window.app.deleteReview('${r.id}')" style="padding: 5px 10px; font-size: 0.8rem; background: var(--error-color);">حذف</button>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;

    const view = document.getElementById("router-view");
    view.innerHTML = this.getAdminLayoutHtml("reviews", reviewsHtml);
  }

  approveReview(id) {
    window.db.approveReview(id);
    this.showToast("تم نشر التقييم وحساب متوسط نجوم الوجبة.", "success");
    this.renderAdminReviews();
  }

  deleteReview(id) {
    if (confirm("هل تريد حذف هذا التقييم نهائياً؟")) {
      window.db.deleteReview(id);
      this.showToast("تم الحذف بنجاح.", "info");
      this.renderAdminReviews();
    }
  }

  // 7. إعدادات المطعم (Settings Page)
  renderAdminSettings() {
    const s = window.db.getSettings();

    const settingsHtml = `
      <h2 style="font-weight: 800; margin-bottom: 25px;">إعدادات المطعم والنظام ⚙️</h2>

      <form onsubmit="window.app.saveSystemSettings(event)" style="background: var(--surface-color); border: 1px solid var(--border-color); padding: 30px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <div style="grid-column: 1 / -1; font-weight: 800; font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">البيانات الأساسية والهوية</div>
        
        <div class="form-group">
          <label>اسم المطعم</label>
          <input type="text" id="set-name" value="${s.name}" required>
        </div>

        <div class="form-group">
          <label>اللوجو (أيقونة/رموز تعبيرية)</label>
          <input type="text" id="set-logo" value="${s.logo}" required>
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label>تغيير صورة البانر (الخلفية الرئيسية)</label>
          <input type="file" id="set-banner-file" accept="image/*" style="width: 100%;" onchange="window.app.handleImageFileChange(this, 'set-banner-preview')">
          <div style="margin-top: 10px;" id="set-banner-preview-container">
            <img id="set-banner-preview" src="${s.bannerImage}" style="max-width: 300px; max-height: 150px; object-fit: cover; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          </div>
        </div>

        <div class="form-group">
          <label>عنوان ترحيبي عريض (Hero Header)</label>
          <input type="text" id="set-hero-title" value="${s.heroTitle}" required>
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label>عنوان فرعي للترحيب (Hero Subtitle)</label>
          <input type="text" id="set-hero-sub" value="${s.heroSubtitle}" required>
        </div>

        <div style="grid-column: 1 / -1; font-weight: 800; font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-top: 15px;">معلومات التواصل الاجتماعي</div>

        <div class="form-group">
          <label>رقم الواتساب للتواصل (بالصيغة الدولية)</label>
          <input type="text" id="set-whatsapp" value="${s.whatsappNumber}" required>
        </div>

        <div class="form-group">
          <label>رقم الموبايل للاتصال</label>
          <input type="text" id="set-phone" value="${s.phoneNumber}" required>
        </div>

        <div class="form-group">
          <label>البريد الإلكتروني للمطعم</label>
          <input type="email" id="set-email" value="${s.email}" required>
        </div>

        <div class="form-group">
          <label>مواعيد العمل اليومية</label>
          <input type="text" id="set-working-hours" value="${s.workingHours}" required>
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label>العنوان بالتفصيل</label>
          <input type="text" id="set-address" value="${s.address}" required>
        </div>

        <div style="grid-column: 1 / -1; font-weight: 800; font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-top: 15px;">الرسوم والطلبات والضرائب</div>

        <div class="form-group">
          <label>رسوم التوصيل الافتراضية (ج.م)</label>
          <input type="number" id="set-delivery-fee" value="${s.deliveryFee}" required>
        </div>

        <div class="form-group">
          <label>الحد الأدنى للطلب (ج.م)</label>
          <input type="number" id="set-min-order" value="${s.minimumOrder}" required>
        </div>

        <div class="form-group">
          <label>نسبة الضريبة (%)</label>
          <input type="number" id="set-tax" value="${s.taxPercentage}" required>
        </div>

        <div class="form-group">
          <label>العملة الافتراضية</label>
          <input type="text" id="set-currency" value="${s.currency}" required>
        </div>

        <div style="grid-column: 1 / -1; font-weight: 800; font-size: 1.1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 10px; margin-top: 15px;">إعدادات الأرشفة والـ SEO</div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label>عنوان محركات البحث الأساسي (Meta Title)</label>
          <input type="text" id="set-seo-title" value="${s.seoTitle}" required>
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label>وصف محركات البحث (Meta Description)</label>
          <textarea id="set-seo-desc" rows="3" required>${s.seoDescription}</textarea>
        </div>

        <div class="form-group" style="grid-column: 1 / -1;">
          <label>الكلمات الدلالية المفتاحية (تفصل بينها بفواصل)</label>
          <input type="text" id="set-seo-keys" value="${s.seoKeywords}" required>
        </div>

        <div style="grid-column: 1 / -1; text-align: center; margin-top: 20px;">
          <button type="submit" class="btn btn-primary" style="padding: 14px 45px; font-size:1.05rem;">حفظ الإعدادات وتحديث الموقع فورا 💾</button>
        </div>
      </form>
    `;

    const view = document.getElementById("router-view");
    view.innerHTML = this.getAdminLayoutHtml("settings", settingsHtml);
  }

  saveSystemSettings(e) {
    e.preventDefault();
    const bannerImage = document.getElementById("set-banner-preview").src;

    if (!bannerImage || bannerImage.includes("giphy.gif")) {
      this.showToast("برجاء الانتظار حتى يتم تحميل ومعالجة الصورة بالكامل.", "warning");
      return;
    }

    const settings = {
      ...window.db.getSettings(),
      name: document.getElementById("set-name").value.trim(),
      logo: document.getElementById("set-logo").value.trim(),
      bannerImage: bannerImage,
      heroTitle: document.getElementById("set-hero-title").value.trim(),
      heroSubtitle: document.getElementById("set-hero-sub").value.trim(),
      whatsappNumber: document.getElementById("set-whatsapp").value.trim(),
      phoneNumber: document.getElementById("set-phone").value.trim(),
      email: document.getElementById("set-email").value.trim(),
      workingHours: document.getElementById("set-working-hours").value.trim(),
      address: document.getElementById("set-address").value.trim(),
      deliveryFee: parseFloat(document.getElementById("set-delivery-fee").value),
      minimumOrder: parseFloat(document.getElementById("set-min-order").value),
      taxPercentage: parseFloat(document.getElementById("set-tax").value),
      currency: document.getElementById("set-currency").value.trim(),
      seoTitle: document.getElementById("set-seo-title").value.trim(),
      seoDescription: document.getElementById("set-seo-desc").value.trim(),
      seoKeywords: document.getElementById("set-seo-keys").value.trim()
    };

    window.db.saveSettings(settings);
    this.showToast("تم تحديث إعدادات النظام وتغيير أرشفة SEO للموقع بالكامل فوراً!", "success");
    
    // إعادة بناء الهيدر فوراً
    this.renderHeader();
  }
}

// تشغيل التطبيق وجعله عالمياً للتحكم
window.app = new App();
