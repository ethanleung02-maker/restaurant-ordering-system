Restaurant Ordering System
A real-time restaurant ordering system built with Node.js, Express, Socket.IO, and PostgreSQL.

The system supports:

Customer interface for viewing the menu and placing orders
Admin interface for monitoring and updating orders in real time
User accounts (normal users and admins)
Persistent storage of menu, orders, and users in a PostgreSQL database
A modern UI using the Noto Sans TC web font and simple CSS animations
Note: In this project, database connection settings are configured directly in server.js.
A .env file is not required.

1. Requirements
Node.js v16+
npm (comes with Node.js)
PostgreSQL database (local or remote)
2. Project structure
Example structure:

text
restaurant-ordering-system/
├─ package.json
├─ server.js
├─ public/
│  ├─ index.html     # customer page
│  ├─ admin.html     # admin page
│  ├─ css/
│  │  └─ styles.css  # shared styles (font, scrollbar, animations)
│  ├─ js/
│  │  ├─ user.js     # customer-side JS (menu + cart)
│  │  └─ admin.js    # admin-side JS (order management)
│  └─ images/
│     └─ ...         # menu item images
└─ (other source files)

Key files:

server.js – backend server (Express + Socket.IO + PostgreSQL)
public/index.html – customer UI
public/admin.html – admin UI
public/js/user.js – customer logic (load menu, manage cart, order status)
public/js/admin.js – admin logic (load orders, real-time updates)
public/css/styles.css – fonts, scrollbar styles, mobile optimizations, animations
package.json – dependencies and npm scripts
3. UI & styling
The project uses Noto Sans TC as the main font to support Traditional Chinese text and provide a clean, consistent UI.

Font import (either in HTML <head> or at top of CSS):

css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');

body {
    font-family: 'Noto Sans TC', sans-serif;
}

Additional CSS utilities:

Hidden scrollbars for cleaner UI:

css
.hide-scrollbar::-webkit-scrollbar {
    display: none;
}

.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

Mobile touch optimization:

css
.touch-manipulation {
    touch-action: manipulation;
}

Simple slide‑in animation for elements (e.g. order cards, modals):

css
@keyframes slideIn {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.animate-slide-in {
    animation: slideIn 0.3s ease-out forwards;
}

4. Database schema (PostgreSQL)
PostgreSQL is used to store users, menu data and orders.

sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL
);

CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES categories(id),
  name VARCHAR(100),
  description TEXT,
  price NUMERIC(8,2),
  image_url TEXT,
  available BOOLEAN DEFAULT true
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending', -- pending, preparing, ready, completed
  total NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  menu_id INT REFERENCES menu_items(id),
  quantity INT CHECK (quantity > 0),
  price_at_time NUMERIC(8,2)
);

-- Initial Data
INSERT INTO categories (name) VALUES ('主食'), ('小食'), ('飲品');

5. Database connection (no .env)
The backend connects to PostgreSQL using the pg library:

javascript
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'your_db_username',
  password: 'your_db_password',
  database: 'your_db_name',
});

Replace your_db_username, your_db_password, and your_db_name with your own values.

6. Installation
Clone the repository:

bash
git clone https://github.com/ethanleung02-maker/restaurant-ordering-system.git
cd restaurant-ordering-system

Install dependencies:

bash
npm install

Set up the PostgreSQL database:

Create a new database.
Run the SQL from section 4. Database schema.
Edit server.js so the PostgreSQL configuration matches your database.

7. Running the application
Development mode (auto‑restart)
bash
npm run dev

Production / simple run
bash
npm start

Then open:

http://localhost:3000/ – customer page
http://localhost:3000/admin.html – admin page
8. API overview
GET /api/menu – return menu items with categories
POST /api/orders – create a new order and emit new_order via Socket.IO
GET /api/orders/all – get all orders (admin)
PATCH /api/orders/:id/status – update order status and emit order_update
Optional: user auth (register/login) using bcrypt and jsonwebtoken.

9. Frontend – customer side
Loads menu via GET /api/menu
Manages cart in the browser
Sends orders via POST /api/orders
Listens to order status updates via Socket.IO
javascript
const socket = io();
let cart = [];
let menu = [];

document.addEventListener('DOMContentLoaded', async () => {
  const res = await fetch('/api/menu');
  menu = await res.json();
  renderMenu(menu);

  socket.on('connect', () => {
    socket.emit('join', 'user_room');
  });

  socket.on('order_update', (order) => {
    alert(`Your order #${order.id} status has been updated to: ${order.status}`);
  });
});

10. Frontend – admin panel
Loads all orders via GET /api/orders/all
Joins "admins" room over Socket.IO
Receives new_order and order_update events in real time
javascript
const socket = io();
let orders = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadOrders();

  socket.on('connect', () => {
    socket.emit('join', 'admins');
  });

  socket.on('new_order', (order) => {
    orders.push(order);
    renderOrders();
  });

  socket.on('order_update', (updatedOrder) => {
    const idx = orders.findIndex(o => o.id === updatedOrder.id);
    if (idx !== -1) {
      orders[idx] = updatedOrder;
      renderOrders();
    }
  });
});

11. Technologies used
Node.js
Express
Socket.IO
PostgreSQL + pg
bcrypt
jsonwebtoken (optional)
nodemon
Google Fonts: Noto Sans TC
Custom CSS utilities (hidden scrollbars, touch optimization, animations)