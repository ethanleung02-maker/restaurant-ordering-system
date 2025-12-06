require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Mock Data for UI development (replacing DB calls for now to ensure UI works immediately)
let menuItems = [
    { id: 1, category_id: 1, name: '招牌牛肉飯', description: '特製醬汁配上嫩滑牛肉', price: 58, available: true, image_url: 'beef-rice.png' },
    { id: 2, category_id: 1, name: '日式咖哩雞飯', description: '香濃咖哩', price: 52, available: true, image_url: 'fry chicken.png' },
    { id: 3, category_id: 2, name: '炸雞軟骨', description: '佐酒一流', price: 28, available: true, image_url: 'curry-chicken.png' },
    { id: 4, category_id: 3, name: '凍檸茶', description: '茶餐廳經典', price: 18, available: true, image_url: 'ice tea.png' }
];

let orders = [];

// Mock Users (In-memory)
let users = [
    { id: 1, username: 'admin', role: 'admin', restaurant_name: '滋味餐廳 (總店)', status: 'approved' },
    { id: 2, username: 'superadmin', role: 'super_admin', status: 'approved' }
];

// Routes
app.post('/api/register', (req, res) => {
    const { username, restaurant_name } = req.body;
    const newUser = {
        id: users.length + 1,
        username,
        role: 'admin',
        restaurant_name,
        status: 'pending', // 默認為待審批
        created_at: new Date()
    };
    users.push(newUser);
    // Notify super admins
    io.to('super_admins').emit('new_registration', newUser);
    res.json({ success: true });
});

app.get('/api/users/pending', (req, res) => {
    const pendingUsers = users.filter(u => u.role === 'admin' && u.status === 'pending');
    res.json(pendingUsers);
});

app.patch('/api/users/:id/approve', (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'
    const user = users.find(u => u.id == id);
    if (user) {
        user.status = status;
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

app.get('/api/menu', (req, res) => {
    res.json(menuItems);
});

app.post('/api/order', (req, res) => {
    const newOrder = {
        id: orders.length + 1,
        items: req.body.items,
        total: req.body.total,
        status: 'pending',
        created_at: new Date()
    };
    orders.push(newOrder);
    
    // Notify admins
    io.to('admins').emit('new_order', newOrder);
    
    res.json({ success: true, orderId: newOrder.id });
});

app.get('/api/orders/all', (req, res) => {
    res.json(orders);
});

app.patch('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = orders.find(o => o.id == id);
    if (order) {
        order.status = status;
        io.emit('order_update', order); // Notify everyone (simplified)
        res.json({ success: true });
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

// Socket.io
io.on('connection', (socket) => {
    console.log('A user connected');
    
    socket.on('join', (room) => {
        socket.join(room);
        console.log(`User joined ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
