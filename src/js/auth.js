// نظام المصادقة والحسابات - يدير الجلسات والتحقق من المدخلات

class AuthSystem {
  constructor() {
    this.currentUserKey = "elborj_current_user";
  }

  getCurrentUser() {
    return JSON.parse(localStorage.getItem(this.currentUserKey)) || null;
  }

  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === "admin";
  }

  login(email, password, rememberMe = false) {
    const users = window.db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (!user) {
      throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    }

    if (user.suspended) {
      throw new Error("هذا الحساب معلق حالياً. يرجى التواصل مع الإدارة.");
    }

    // حفظ الجلسة
    localStorage.setItem(this.currentUserKey, JSON.stringify(user));
    if (rememberMe) {
      localStorage.setItem("remember_me_email", email);
    } else {
      localStorage.removeItem("remember_me_email");
    }

    // تنبيه التطبيق بتحديث حالة الجلسة
    window.dispatchEvent(new CustomEvent("auth_state_change", { detail: user }));

    return user;
  }

  register(name, email, phone, password, address = "") {
    // التحقق من الحقول
    this.validateName(name);
    this.validateEmail(email);
    this.validatePhone(phone);
    this.validatePassword(password);

    const users = window.db.getUsers();
    const exists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new Error("البريد الإلكتروني مسجل بالفعل!");
    }

    const newUser = {
      id: "u-" + Date.now(),
      email: email.toLowerCase(),
      password,
      role: "user", // مستخدم عادي بشكل افتراضي
      name,
      phone,
      address,
      suspended: false
    };

    users.push(newUser);
    window.db.setData("users", users);
    
    // إضافة إشعار للإدارة وللمستخدم الجديد
    window.db.addNotification("admin", "مستخدم جديد سجل", `قام ${name} بإنشاء حساب جديد.`, "success");
    
    // تسجيل الدخول التلقائي للمستخدم الجديد
    localStorage.setItem(this.currentUserKey, JSON.stringify(newUser));
    window.dispatchEvent(new CustomEvent("auth_state_change", { detail: newUser }));

    return newUser;
  }

  logout() {
    localStorage.removeItem(this.currentUserKey);
    window.dispatchEvent(new CustomEvent("auth_state_change", { detail: null }));
    return true;
  }

  updateProfile(name, phone, address) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("لم يتم العثور على مستخدم نشط.");

    this.validateName(name);
    this.validatePhone(phone);

    currentUser.name = name;
    currentUser.phone = phone;
    currentUser.address = address;

    // تحديث في قاعدة البيانات والملف الشخصي النشط
    window.db.updateUser(currentUser.id, currentUser);
    localStorage.setItem(this.currentUserKey, JSON.stringify(currentUser));
    
    window.dispatchEvent(new CustomEvent("auth_state_change", { detail: currentUser }));
    return currentUser;
  }

  changePassword(oldPassword, newPassword) {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error("لم يتم العثور على مستخدم نشط.");

    // التحقق من صحة كلمة المرور القديمة
    const users = window.db.getUsers();
    const userInDb = users.find(u => u.id === currentUser.id);
    if (!userInDb || userInDb.password !== oldPassword) {
      throw new Error("كلمة المرور الحالية غير صحيحة.");
    }

    this.validatePassword(newPassword);

    userInDb.password = newPassword;
    window.db.updateUser(userInDb.id, userInDb);
    
    // تحديث الجلسة النشطة
    currentUser.password = newPassword;
    localStorage.setItem(this.currentUserKey, JSON.stringify(currentUser));
    return true;
  }

  // --- دوال التحقق من صحة البيانات ---
  validateName(name) {
    if (!name || name.trim().length < 3) {
      throw new Error("من فضلك اكتب الاسم (على الأقل 3 أحرف).");
    }
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      throw new Error("البريد الإلكتروني غير صحيح.");
    }
  }

  validatePhone(phone) {
    // التحقق من أرقام الهواتف المصرية (010, 011, 012, 015) وبطول 11 رقم
    const phoneRegex = /^01[0125]\d{8}$/;
    if (!phone || !phoneRegex.test(phone)) {
      throw new Error("رقم الموبايل غير صحيح. يجب أن يكون رقم مصري مكون من 11 رقم (يبدأ بـ 010 أو 011 أو 012 أو 015).");
    }
  }

  validatePassword(password) {
    if (!password || password.length < 6) {
      throw new Error("كلمة المرور ضعيفة جداً. يجب أن تحتوي على 6 أحرف أو أرقام على الأقل.");
    }
  }
}

window.auth = new AuthSystem();