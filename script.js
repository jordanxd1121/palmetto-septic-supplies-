// PalmettoSepticSupplies — client-side shop (static)
// - Products are defined here; replace or fetch from your CMS/API when ready.
// - Cart stored in localStorage.
// - Checkout is simulated. Replace "simulatePayment" with real payment integration (Stripe/PayPal).

const PRODUCTS = [
{
id: "NS-1000",
title: "Norwesco 1000 Gal Septic Tank (Poly)",
price: 899.00,
category: "tanks",
sku: "NW-1000",
img: "https://images.unsplash.com/photo-1505576391880-9d4f5e1e9a56?w=900&q=60&auto=format&fit=crop",
pickupOnly: false
},
{
id: "ZLR-M53",
title: "Zoeller M53 Effluent Pump (1/3 HP)",
price: 219.00,
category: "pumps",
sku: "ZLR-M53",
img: "https://images.unsplash.com/photo-1593529467225-7f6b2a5a8d38?w=900&q=60&auto=format&fit=crop",
pickupOnly: false
},
{
id: "PVC-10FT",
title: "PVC Schedule 40 — 10ft (1\")",
price: 21.00,
category: "pipe",
sku: "PVC-1-10",
img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&q=60&auto=format&fit=crop",
pickupOnly: false
},
{
id: "CON-RISER",
title: "Concrete Riser — 18in",
price: 49.00,
category: "field",
sku: "CR-18",
img: "https://images.unsplash.com/photo-1560264280-ecf3f7b3f3b8?w=900&q=60&auto=format&fit=crop",
pickupOnly: true
},
{
id: "TEST-KIT",
title: "Septic System Test Kit",
price: 39.00,
category: "tools",
sku: "TK-01",
img: "https://images.unsplash.com/photo-1523731407965-2430cd12f5e4?w=900&q=60&auto=format&fit=crop",
pickupOnly: false
}
];

// ------ Simple helpers ------
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const currency = n => "$" + n.toFixed(2);

// ------ App state ------
let CART = JSON.parse(localStorage.getItem('palmetto_cart')||'{}'); // {productId: qty}
const productGrid = $('#productGrid');
const cartCountEl = $('#cartCount');
const cartModal = $('#cartModal');
const cartItemsEl = $('#cartItems');
const subtotalEl = $('#subtotal');
const shippingCostEl = $('#shippingCost');
const orderTotalEl = $('#orderTotal');

// ------ Render products ------
function renderProducts(list = PRODUCTS){
productGrid.innerHTML = '';
list.forEach(p => {
const card = document.createElement('article');
card.className = 'product-card';
card.innerHTML = `
<div class="product-image"><img src="${p.img}" alt="${p.title}"></div>
<div class="product-meta">
<div class="product-title">${p.title}</div>
<div class="product-sku">SKU: ${p.sku}</div>
<div class="product-price">${currency(p.price)}</div>
<div style="color:var(--muted);font-size:.92rem">${p.pickupOnly ? 'Pickup Only' : 'Ships across SC'}</div>
</div>
<div class="product-actions">
<input type="number" min="1" value="1" aria-label="Quantity" class="qtyInput" style="width:60px;padding:.35rem">
<button class="btn addBtn primary">Add to Cart</button>
</div>
`;
// add handlers
const btn = card.querySelector('.addBtn');
const qtyInput = card.querySelector('.qtyInput');
btn.addEventListener('click', () => {
const q = Math.max(1, parseInt(qtyInput.value||1));
addToCart(p.id, q);
});
productGrid.appendChild(card);
});
}

// ------ Cart ops ------
function addToCart(id, qty=1){
CART[id] = (CART[id]||0) + qty;
saveCart();
updateCartUI();
flashMessage("Added to cart");
}

function removeFromCart(id){
delete CART[id];
saveCart();
updateCartUI();
}

function setQty(id, qty){
if (qty <= 0) removeFromCart(id);
else CART[id] = qty;
saveCart();
updateCartUI();
}

function clearCart(){
CART = {};
saveCart();
updateCartUI();
}

function saveCart(){ localStorage.setItem('palmetto_cart', JSON.stringify(CART)); }

function cartSummary(){
let subtotal = 0, items = [];
for(const id of Object.keys(CART)){
const product = PRODUCTS.find(p=>p.id===id);
if (!product) continue;
const qty = CART[id];
subtotal += product.price * qty;
items.push({...product, qty});
}
return {subtotal, items};
}

// ------ Cart modal UI ------
function updateCartUI(){
const {subtotal, items} = cartSummary();
cartCountEl.textContent = items.reduce((s,i)=>s+i.qty,0);
// render lines
cartItemsEl.innerHTML = items.length ? items.map(it => `
<div class="cart-line" data-id="${it.id}">
<img src="${it.img}" alt="${it.title}">
<div style="flex:1">
<div style="font-weight:700">${it.title}</div>
<div style="color:var(--muted)">${it.sku} • ${currency(it.price)} each</div>
<div class="qty" style="margin-top:.4rem">
<button data-action="dec">-</button>
<input type="number" min="1" value="${it.qty}" style="width:52px;padding:.25rem" data-role="qty">
<button data-action="inc">+</button>
<button data-action="remove" style="margin-left:.5rem" class="btn ghost">Remove</button>
</div>
</div>
<div style="font-weight:800">${currency(it.price * it.qty)}</div>
</div>
`).join('') : '<p>Your cart is empty.</p>';

subtotalEl.textContent = currency(subtotal);
// Basic shipping estimation: free pickup, $25 flat for shipping if subtotal < 500, else $0-$75 depending
const shippingCost = subtotal === 0 ? 0 : (subtotal >= 500 ? 0 : 25);
shippingCostEl.textContent = currency(shippingCost);
orderTotalEl.textContent = currency(subtotal + shippingCost);

// attach event listeners to cart controls
$$('.cart-line').forEach(line => {
const id = line.dataset.id;
line.querySelectorAll('button').forEach(b => {
b.addEventListener('click', () => {
const action = b.dataset.action;
if (action === 'inc') setQty(id, (CART[id]||0) + 1);
if (action === 'dec') setQty(id, Math.max(1, (CART[id]||1) - 1));
if (action === 'remove') removeFromCart(id);
});
});
const input = line.querySelector('input[data-role="qty"]');
if (input){
input.addEventListener('change', () => {
const val = Math.max(1, parseInt(input.value||1));
setQty(id, val);
});
}
});
}

function openCart(){
cartModal.setAttribute('aria-hidden','false');
updateCartUI();
}

function closeCart(){
cartModal.setAttribute('aria-hidden','true');
}

// ------ Search, filters, sort ------
function applyFiltersAndRender(){
let list = PRODUCTS.slice();
const q = $('#searchInput').value.trim().toLowerCase();
if (q){
list = list.filter(p => (p.title + ' ' + p.sku + ' ' + p.category).toLowerCase().includes(q));
}
const catActive = $$('.cat.active')[0]?.dataset.cat || 'all';
if (catActive !== 'all') list = list.filter(p => p.category === catActive);

const avail = $('#availSelect').value;
if (avail === 'pickup') list = list.filter(p => p.pickupOnly);
if (avail === 'ship') list = list.filter(p => !p.pickupOnly);

const minP = parseFloat($('#minPrice').value||'0') || 0;
const maxP = parseFloat($('#maxPrice').value||'0') || 0;
if (minP) list = list.filter(p => p.price >= minP);
if (maxP) list = list.filter(p => p.price <= maxP && maxP>0);

const sort = $('#sortSelect').value;
if (sort === 'price-asc') list.sort((a,b)=>a.price-b.price);
if (sort === 'price-desc') list.sort((a,b)=>b.price-a.price);
if (sort === 'name-asc') list.sort((a,b)=>a.title.localeCompare(b.title));
renderProducts(list);
}

// ------ Small UI helpers ------
function flashMessage(msg){
// quick ephemeral toast (console fallback)
console.log("Toast:", msg);
// In real site: implement toast area
}

document.addEventListener('DOMContentLoaded', () => {
// init
renderProducts(PRODUCTS);
updateCartUI();
document.getElementById('year').textContent = new Date().getFullYear();

// category clicks
$$('.cat').forEach(c=>{
c.addEventListener('click', ()=>{
$$('.cat').forEach(x=>x.classList.remove('active'));
c.classList.add('active');
applyFiltersAndRender();
});
});

// search
$('#searchBtn').addEventListener('click', applyFiltersAndRender);
$('#searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') applyFiltersAndRender(); });

// filters
$('#applyFilters').addEventListener('click', applyFiltersAndRender);
$('#clearFilters').addEventListener('click', ()=>{
$('#searchInput').value=''; $('#minPrice').value=''; $('#maxPrice').value=''; $('#availSelect').value='any'; $('#sortSelect').value='featured';
$$('.cat').forEach(x=>x.classList.remove('active')); document.querySelector('[data-cat="all"]').classList.add('active');
renderProducts(PRODUCTS);
});

// cart open/close
$('#cartBtn').addEventListener('click', openCart);
$('#closeCart').addEventListener('click', closeCart);

// quote button -> simple behavior (open mailto)
$('#quoteBtn').addEventListener('click', () => {
window.location.href = "mailto:orders@palmettosepticsupplies.com?subject=Request%20a%20Quote";
});

// checkout form behavior
const checkoutForm = $('#checkoutForm');
checkoutForm.addEventListener('submit', (ev) => {
ev.preventDefault();
const {subtotal, items} = cartSummary();
if (items.length === 0){
$('#orderMessage').textContent = "Your cart is empty.";
return;
}
// read form
const fd = new FormData(checkoutForm);
const fulfill = fd.get('fulfill');
// if shipping selected, require address (basic)
