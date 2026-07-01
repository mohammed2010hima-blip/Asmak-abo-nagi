// موجه الصفحات المبني على Hash - يدير التنقل والتحقق من الجلسات (Guards)

class HashRouter {
  constructor() {
    this.routes = {};
    window.addEventListener("hashchange", () => this.handleRouting());
    window.addEventListener("load", () => this.handleRouting());
  }

  addRoute(path, handler) {
    this.routes[path] = handler;
  }

  handleRouting() {
    let hash = window.location.hash || "#/";
    
    // فصل الـ query string إن وجد (مثل ?id=1001)
    let queryString = "";
    const questionMarkIndex = hash.indexOf("?");
    if (questionMarkIndex !== -1) {
      queryString = hash.substring(questionMarkIndex + 1);
      hash = hash.substring(0, questionMarkIndex);
    }

    const params = this.parseQueryString(queryString);
    
    // التحقق من الحماية (Route Guards)
    const currentUser = window.auth.getCurrentUser();
    const isAdmin = window.auth.isAdmin();

    // حماية صفحات الإدارة
    if (hash.startsWith("#/admin") && !isAdmin) {
      this.navigateTo("#/login");
      return;
    }

    // حماية صفحات الحساب وإتمام الطلب
    if ((hash === "#/account" || hash === "#/checkout") && !currentUser) {
      this.navigateTo("#/login");
      return;
    }

    // إعادة توجيه لو كان مسجل دخول وحاول يفتح تسجيل الدخول
    if ((hash === "#/login" || hash === "#/register") && currentUser) {
      if (isAdmin) {
        this.navigateTo("#/admin/dashboard");
      } else {
        this.navigateTo("#/account");
      }
      return;
    }

    // استدعاء معالج الصفحة المقابل
    const handler = this.routes[hash] || this.routes["#/"]; // الهبوط على الرئيسية لو الصفحة غير متوفرة
    if (handler) {
      handler(params);
      
      // إرسال حدث بأن الصفحة تغيرت لتحديث التنشيط في الهيدر والـ SEO
      window.dispatchEvent(new CustomEvent("page_changed", { detail: { hash, params } }));
    }
  }

  navigateTo(hash) {
    window.location.hash = hash;
  }

  parseQueryString(queryString) {
    const params = {};
    if (!queryString) return params;
    
    const pairs = queryString.split("&");
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i].split("=");
      params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || "");
    }
    return params;
  }
}

window.router = new HashRouter();
