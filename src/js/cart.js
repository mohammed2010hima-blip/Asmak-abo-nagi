// نظام سلة المشتريات والعمليات الحسابية - الحفظ التلقائي في localStorage

class CartSystem {
  constructor() {
    this.cartKey = "elborj_cart";
    this.couponKey = "elborj_active_coupon";
    this.deliveryAreaKey = "elborj_delivery_area";
    this.items = JSON.parse(localStorage.getItem(this.cartKey)) || [];
    this.activeCoupon = JSON.parse(localStorage.getItem(this.couponKey)) || null;
    this.selectedDeliveryArea = JSON.parse(localStorage.getItem(this.deliveryAreaKey)) || null;
  }

  getItems() {
    return this.items;
  }

  save() {
    localStorage.setItem(this.cartKey, JSON.stringify(this.items));
    localStorage.setItem(this.couponKey, JSON.stringify(this.activeCoupon));
    localStorage.setItem(this.deliveryAreaKey, JSON.stringify(this.selectedDeliveryArea));
    window.dispatchEvent(new CustomEvent("cart_change", { detail: this }));
  }

  addItem(productId, quantity = 1) {
    const product = window.db.getProductById(productId);
    if (!product || !product.isAvailable) {
      throw new Error("المنتج غير متوفر حالياً.");
    }

    const existingIndex = this.items.findIndex(item => item.productId === productId);
    const currentQtyInCart = existingIndex !== -1 ? this.items[existingIndex].quantity : 0;
    const requestedQty = currentQtyInCart + quantity;

    if (requestedQty > product.stock) {
      throw new Error(`عذراً، الكمية المطلوبة غير متوفرة بالمخزن. المتوفر حالياً: ${product.stock}`);
    }

    if (existingIndex !== -1) {
      this.items[existingIndex].quantity = requestedQty;
    } else {
      this.items.push({
        productId: product.id,
        name: product.name,
        price: product.discountPrice || product.price,
        image: product.image,
        quantity: quantity
      });
    }

    this.save();
    return true;
  }

  updateQuantity(productId, quantity) {
    const product = window.db.getProductById(productId);
    if (!product) return false;

    if (quantity <= 0) {
      this.removeItem(productId);
      return true;
    }

    if (quantity > product.stock) {
      throw new Error(`عذراً، الكمية المطلوبة غير متوفرة بالمخزن. المتوفر حالياً: ${product.stock}`);
    }

    const index = this.items.findIndex(item => item.productId === productId);
    if (index !== -1) {
      this.items[index].quantity = quantity;
      this.save();
      return true;
    }
    return false;
  }

  removeItem(productId) {
    this.items = this.items.filter(item => item.productId !== productId);
    this.save();
    return true;
  }

  clear() {
    this.items = [];
    this.activeCoupon = null;
    this.selectedDeliveryArea = null;
    this.save();
    return true;
  }

  applyCoupon(code) {
    const coupon = window.db.getCouponByCode(code);
    if (!coupon) {
      throw new Error("كود الخصم غير صحيح أو منتهي الصلاحية.");
    }
    this.activeCoupon = coupon;
    this.save();
    return coupon;
  }

  removeCoupon() {
    this.activeCoupon = null;
    this.save();
    return true;
  }

  setDeliveryArea(areaName) {
    const settings = window.db.getSettings();
    const area = settings.deliveryAreas.find(a => a.name === areaName);
    if (area) {
      this.selectedDeliveryArea = area;
    } else {
      this.selectedDeliveryArea = null;
    }
    this.save();
  }

  // --- العمليات الحسابية ---
  getSubtotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  getDiscountAmount() {
    if (!this.activeCoupon) return 0;
    const subtotal = this.getSubtotal();
    return (subtotal * this.activeCoupon.discountPercentage) / 100;
  }

  getTaxAmount() {
    const settings = window.db.getSettings();
    const taxableAmount = this.getSubtotal() - this.getDiscountAmount();
    return (taxableAmount * settings.taxPercentage) / 100;
  }

  getDeliveryFee() {
    if (this.selectedDeliveryArea) {
      return this.selectedDeliveryArea.fee;
    }
    const settings = window.db.getSettings();
    return settings.deliveryFee; // رسوم افتراضية إذا لم يتم تحديد منطقة
  }

  getGrandTotal() {
    const subtotal = this.getSubtotal();
    const discount = this.getDiscountAmount();
    const tax = this.getTaxAmount();
    const delivery = this.getDeliveryFee();
    
    if (subtotal === 0) return 0;
    
    return subtotal - discount + tax + delivery;
  }

  getCartCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

window.cart = new CartSystem();
