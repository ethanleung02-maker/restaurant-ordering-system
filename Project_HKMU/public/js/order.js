const socket = io();
let cart = [];
let menu = [];

// Fetch Menu on Load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/api/menu');
        menu = await res.json();
        renderMenu(menu);
    } catch (err) {
        console.error('Failed to load menu', err);
    }

    // Socket Listeners
    socket.on('connect', () => {
        console.log('Connected to server');
        socket.emit('join', 'user_room');
    });

    socket.on('order_update', (order) => {
        alert(`您的訂單 #${order.id} 狀態已更新為: ${getStatusText(order.status)}`);
    });
});

function renderMenu(items) {
    const container = document.getElementById('menu-list');
    container.innerHTML = items.map(item => `
        <div class="bg-white p-4 rounded-xl shadow-sm flex gap-4">
            <img src="${item.image_url}" alt="${item.name}" class="w-24 h-24 object-cover rounded-lg bg-gray-100">
            <div class="flex-1 flex flex-col justify-between">
                <div>
                    <h3 class="font-bold text-gray-800 text-lg">${item.name}</h3>
                    <p class="text-sm text-gray-500 line-clamp-2">${item.description}</p>
                </div>
                <div class="flex justify-between items-end mt-2">
                    <span class="text-lg font-bold text-orange-600">$${item.price}</span>
                    <button onclick="addToCart(${item.id})" class="bg-orange-100 text-orange-600 hover:bg-orange-200 p-2 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function addToCart(id) {
    const item = menu.find(i => i.id === id);
    const existing = cart.find(i => i.id === id);
    
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    
    updateCartUI();
    
    // Haptic feedback if supported
    if (navigator.vibrate) navigator.vibrate(50);
}

function updateCartUI() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Update Badge
    const badge = document.getElementById('cart-badge');
    badge.innerText = count;
    badge.classList.toggle('hidden', count === 0);
    
    // Update Bottom Bar
    document.getElementById('cart-count').innerText = count;
    document.getElementById('cart-total').innerText = total;
    const bottomBar = document.getElementById('bottom-cart-bar');
    
    if (count > 0) {
        bottomBar.classList.remove('hidden');
        bottomBar.classList.add('animate-slide-in');
    } else {
        bottomBar.classList.add('hidden');
    }
    
    // Update Modal
    document.getElementById('modal-total').innerText = total;
    renderCartItems();
}

function renderCartItems() {
    const container = document.getElementById('cart-items');
    if (cart.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-4">購物車是空的</p>';
        return;
    }
    
    container.innerHTML = cart.map(item => `
        <div class="flex justify-between items-center border-b pb-3 last:border-0">
            <div>
                <h4 class="font-medium">${item.name}</h4>
                <p class="text-sm text-gray-500">$${item.price}</p>
            </div>
            <div class="flex items-center gap-3">
                <button onclick="updateQuantity(${item.id}, -1)" class="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">-</button>
                <span class="font-medium w-4 text-center">${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)" class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">+</button>
            </div>
        </div>
    `).join('');
}

function updateQuantity(id, change) {
    const index = cart.findIndex(i => i.id === id);
    if (index === -1) return;
    
    cart[index].quantity += change;
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    modal.classList.toggle('hidden');
}

async function placeOrder() {
    if (cart.length === 0) return;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderData = {
        items: cart,
        total: total
    };
    
    try {
        const res = await fetch('/api/order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        const data = await res.json();
        
        if (data.success) {
            alert('下單成功！廚房準備中...');
            cart = [];
            updateCartUI();
            toggleCart();
        }
    } catch (err) {
        alert('下單失敗，請重試');
        console.error(err);
    }
}

function getStatusText(status) {
    const map = {
        'pending': '等待中',
        'preparing': '製作中',
        'completed': '已完成'
    };
    return map[status] || status;
}
