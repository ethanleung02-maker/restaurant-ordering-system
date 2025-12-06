const socket = io();
let orders = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Load initial orders
    await loadOrders();
    
    // Socket Connection
    socket.on('connect', () => {
        console.log('Admin connected');
        socket.emit('join', 'admins'); // Join admin room
    });
    
    socket.on('new_order', (order) => {
        orders.push(order);
        renderOrders();
        playNotificationSound();
        // Flash effect or toast could be added here
    });

    socket.on('order_update', (updatedOrder) => {
        const idx = orders.findIndex(o => o.id === updatedOrder.id);
        if (idx !== -1) {
            orders[idx] = updatedOrder;
            renderOrders();
        }
    });
});

async function loadOrders() {
    try {
        const res = await fetch('/api/orders/all');
        orders = await res.json();
        renderOrders();
    } catch (err) {
        console.error('Load orders failed', err);
    }
}

function renderOrders() {
    const container = document.getElementById('orders-container');
    const pendingCount = orders.filter(o => o.status === 'pending').length;
    const cookingCount = orders.filter(o => o.status === 'preparing').length;
    const revenue = orders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

    // Update Stats
    document.getElementById('pending-count').innerText = pendingCount;
    document.getElementById('cooking-count').innerText = cookingCount;
    document.getElementById('total-revenue').innerText = revenue.toFixed(0);

    if (orders.length === 0) {
        container.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">尚無新訂單...</div>';
        return;
    }

    // Sort by newest first
    const sortedOrders = [...orders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    container.innerHTML = sortedOrders.map(order => `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div class="p-4 border-b bg-gray-50 flex justify-between items-center">
                <div>
                    <span class="font-bold text-gray-700">#${order.id}</span>
                    <span class="text-xs text-gray-500 ml-2">${new Date(order.created_at).toLocaleTimeString()}</span>
                </div>
                ${getStatusBadge(order.status)}
            </div>
            <div class="p-4 flex-1 overflow-y-auto max-h-60">
                <ul class="space-y-2">
                    ${order.items.map(item => `
                        <li class="flex justify-between text-sm">
                            <span class="text-gray-700"><span class="font-bold">x${item.quantity}</span> ${item.name}</span>
                            <span class="text-gray-500">$${item.price * item.quantity}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
            <div class="p-4 bg-gray-50 border-t flex justify-between items-center">
                <span class="font-bold text-lg">$${order.total}</span>
                <div class="flex gap-2">
                    ${getActionButtons(order)}
                </div>
            </div>
        </div>
    `).join('');
}

function getStatusBadge(status) {
    const styles = {
        'pending': 'bg-blue-100 text-blue-700',
        'preparing': 'bg-orange-100 text-orange-700',
        'completed': 'bg-green-100 text-green-700'
    };
    const labels = {
        'pending': '待處理',
        'preparing': '製作中',
        'completed': '已完成'
    };
    return `<span class="px-2 py-1 rounded text-xs font-bold ${styles[status] || 'bg-gray-100'}">${labels[status] || status}</span>`;
}

function getActionButtons(order) {
    if (order.status === 'pending') {
        return `<button onclick="updateStatus(${order.id}, 'preparing')" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded transition">接單</button>`;
    } else if (order.status === 'preparing') {
        return `<button onclick="updateStatus(${order.id}, 'completed')" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded transition">完成</button>`;
    } else {
        return `<span class="text-green-600 text-sm font-bold">完成</span>`;
    }
}

async function updateStatus(id, status) {
    try {
        const res = await fetch(`/api/orders/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (data.success) {
            // Optimistic update
            const order = orders.find(o => o.id === id);
            if (order) order.status = status;
            renderOrders();
        }
    } catch (err) {
        alert('更新失敗');
    }
}

function playNotificationSound() {
    // Simple beep or you can load an audio file
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Example sound
    audio.play().catch(e => console.log('Audio play failed', e));
}

function logout() {
    localStorage.clear();
    window.location.href = '/';
}
