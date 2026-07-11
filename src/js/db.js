// قاعدة البيانات الهجينة للمطعم
// القراءة: localStorage (سريعة ومتزامنة) | الكتابة: localStorage + Supabase في الخلفية
// يعتمد على supabase-config.js الذي يُحمَّل قبله في index.html

const DEFAULT_SETTINGS = {
  name: "أسماك أبو ناجي",
  logo: "🌊",
  bannerImage: "https://images.unsplash.com/photo-1551248429-40975aa4de74?auto=format&fit=crop&w=1200&q=80",
  heroTitle: "أقوى طواجن وفسفور في مصر",
  heroSubtitle: "طازة من البحر لطاولتك.. طعم إسكندراني على أصوله مع خلطة أسماك أبو ناجي السرية",
  whatsappNumber: "+201012345678",
  phoneNumber: "01012345678",
  email: "info@abunaji-seafood.com",
  address: "طريق الكورنيش، بجوار قلعة قايتباي، الأنفوشي، الإسكندرية",
  workingHours: "يومياً من 12:00 ظهراً حتى 12:00 منتصف الليل",
  facebookLink: "https://facebook.com",
  instagramLink: "https://instagram.com",
  deliveryFee: 35,
  minimumOrder: 150,
  taxPercentage: 14,
  currency: "ج.م",
  seoTitle: "أسماك أبو ناجي | أفضل مطعم سمك وسي فود في الإسكندرية",
  seoDescription: "استمتع بأشهى المأكولات البحرية الطازجة، سمك بلطي وبوري ودنيس، طواجن سي فود بالكريمة، جمبري جامبو، شوربة سي فود مخلية. توصيل سريع في الإسكندرية.",
  seoKeywords: "مطعم سمك, سي فود, الإسكندرية, جمبري, سمك بوري, سمك بلطي, طاجن سي فود, شوربة سي فود, مطعم أسماك أبو ناجي",
  deliveryAreas: [
    { name: "الأنفوشي والمنشية", fee: 20 },
    { name: "محطة الرمل والأزاريطة", fee: 25 },
    { name: "كامب شيزار وسبورتنج", fee: 30 },
    { name: "مصطفى كامل ورشدي", fee: 35 },
    { name: "سموحة وسيدي جابر", fee: 40 },
    { name: "جليم وستانلي", fee: 45 }
  ]
};

const DEFAULT_CATEGORIES = [
  { id: "fish", name: "الأسماك الطازجة", image: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=300&q=80", order: 1 },
  { id: "tawajeen", name: "الطواجن الفسفورية", image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=300&q=80", order: 2 },
  { id: "grill-fried", name: "المشاوي والمقالي", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=300&q=80", order: 3 },
  { id: "soup-rice", name: "الشوربة والأرز", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80", order: 4 },
  { id: "salads", name: "السلطات والمقبلات", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80", order: 5 },
  { id: "drinks", name: "مشروبات منعشة", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80", order: 6 }
];

const DEFAULT_PRODUCTS = [
  {
    id: "p1",
    name: "سمك بوري سنجاري بالخلطة الإسكندراني",
    categoryId: "fish",
    description: "سمك بوري طازج مفتوح سنجاري، مخبوز في الفرن مع البصل، الطماطم، الكرفس، الثوم، الفلفل الحار والليمون مع خلطة البهارات السرية.",
    price: 180,
    discountPrice: 160,
    stock: 25,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=500&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=500&q=80",
      "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=500&q=80"
    ],
    rating: 4.8,
    reviewsCount: 15,
    popular: true,
    newest: false
  },
  {
    id: "p2",
    name: "سمك بلطي مقلي مقرمش",
    categoryId: "grill-fried",
    description: "سمك بلطي بلدي متبل بالثوم، الكمون، والليمون، مقلي ومقرمش جداً يقدم مع شرائح الليمون الأخضر.",
    price: 90,
    discountPrice: null,
    stock: 50,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=500&q=80",
    gallery: ["https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=500&q=80"],
    rating: 4.6,
    reviewsCount: 22,
    popular: true,
    newest: false
  },
  {
    id: "p3",
    name: "طاجن جمبري إسكندراني بالكريمة والجبنة",
    categoryId: "tawajeen",
    description: "قطع جمبري وسط مطبوخة مع الكريمة اللباني الغنية، الفلفل الملون، الثوم وجبنة الموتزاريلا الذائبة في الفرن البلدي.",
    price: 240,
    discountPrice: 220,
    stock: 15,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80",
    gallery: ["https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80"],
    rating: 4.9,
    reviewsCount: 34,
    popular: true,
    newest: true
  },
  {
    id: "p4",
    name: "شوربة سي فود مخلية بالكريمة (سوبر فسفور)",
    categoryId: "soup-rice",
    description: "شوربة غنية بالكريمة تحتوي على جمبري مخلي، كاليماري، قطع فيليه سمك، كابوريا وبلح البحر بالتتبيلة الإسكندرانية.",
    price: 130,
    discountPrice: null,
    stock: 40,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
    gallery: ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80"],
    rating: 4.9,
    reviewsCount: 45,
    popular: true,
    newest: false
  },
  {
    id: "p5",
    name: "أرز صيادية بالبصل المكرمل اللذيذ",
    categoryId: "soup-rice",
    description: "أرز مصري مفلفل مطبوخ على طريقة الصيادين الإسكندرانية بالبصل المكرمل والكمون والبهارات السرية للمطعم.",
    price: 35,
    discountPrice: null,
    stock: 100,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80",
    gallery: ["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80"],
    rating: 4.5,
    reviewsCount: 60,
    popular: false,
    newest: false
  },
  {
    id: "p6",
    name: "جمبري جامبو مشوي على الفحم (بالكيلو)",
    categoryId: "grill-fried",
    description: "جمبري بحري جامبو طازج مشوي بخلطة المستردة والليمون وزيت الزيتون على الفحم الطبيعي.",
    price: 580,
    discountPrice: 550,
    stock: 10,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=80",
    gallery: ["https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=500&q=80"],
    rating: 4.9,
    reviewsCount: 18,
    popular: true,
    newest: true
  },
  {
    id: "p7",
    name: "طاجن سبيط طواجن بالصلصة الحارة",
    categoryId: "tawajeen",
    description: "قطع سبيط بلدي مطبوخة في طاجن فخار مع صلصة الطماطم الغنية بالثوم والكسبرة والفلفل الحار والخل.",
    price: 190,
    discountPrice: null,
    stock: 18,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80",
    gallery: ["https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=500&q=80"],
    rating: 4.7,
    reviewsCount: 12,
    popular: false,
    newest: false
  },
  {
    id: "p8",
    name: "كاليماري مقلي مقرمش بخلطة الثوم",
    categoryId: "grill-fried",
    description: "حلقات كاليماري بلدي مغطاة بطبقة مقرمشة ومقلية لتقدم مقرمشة مع صوص التارتار والليمون.",
    price: 160,
    discountPrice: null,
    stock: 22,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=500&q=80",
    gallery: ["https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=500&q=80"],
    rating: 4.7,
    reviewsCount: 20,
    popular: false,
    newest: true
  },
  {
    id: "p9",
    name: "سلطة طحينة بلدي بالثوم والخل",
    categoryId: "salads",
    description: "طحينة بيضاء خام مجهزة بالثوم المفروم والكمون والليمون والخل وزيت الزيتون، المقبلات الأساسية مع السمك.",
    price: 15,
    discountPrice: null,
    stock: 150,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80",
    gallery: ["https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=80"],
    rating: 4.4,
    reviewsCount: 88,
    popular: false,
    newest: false
  },
  {
    id: "p10",
    name: "ليمون بالنعناع فريش ومنعش",
    categoryId: "drinks",
    description: "عصير ليمون طازج مخفوق مع أوراق النعناع الأخضر والثلج المجروش والحليب الخفيف لمنع المرارة.",
    price: 25,
    discountPrice: null,
    stock: 200,
    isAvailable: true,
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80",
    gallery: ["https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80"],
    rating: 4.8,
    reviewsCount: 42,
    popular: false,
    newest: false
  }
];

const DEFAULT_USERS = [
  {
    id: "u1",
    email: "admin@elborj.com",
    password: "admin123",
    role: "admin",
    name: "أحمد أسماك أبو ناجي (المدير)",
    phone: "01012345678",
    address: "مكتب الإدارة، مطعم أسماك أبو ناجي، الإسكندرية",
    suspended: false
  },
  {
    id: "u2",
    email: "user@example.com",
    password: "user123",
    role: "user",
    name: "محمد المصري",
    phone: "01234567890",
    address: "15 شارع طلعت حرب، وسط البلد، القاهرة",
    suspended: false
  }
];

const DEFAULT_COUPONS = [
  { code: "EGYPT20", discountPercentage: 20, description: "خصم 20% بمناسبة الافتتاح" },
  { code: "FOSFOR10", discountPercentage: 10, description: "خصم 10% على جميع المأكولات" },
  { code: "ABUNAJI", discountPercentage: 15, description: "خصم خاص لزبائن مطعم أسماك أبو ناجي" }
];

const DEFAULT_REVIEWS = [
  {
    id: "r1",
    productId: "p3",
    userName: "كريم عبد العزيز",
    rating: 5,
    comment: "طاجن الجمبري بالكريمة حكاية! الجبنة بتمط وطعم الكريمة غني جداً. أنصح بيه بشدة لو بتعشق الفسفور.",
    date: "25/06/2026",
    approved: true
  },
  {
    id: "r2",
    productId: "p1",
    userName: "منى زكي",
    rating: 5,
    comment: "السمك البوري السنجاري طازة والخلطة الإسكندرانية بهاراتها مظبوطة بالملي والتوصيل كان سريع وسخن.",
    date: "28/06/2026",
    approved: true
  },
  {
    id: "r3",
    productId: "p4",
    userName: "ياسر جلال",
    rating: 4,
    comment: "الشوربة تحفة ومليانة جمبري وكاليماري مخلية بس كمية الكريمة دسمة شوية زيادة بس ممتازة عموماً.",
    date: "29/06/2026",
    approved: true
  },
  {
    id: "r4",
    productId: "p2",
    userName: "مي عز الدين",
    rating: 5,
    comment: "البلطي المقلي مقرمش ولونه دهبي جميل، والتتبيلة واصلة لحد اللحم جوة. بجد تسلم إيديكم.",
    date: "30/06/2026",
    approved: false
  }
];

const DEFAULT_ORDERS = [
  {
    id: "ord-1001",
    userId: "u2",
    customerName: "محمد المصري",
    phone: "01234567890",
    address: "15 شارع طلعت حرب، وسط البلد، القاهرة",
    deliveryArea: "محطة الرمل والأزاريطة",
    items: [
      { productId: "p3", name: "طاجن جمبري إسكندراني بالكريمة والجبنة", price: 220, quantity: 1 },
      { productId: "p4", name: "شوربة سي فود مخلية بالكريمة (سوبر فسفور)", price: 130, quantity: 2 },
      { productId: "p5", name: "أرز صيادية بالبصل المكرمل اللذيذ", price: 35, quantity: 2 }
    ],
    couponCode: "FOSFOR10",
    discountAmount: 55,
    deliveryFee: 25,
    taxAmount: 69.3,
    subtotal: 550,
    grandTotal: 589.3,
    status: "delivered",
    date: "28/06/2026",
    time: "03:15 م",
    notes: "ياريت الجمبري يكون مستوي كويس والأرز سخن.",
    estimatedDeliveryTime: "45 دقيقة"
  },
  {
    id: "ord-1002",
    userId: "u2",
    customerName: "محمد المصري",
    phone: "01234567890",
    address: "15 شارع طلعت حرب، وسط البلد، القاهرة",
    deliveryArea: "محطة الرمل والأزاريطة",
    items: [
      { productId: "p1", name: "سمك بوري سنجاري بالخلطة الإسكندراني", price: 160, quantity: 2 },
      { productId: "p5", name: "أرز صيادية بالبصل المكرمل اللذيذ", price: 35, quantity: 3 }
    ],
    couponCode: null,
    discountAmount: 0,
    deliveryFee: 25,
    taxAmount: 59.5,
    subtotal: 425,
    grandTotal: 509.5,
    status: "preparing",
    date: "01/07/2026",
    time: "04:30 م",
    notes: "زيادة بصل على الأرز من فضلكم.",
    estimatedDeliveryTime: "60 دقيقة"
  },
  {
    id: "ord-1003",
    userId: "u2",
    customerName: "محمد المصري",
    phone: "01234567890",
    address: "15 شارع طلعت حرب، وسط البلد، القاهرة",
    deliveryArea: "محطة الرمل والأزاريطة",
    items: [
      { productId: "p6", name: "جمبري جامبو مشوي على الفحم (بالكيلو)", price: 550, quantity: 1 }
    ],
    couponCode: "EGYPT20",
    discountAmount: 110,
    deliveryFee: 25,
    taxAmount: 61.6,
    subtotal: 550,
    grandTotal: 526.6,
    status: "pending",
    date: "01/07/2026",
    time: "05:00 م",
    notes: "معاه طحينة زيادة وسلطة خضراء.",
    estimatedDeliveryTime: "50 دقيقة"
  }
];

class MockDatabase {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem("restaurant_settings")) {
      localStorage.setItem("restaurant_settings", JSON.stringify(DEFAULT_SETTINGS));
    }
    if (!localStorage.getItem("categories")) {
      localStorage.setItem("categories", JSON.stringify(DEFAULT_CATEGORIES));
    }
    if (!localStorage.getItem("products")) {
      localStorage.setItem("products", JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem("users")) {
      localStorage.setItem("users", JSON.stringify(DEFAULT_USERS));
    }
    if (!localStorage.getItem("coupons")) {
      localStorage.setItem("coupons", JSON.stringify(DEFAULT_COUPONS));
    }
    if (!localStorage.getItem("reviews")) {
      localStorage.setItem("reviews", JSON.stringify(DEFAULT_REVIEWS));
    }
    if (!localStorage.getItem("orders")) {
      localStorage.setItem("orders", JSON.stringify(DEFAULT_ORDERS));
    }
    if (!localStorage.getItem("notifications")) {
      localStorage.setItem("notifications", JSON.stringify([]));
    }
  }

  getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
  }

  setData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(`db_change_${key}`, { detail: data }));
  }

  getSettings() {
    return JSON.parse(localStorage.getItem("restaurant_settings")) || DEFAULT_SETTINGS;
  }

  saveSettings(settings) {
    this.setData("restaurant_settings", settings);
    // مزامنة مع Supabase في الخلفية
    if (window.supabaseDB) window.supabaseDB._pushSettings(settings);
    return true;
  }

  getCategories() {
    return this.getData("categories").sort((a, b) => a.order - b.order);
  }

  addCategory(category) {
    const categories = this.getCategories();
    category.id = "cat-" + Date.now();
    category.order = categories.length + 1;
    categories.push(category);
    this.setData("categories", categories);
    if (window.supabaseDB) window.supabaseDB._pushCategory(category);
    return category;
  }

  updateCategory(id, updatedCategory) {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index !== -1) {
      categories[index] = { ...categories[index], ...updatedCategory };
      this.setData("categories", categories);
      if (window.supabaseDB) window.supabaseDB._pushCategory(categories[index]);
      return true;
    }
    return false;
  }

  deleteCategory(id) {
    let categories = this.getCategories();
    categories = categories.filter(c => c.id !== id);
    this.setData("categories", categories);
    if (window.supabaseDB) window.supabaseDB._deleteCategory(id);
    
    let products = this.getProducts();
    products = products.filter(p => p.categoryId !== id);
    this.setData("products", products);
    return true;
  }

  reorderCategories(orderedIds) {
    const categories = this.getCategories();
    orderedIds.forEach((id, index) => {
      const cat = categories.find(c => c.id === id);
      if (cat) cat.order = index + 1;
    });
    this.setData("categories", categories);
    return true;
  }

  getProducts() {
    return this.getData("products");
  }

  getProductById(id) {
    return this.getProducts().find(p => p.id === id);
  }

  addProduct(product) {
    const products = this.getProducts();
    product.id = "prod-" + Date.now();
    product.rating = 5.0;
    product.reviewsCount = 0;
    product.gallery = product.gallery || [product.image];
    products.push(product);
    this.setData("products", products);
    if (window.supabaseDB) window.supabaseDB._pushProduct(product);
    
    if (product.stock <= 5) {
      this.addNotification("admin", "تحذير مخزون منخفض", `المنتج الجديد "${product.name}" مخزونه منخفض جداً (${product.stock}).`, "warning");
    }
    return product;
  }

  updateProduct(id, updatedProduct) {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...updatedProduct };
      
      const stock = parseInt(products[index].stock);
      if (stock <= 5 && products[index].isAvailable) {
        this.addNotification("admin", "تحذير مخزون منخفض", `المنتج "${products[index].name}" قارب على النفاد! المخزون المتبقي: ${stock}.`, "warning");
      }

      this.setData("products", products);
      if (window.supabaseDB) window.supabaseDB._pushProduct(products[index]);
      return true;
    }
    return false;
  }

  deleteProduct(id) {
    let products = this.getProducts();
    products = products.filter(p => p.id !== id);
    this.setData("products", products);
    if (window.supabaseDB) window.supabaseDB._deleteProduct(id);
    return true;
  }

  duplicateProduct(id) {
    const products = this.getProducts();
    const original = products.find(p => p.id === id);
    if (original) {
      const copy = {
        ...original,
        id: "prod-" + Date.now(),
        name: original.name + " - نسخة",
        reviewsCount: 0,
        rating: 5.0
      };
      products.push(copy);
      this.setData("products", products);
      if (window.supabaseDB) window.supabaseDB._pushProduct(copy);
      return copy;
    }
    return null;
  }

  getUsers() {
    return this.getData("users");
  }

  getUserById(id) {
    return this.getUsers().find(u => u.id === id);
  }

  updateUser(id, updatedUser) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedUser };
      this.setData("users", users);
      if (window.supabaseDB) window.supabaseDB._pushUser(users[index]);
      return true;
    }
    return false;
  }

  deleteUser(id) {
    let users = this.getUsers();
    users = users.filter(u => u.id !== id);
    this.setData("users", users);
    if (window.supabaseDB) window.supabaseDB._deleteUser(id);
    return true;
  }

  getOrders() {
    return this.getData("orders");
  }

  getOrderById(id) {
    return this.getOrders().find(o => o.id === id);
  }

  addOrder(order) {
    const orders = this.getOrders();
    order.id = "ord-" + Math.floor(1000 + Math.random() * 9000);
    order.date = this.formatDate(new Date());
    order.time = this.formatTime(new Date());
    orders.unshift(order);
    this.setData("orders", orders);
    // مزامنة الطلب مع Supabase في الخلفية
    if (window.supabaseDB) window.supabaseDB._pushOrder(order);

    order.items.forEach(item => {
      const product = this.getProductById(item.productId);
      if (product) {
        const newStock = Math.max(0, product.stock - item.quantity);
        this.updateProduct(product.id, { stock: newStock });
      }
    });

    this.addNotification(order.userId, "تم استلام الطلب", `طلبك رقم #${order.id} قيد المراجعة الآن وسيتغير حالته قريباً.`, "info");
    this.addNotification("admin", "طلب جديد استُلم", `طلب جديد رقم #${order.id} بقيمة ${order.grandTotal} ج.م من ${order.customerName}.`, "success");

    return order;
  }

  updateOrderStatus(id, status) {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index].status = status;
      this.setData("orders", orders);
      // تحديث الحالة في Supabase في الخلفية
      if (window.supabaseDB) window.supabaseDB._updateOrderStatus(id, status);

      let statusText = "";
      let type = "info";
      switch (status) {
        case "pending":
          statusText = "تم استلام الطلب";
          break;
        case "preparing":
          statusText = "جاري التحضير في المطبخ";
          break;
        case "shipping":
          statusText = "خرج للتوصيل مع الدليفري";
          type = "warning";
          break;
        case "delivered":
          statusText = "تم التسليم بنجاح، بالهنا والشفا!";
          type = "success";
          break;
        case "cancelled":
          statusText = "تم إلغاء الطلب";
          type = "error";
          orders[index].items.forEach(item => {
            const product = this.getProductById(item.productId);
            if (product) {
              this.updateProduct(product.id, { stock: product.stock + item.quantity });
            }
          });
          break;
      }

      this.addNotification(orders[index].userId, "تحديث حالة الطلب", `طلبك رقم #${orders[index].id} حالته الآن: ${statusText}`, type);
      return true;
    }
    return false;
  }

  getCoupons() {
    return this.getData("coupons");
  }

  getCouponByCode(code) {
    return this.getCoupons().find(c => c.code.toUpperCase() === code.toUpperCase());
  }

  getReviews() {
    return this.getData("reviews");
  }

  getReviewsByProductId(productId) {
    return this.getReviews().filter(r => r.productId === productId && r.approved);
  }

  addReview(review) {
    const reviews = this.getReviews();
    review.id = "rev-" + Date.now();
    review.date = this.formatDate(new Date());
    review.approved = false;
    reviews.unshift(review);
    this.setData("reviews", reviews);
    if (window.supabaseDB) window.supabaseDB._pushReview(review);

    const product = this.getProductById(review.productId);
    this.addNotification("admin", "تقييم جديد معلق", `كتب العميل ${review.userName} تقييماً لمنتج "${product ? product.name : ''}" بانتظار موافقتك.`, "info");
    return review;
  }

  approveReview(id) {
    const reviews = this.getReviews();
    const index = reviews.findIndex(r => r.id === id);
    if (index !== -1) {
      reviews[index].approved = true;
      this.setData("reviews", reviews);
      if (window.supabaseDB) window.supabaseDB._approveReview(id);

      this.recalculateProductRating(reviews[index].productId);
      return true;
    }
    return false;
  }

  deleteReview(id) {
    let reviews = this.getReviews();
    const review = reviews.find(r => r.id === id);
    reviews = reviews.filter(r => r.id !== id);
    this.setData("reviews", reviews);
    if (window.supabaseDB) window.supabaseDB._deleteReview(id);

    if (review && review.approved) {
      this.recalculateProductRating(review.productId);
    }
    return true;
  }

  recalculateProductRating(productId) {
    const reviews = this.getReviews().filter(r => r.productId === productId && r.approved);
    const products = this.getProducts();
    const pIndex = products.findIndex(p => p.id === productId);

    if (pIndex !== -1) {
      if (reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        products[pIndex].rating = parseFloat((sum / reviews.length).toFixed(1));
        products[pIndex].reviewsCount = reviews.length;
      } else {
        products[pIndex].rating = 5.0;
        products[pIndex].reviewsCount = 0;
      }
      this.setData("products", products);
      // تحديث نجوم المنتج في Supabase
      if (window.supabaseDB) {
        window.supabaseDB._updateProductRating(productId, products[pIndex].rating, products[pIndex].reviewsCount);
      }
    }
  }

  getNotifications(userId) {
    return this.getData("notifications").filter(n => n.userId === userId || (userId === "admin" && n.userId === "admin"));
  }

  addNotification(userId, title, content, type = "info") {
    const notifications = this.getData("notifications");
    const newNotif = {
      id: "notif-" + Date.now(),
      userId,
      title,
      content,
      type,
      read: false,
      date: this.formatDate(new Date()),
      time: this.formatTime(new Date())
    };
    notifications.unshift(newNotif);
    this.setData("notifications", notifications);
    if (window.supabaseDB) window.supabaseDB._pushNotification(newNotif);
    return newNotif;
  }

  markNotificationsAsRead(userId) {
    const notifications = this.getData("notifications");
    notifications.forEach(n => {
      if (n.userId === userId || (userId === "admin" && n.userId === "admin")) {
        n.read = true;
      }
    });
    this.setData("notifications", notifications);
    if (window.supabaseDB) window.supabaseDB._markNotificationsRead(userId);
    return true;
  }

  formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatTime(date) {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${minutes} ${ampm}`;
  }
}

// ============================================================
// تهيئة قاعدة البيانات: إنشاء الكائن ثم تحميل البيانات من Supabase
// ============================================================
window.db = new MockDatabase();

// تحميل البيانات من Supabase إلى localStorage عند بدء التطبيق
// (supabaseDB متاح من supabase-config.js المُحمَّل قبل هذا الملف)
if (window.supabaseDB) {
  window.supabaseDB.loadAllFromSupabase();
}
