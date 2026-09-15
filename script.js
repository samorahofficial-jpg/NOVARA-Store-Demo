/* =========================================================
   NOVARA Store Demo — script.js
   Learning project only. No backend, no database, no payments.
   ========================================================= */

/* ---------- Product Data ----------
   Fetched from the backend (GET /api/products) instead of being
   hardcoded here — see loadProducts() near the bottom of this file. */
let PRODUCTS = [];

/* ---------- Cart State ---------- */
// cart = [{ id, qty }, ...] persisted in localStorage
let cart = loadCart();

function loadCart() {
  try {
    const saved = localStorage.getItem("novara_cart");
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function saveCart() {
  localStorage.setItem("novara_cart", JSON.stringify(cart));
}

/* ---------- Wishlist State ---------- */
// wishlist = [id, id, ...] persisted in localStorage
let wishlist = loadWishlist();

function loadWishlist() {
  try {
    const saved = localStorage.getItem("novara_wishlist");
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
}

function saveWishlist() {
  localStorage.setItem("novara_wishlist", JSON.stringify(wishlist));
}

function isWishlisted(id) {
  return wishlist.includes(id);
}

/* ---------- DOM References ---------- */
const productGrid = document.getElementById("productGrid");
const cartItemsEl = document.getElementById("cartItems");
const cartCountEl = document.getElementById("cartCount");
const cartTotalQtyEl = document.getElementById("cartTotalQty");
const cartSubtotalEl = document.getElementById("cartSubtotal");
const cartDrawer = document.getElementById("cartDrawer");
const cartOverlay = document.getElementById("cartOverlay");

const shopView = document.getElementById("shopView");
const checkoutView = document.getElementById("checkoutView");
const confirmView = document.getElementById("confirmView");

const orderSummaryItems = document.getElementById("orderSummaryItems");
const summaryQtyEl = document.getElementById("summaryQty");
const summaryTotalEl = document.getElementById("summaryTotal");

const checkoutForm = document.getElementById("checkoutForm");
const mainNav = document.getElementById("mainNav");
const hamburgerBtn = document.getElementById("hamburgerBtn");

const searchInput = document.getElementById("searchInput");
const categoryPills = document.getElementById("categoryPills");
const sortSelect = document.getElementById("sortSelect");
const resultCountEl = document.getElementById("resultCount");
const noProductsMsg = document.getElementById("noProductsMsg");

const productModalOverlay = document.getElementById("productModalOverlay");
const productModal = document.getElementById("productModal");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalImage = document.getElementById("modalImage");
const modalCategory = document.getElementById("modalCategory");
const modalNameEl = document.getElementById("modalName");
const modalPriceEl = document.getElementById("modalPrice");
const modalDescEl = document.getElementById("modalDesc");
const modalQtyValue = document.getElementById("modalQtyValue");
const modalQtyDecrease = document.getElementById("modalQtyDecrease");
const modalQtyIncrease = document.getElementById("modalQtyIncrease");
const modalAddToCartBtn = document.getElementById("modalAddToCartBtn");
const modalHeartBtn = document.getElementById("modalHeartBtn");

const wishlistNavBtn = document.getElementById("wishlistNavBtn");
const wishlistCountEl = document.getElementById("wishlistCount");
const wishlistView = document.getElementById("wishlistView");
const wishlistGrid = document.getElementById("wishlistGrid");
const wishlistEmpty = document.getElementById("wishlistEmpty");
const wishlistContinueBtn = document.getElementById("wishlistContinueBtn");

/* ---------- Helpers ---------- */
function formatPrice(num) {
  return "$" + num.toFixed(2);
}

function findProduct(id) {
  return PRODUCTS.find((p) => p.id === id);
}

function getCartTotals() {
  let totalQty = 0;
  let subtotal = 0;
  cart.forEach((item) => {
    const product = findProduct(item.id);
    if (!product) return;
    totalQty += item.qty;
    subtotal += product.price * item.qty;
  });
  return { totalQty, subtotal };
}

/* ---------- Load Products from Backend ---------- */
async function loadProducts() {
  try {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error("Server responded with status " + response.status);
    }
    PRODUCTS = await response.json();
    renderProducts();
  } catch (err) {
    console.error("Could not load products from the backend:", err.message);
    productGrid.innerHTML = `<p class="empty-cart-msg">Unable to load products. Make sure the backend server is running (npm start), then refresh this page.</p>`;
  }
}

/* ---------- Search / Filter / Sort State ---------- */
let searchQuery = "";
let selectedCategory = "All";
let sortOption = "featured";

function getVisibleProducts() {
  const query = searchQuery.trim().toLowerCase();

  let list = PRODUCTS.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch =
      query === "" ||
      product.name.toLowerCase().includes(query) ||
      product.desc.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  switch (sortOption) {
    case "price-asc":
      list = list.slice().sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      list = list.slice().sort((a, b) => b.price - a.price);
      break;
    case "name-asc":
      list = list.slice().sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      list = list.slice().sort((a, b) => b.name.localeCompare(a.name));
      break;
    default:
      // "featured" — keep the original catalog order
      break;
  }

  return list;
}

/* ---------- Render: Product Grid ---------- */
function renderProducts() {
  const visible = getVisibleProducts();

  productGrid.innerHTML = "";
  visible.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.dataset.id = product.id;
    const wishlisted = isWishlisted(product.id);
    card.innerHTML = `
      <div class="product-image-wrap">
        <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy">
        <button type="button" class="wishlist-heart-btn${wishlisted ? " active" : ""}" data-id="${product.id}" aria-pressed="${wishlisted ? "true" : "false"}" aria-label="${wishlisted ? "Remove from Wishlist" : "Add to Wishlist"}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>
      </div>
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-desc">${product.desc}</div>
        <div class="product-price">${formatPrice(product.price)}</div>
        <button class="add-to-cart-btn" data-id="${product.id}">Add to Cart</button>
      </div>
    `;
    productGrid.appendChild(card);
  });

  noProductsMsg.classList.toggle("hidden", visible.length > 0);
  productGrid.classList.toggle("hidden", visible.length === 0);

  resultCountEl.textContent =
    visible.length === PRODUCTS.length
      ? `${PRODUCTS.length} products`
      : `${visible.length} of ${PRODUCTS.length} products`;
}

/* ---------- Render: Cart Drawer ---------- */
function renderCart() {
  cartItemsEl.innerHTML = "";

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<div class="empty-cart-msg">Your cart is empty.<br>Start adding some products!</div>`;
  } else {
    cart.forEach((item) => {
      const product = findProduct(item.id);
      if (!product) return;

      const row = document.createElement("div");
      row.className = "cart-item";
      row.innerHTML = `
        <img class="cart-item-img" src="${product.image}" alt="${product.name}">
        <div class="cart-item-info">
          <div class="cart-item-name">${product.name}</div>
          <div class="cart-item-price">${formatPrice(product.price)}</div>
          <div class="qty-controls">
            <button class="qty-btn" data-action="decrease" data-id="${product.id}">−</button>
            <span class="qty-value">${item.qty}</span>
            <button class="qty-btn" data-action="increase" data-id="${product.id}">+</button>
          </div>
          <button class="remove-btn" data-action="remove" data-id="${product.id}">Remove</button>
        </div>
      `;
      cartItemsEl.appendChild(row);
    });
  }

  const { totalQty, subtotal } = getCartTotals();
  cartTotalQtyEl.textContent = totalQty;
  cartSubtotalEl.textContent = formatPrice(subtotal);
  cartCountEl.textContent = totalQty;
}

/* ---------- Render: Order Summary (Checkout page) ---------- */
function renderOrderSummary() {
  orderSummaryItems.innerHTML = "";

  if (cart.length === 0) {
    orderSummaryItems.innerHTML = `<p class="empty-cart-msg" style="padding:20px 0;">No items in cart.</p>`;
  } else {
    cart.forEach((item) => {
      const product = findProduct(item.id);
      if (!product) return;
      const row = document.createElement("div");
      row.className = "summary-item-row";
      row.innerHTML = `<span>${product.name} × ${item.qty}</span><span>${formatPrice(product.price * item.qty)}</span>`;
      orderSummaryItems.appendChild(row);
    });
  }

  const { totalQty, subtotal } = getCartTotals();
  summaryQtyEl.textContent = totalQty;
  summaryTotalEl.textContent = formatPrice(subtotal);
}

/* ---------- Cart Actions ---------- */
function addToCart(id, qty = 1) {
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id, qty });
  }
  saveCart();
  renderCart();
}

function increaseQty(id) {
  const item = cart.find((i) => i.id === id);
  if (item) item.qty += 1;
  saveCart();
  renderCart();
}

function decreaseQty(id) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;
  item.qty -= 1;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  renderCart();
}

/* ---------- Event: Add to Cart (event delegation) ---------- */
productGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".add-to-cart-btn");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  addToCart(id);

  // small visual feedback
  const originalText = btn.textContent;
  btn.textContent = "Added ✓";
  btn.classList.add("added");
  setTimeout(() => {
    btn.textContent = originalText;
    btn.classList.remove("added");
  }, 900);
});

/* ---------- Event: Open Product Details Modal (event delegation) ---------- */
productGrid.addEventListener("click", (e) => {
  if (e.target.closest(".add-to-cart-btn") || e.target.closest(".wishlist-heart-btn")) return;

  const card = e.target.closest(".product-card");
  if (!card) return;

  openProductModal(Number(card.dataset.id));
});

/* ---------- Event: Wishlist Heart Toggle (event delegation) ---------- */
productGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".wishlist-heart-btn");
  if (!btn) return;

  toggleWishlist(Number(btn.dataset.id));
});

/* ---------- Product Details Modal ---------- */
let modalProductId = null;
let modalQty = 1;
let lastFocusedBeforeModal = null;

function openProductModal(id) {
  const product = findProduct(id);
  if (!product) return;

  modalProductId = id;
  modalQty = 1;

  modalImage.src = product.image;
  modalImage.alt = product.name;
  modalCategory.textContent = product.category;
  modalNameEl.textContent = product.name;
  modalPriceEl.textContent = formatPrice(product.price);
  modalDescEl.textContent = product.desc;
  modalQtyValue.textContent = modalQty;
  setModalHeartState(id);

  lastFocusedBeforeModal = document.activeElement;
  productModal.classList.add("open");
  productModalOverlay.classList.add("visible");
  modalCloseBtn.focus();
}

function closeProductModal() {
  productModal.classList.remove("open");
  productModalOverlay.classList.remove("visible");
  if (lastFocusedBeforeModal) lastFocusedBeforeModal.focus();
}

modalCloseBtn.addEventListener("click", closeProductModal);
productModalOverlay.addEventListener("click", closeProductModal);

/* ---------- Wishlist Logic ---------- */
function updateWishlistCount() {
  wishlistCountEl.textContent = wishlist.length;
}

function setModalHeartState(id) {
  const active = isWishlisted(id);
  modalHeartBtn.classList.toggle("active", active);
  modalHeartBtn.setAttribute("aria-pressed", active ? "true" : "false");
  modalHeartBtn.setAttribute("aria-label", active ? "Remove from Wishlist" : "Add to Wishlist");
}

function toggleWishlist(id) {
  if (isWishlisted(id)) {
    wishlist = wishlist.filter((i) => i !== id);
  } else {
    wishlist.push(id);
  }
  saveWishlist();
  updateWishlistCount();
  renderProducts();

  if (modalProductId === id) {
    setModalHeartState(id);
  }

  if (!wishlistView.classList.contains("hidden")) {
    renderWishlistView();
  }
}

modalHeartBtn.addEventListener("click", () => {
  if (modalProductId === null) return;
  toggleWishlist(modalProductId);
});

/* ---------- Render: Wishlist View ---------- */
function renderWishlistView() {
  const items = PRODUCTS.filter((product) => isWishlisted(product.id));

  wishlistGrid.innerHTML = "";
  items.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image-wrap">
        <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy">
      </div>
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-price">${formatPrice(product.price)}</div>
        <button type="button" class="add-to-cart-btn" data-action="add-to-cart" data-id="${product.id}">Add to Cart</button>
        <button type="button" class="remove-btn" data-action="remove-wishlist" data-id="${product.id}">Remove from Wishlist</button>
      </div>
    `;
    wishlistGrid.appendChild(card);
  });

  wishlistEmpty.classList.toggle("hidden", items.length > 0);
  wishlistGrid.classList.toggle("hidden", items.length === 0);
}

wishlistGrid.addEventListener("click", (e) => {
  const addBtn = e.target.closest('[data-action="add-to-cart"]');
  if (addBtn) {
    const id = Number(addBtn.dataset.id);
    addToCart(id);

    const originalText = addBtn.textContent;
    addBtn.textContent = "Added ✓";
    addBtn.classList.add("added");
    setTimeout(() => {
      addBtn.textContent = originalText;
      addBtn.classList.remove("added");
    }, 900);
    return;
  }

  const removeBtn = e.target.closest('[data-action="remove-wishlist"]');
  if (removeBtn) {
    toggleWishlist(Number(removeBtn.dataset.id));
  }
});

wishlistNavBtn.addEventListener("click", () => {
  renderWishlistView();
  showView(wishlistView);
});

wishlistContinueBtn.addEventListener("click", () => {
  showView(shopView);
});

modalQtyDecrease.addEventListener("click", () => {
  if (modalQty <= 1) return;
  modalQty -= 1;
  modalQtyValue.textContent = modalQty;
});

modalQtyIncrease.addEventListener("click", () => {
  modalQty += 1;
  modalQtyValue.textContent = modalQty;
});

modalAddToCartBtn.addEventListener("click", () => {
  if (modalProductId === null) return;
  addToCart(modalProductId, modalQty);
  closeProductModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && productModal.classList.contains("open")) {
    closeProductModal();
  }
});

/* ---------- Event: Cart Item Controls (event delegation) ---------- */
cartItemsEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === "increase") increaseQty(id);
  if (action === "decrease") decreaseQty(id);
  if (action === "remove") removeFromCart(id);
});

/* ---------- Search / Category / Sort Controls ---------- */
searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderProducts();
});

categoryPills.addEventListener("click", (e) => {
  const btn = e.target.closest(".pill");
  if (!btn) return;

  selectedCategory = btn.dataset.category;
  categoryPills.querySelectorAll(".pill").forEach((p) => p.classList.remove("active"));
  btn.classList.add("active");
  renderProducts();
});

sortSelect.addEventListener("change", (e) => {
  sortOption = e.target.value;
  renderProducts();
});

/* ---------- Cart Drawer Open / Close ---------- */
const cartToggleBtn = document.getElementById("cartToggleBtn");
const closeCartBtn = document.getElementById("closeCartBtn");

function openCart() {
  cartDrawer.classList.add("open");
  cartOverlay.classList.add("visible");
}

function closeCart() {
  cartDrawer.classList.remove("open");
  cartOverlay.classList.remove("visible");
}

cartToggleBtn.addEventListener("click", openCart);
closeCartBtn.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

/* ---------- Mobile Nav Toggle ---------- */
hamburgerBtn.addEventListener("click", () => {
  mainNav.classList.toggle("open");
  hamburgerBtn.classList.toggle("open");
});

// Close mobile nav when a link is clicked
mainNav.addEventListener("click", () => {
  mainNav.classList.remove("open");
  hamburgerBtn.classList.remove("open");
});

/* ---------- View Switching (Shop / Checkout / Confirmation) ---------- */
function showView(view) {
  shopView.classList.add("hidden");
  checkoutView.classList.add("hidden");
  confirmView.classList.add("hidden");
  wishlistView.classList.add("hidden");
  view.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function goToCheckout() {
  closeCart();
  renderOrderSummary();
  showView(checkoutView);
}

document.getElementById("goToCheckoutBtn").addEventListener("click", goToCheckout);
document.getElementById("navCheckoutLink").addEventListener("click", (e) => {
  e.preventDefault();
  goToCheckout();
});
document.getElementById("backToShopBtn").addEventListener("click", () => showView(shopView));
document.getElementById("continueShoppingBtn").addEventListener("click", () => {
  showView(shopView);
});

document.querySelectorAll('[data-nav="home"]').forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    showView(shopView);
  });
});

/* ---------- Checkout Form Validation ---------- */
function showError(fieldId, message) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById("err-" + fieldId);
  input.classList.add("invalid");
  errorEl.textContent = message;
}

function clearError(fieldId) {
  const input = document.getElementById(fieldId);
  const errorEl = document.getElementById("err-" + fieldId);
  input.classList.remove("invalid");
  errorEl.textContent = "";
}

function validateForm() {
  let isValid = true;

  const name = document.getElementById("custName").value.trim();
  const email = document.getElementById("custEmail").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();

  ["custName", "custEmail", "custPhone", "custAddress"].forEach(clearError);

  if (name.length < 2) {
    showError("custName", "Please enter your full name.");
    isValid = false;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showError("custEmail", "Please enter a valid email address.");
    isValid = false;
  }

  const phoneDigits = phone.replace(/\D/g, "");
  if (phoneDigits.length < 7) {
    showError("custPhone", "Please enter a valid phone number.");
    isValid = false;
  }

  if (address.length < 5) {
    showError("custAddress", "Please enter your shipping address.");
    isValid = false;
  }

  if (cart.length === 0) {
    isValid = false;
    alert("Your cart is empty. Add a product before checking out.");
  }

  return isValid;
}

/* ---------- Demo Payment (UI-only — no real gateway, no real card data) ---------- */
const cardNameInput = document.getElementById("cardName");
const cardNumberInput = document.getElementById("cardNumber");
const cardExpiryInput = document.getElementById("cardExpiry");
const cardCvcInput = document.getElementById("cardCvc");
const demoPaymentBtn = document.getElementById("demoPaymentBtn");
const paymentSuccessBanner = document.getElementById("paymentSuccessBanner");
const placeOrderBtn = document.getElementById("placeOrderBtn");
let demoPaymentVerified = false;

// Cosmetic input formatting only — mirrors how real payment forms look.
cardNumberInput.addEventListener("input", () => {
  const digits = cardNumberInput.value.replace(/\D/g, "").slice(0, 16);
  cardNumberInput.value = digits.replace(/(.{4})/g, "$1 ").trim();
});

cardExpiryInput.addEventListener("input", () => {
  let digits = cardExpiryInput.value.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) digits = digits.slice(0, 2) + "/" + digits.slice(2);
  cardExpiryInput.value = digits;
});

cardCvcInput.addEventListener("input", () => {
  cardCvcInput.value = cardCvcInput.value.replace(/\D/g, "").slice(0, 4);
});

function validateDemoPayment() {
  let isValid = true;
  ["cardName", "cardNumber", "cardExpiry", "cardCvc"].forEach(clearError);

  if (cardNameInput.value.trim().length < 2) {
    showError("cardName", "Please enter the name on the card.");
    isValid = false;
  }

  const digits = cardNumberInput.value.replace(/\D/g, "");
  if (digits.length !== 16) {
    showError("cardNumber", "Enter a 16-digit demo card number.");
    isValid = false;
  }

  const expiryMatch = cardExpiryInput.value.match(/^(\d{2})\/(\d{2})$/);
  if (!expiryMatch) {
    showError("cardExpiry", "Use MM/YY format.");
    isValid = false;
  } else {
    const month = Number(expiryMatch[1]);
    const year = Number(expiryMatch[2]);
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (month < 1 || month > 12) {
      showError("cardExpiry", "Enter a valid month (01-12).");
      isValid = false;
    } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
      showError("cardExpiry", "This demo card has expired.");
      isValid = false;
    }
  }

  if (cardCvcInput.value.trim().length < 3) {
    showError("cardCvc", "Enter a 3-4 digit CVC.");
    isValid = false;
  }

  return isValid;
}

demoPaymentBtn.addEventListener("click", () => {
  paymentSuccessBanner.classList.add("hidden");

  if (!validateDemoPayment()) {
    demoPaymentVerified = false;
    placeOrderBtn.disabled = true;
    return;
  }

  demoPaymentVerified = true;
  paymentSuccessBanner.classList.remove("hidden");
  demoPaymentBtn.textContent = "✓ Demo Payment Verified";
  placeOrderBtn.disabled = false;
});

checkoutForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  if (!demoPaymentVerified) {
    alert("Please complete the demo payment before placing your order.");
    return;
  }

  const name = document.getElementById("custName").value.trim();
  const email = document.getElementById("custEmail").value.trim();
  const phone = document.getElementById("custPhone").value.trim();
  const address = document.getElementById("custAddress").value.trim();

  const orderPayload = {
    customer: { name, email, phone, address },
    items: cart.map((item) => {
      const product = findProduct(item.id);
      return {
        id: item.id,
        name: product ? product.name : "Unknown",
        price: product ? product.price : 0,
        qty: item.qty
      };
    })
  };

  // Send the order to the backend (POST /api/orders). Nothing is persisted
  // server-side yet and no real payment happens — this just demonstrates a
  // real request/response round trip. If the backend is unreachable, the
  // demo still completes locally so checkout keeps working either way.
  try {
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || "Order request failed with status " + response.status);
    }

    const result = await response.json();
    console.log("Order confirmed by backend:", result.orderId);
  } catch (err) {
    console.warn("Could not reach the backend to record the order (continuing in demo mode):", err.message);
  }

  document.getElementById("confirmName").textContent = name;
  document.getElementById("confirmEmail").textContent = email;

  cart = [];
  saveCart();
  renderCart();
  checkoutForm.reset();

  demoPaymentVerified = false;
  paymentSuccessBanner.classList.add("hidden");
  demoPaymentBtn.textContent = "Demo Payment";
  placeOrderBtn.disabled = true;

  showView(confirmView);
});

/* ---------- Init ---------- */
updateWishlistCount();
loadProducts().then(renderCart);
