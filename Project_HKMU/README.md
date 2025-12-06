# Restaurant Ordering System

A real-time restaurant ordering system built with **Node.js**, **Express**, **Socket.IO**, and **PostgreSQL**.

The system supports:

- Customer interface for viewing the menu and placing orders
- Admin interface for monitoring and updating orders in real time
- User accounts (normal users and admins)
- Persistent storage of menu, orders, and users in a PostgreSQL database
- A modern UI using the **Noto Sans TC** web font and simple CSS animations

> Note: In this project, database connection settings are configured directly in `server.js`.  
> A `.env` file is **not required**.

---

## 1. Requirements

- [Node.js](https://nodejs.org/) v16+  
- npm (comes with Node.js)
- PostgreSQL database (local or remote)

---

## 2. Project structure

Example structure:

```text
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

## 3. UI & styling
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

These classes are used on scrollable containers, buttons and new UI elements to improve the user experience on both desktop and mobile.

## 4. Database schema (PostgreSQL)
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

Table roles:

users – user accounts (customers / admins), with hashed passwords and roles.
categories – menu categories (e.g. main dishes, snacks, drinks).
menu_items – individual menu items, linked to categories, with prices and images.
orders – one row per order, linked to the user who created it, with status and total.
order_items – items inside each order, linked to orders and menu_items.
The database is responsible for persistently storing all users, menu items, categories, orders and order details.

## 5. Database connection (no .env)
The backend connects to PostgreSQL using the pg library.
Because .env is not used, the connection settings are written directly in server.js, for example:

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

## 6. Installation
Clone the repository:
bash
git clone https://github.com/ethanleung02-maker/restaurant-ordering-system.git
cd restaurant-ordering-system

Install dependencies:
bash
npm install

Set up the PostgreSQL database:
Create a new database.
Run the SQL from section 4. Database schema in your database.
Edit server.js so the PostgreSQL connection configuration (host, user, password, database) matches your database.

## 7. Running the application
Development mode (with auto‑restart)
bash
npm run dev

(Uses nodemon to restart the server when files change.)

Production / simple run
bash
npm start

The server typically listens on port 3000 (or whatever is configured in server.js).

Open in a browser:

Customer page: http://localhost:3000/
Admin page: http://localhost:3000/admin.html
## 8. API overview
Route names may differ slightly depending on your server.js, but the typical idea is:

GET /api/menu
Returns menu items joined with their categories (from categories and menu_items tables).

POST /api/orders
Creates a new order:

Inserts into orders
Inserts multiple rows into order_items
Emits a new_order Socket.IO event for admins
GET /api/orders/all
Returns all orders (and possibly their items) for the admin dashboard.

PATCH /api/orders/:id/status
Updates an order’s status in the orders table and emits an order_update event.

Optionally, endpoints for user registration / login using hashed passwords (bcrypt) and JWT (jsonwebtoken).

## 9. Frontend – customer side
The customer page (e.g. public/index.html + a JS file such as user.js) does:

On page load:
Calls GET /api/menu to load menu data from the database.
Renders items with image, name, description and price.
Manages a shopping cart in browser memory.
Sends orders to the backend via POST /api/orders.
Uses Socket.IO to:
Connect to the server: const socket = io();
Join a customer room (e.g. socket.emit('join', 'user_room')).
Listen for order_update events and show updated order statuses.
Example snippet:

javascript
const socket = io();
let cart = [];
let menu = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/api/menu');
    menu = await res.json();
    renderMenu(menu);
  } catch (err) {
    console.error('Failed to load menu', err);
  }

  socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('join', 'user_room');
  });

  socket.on('order_update', (order) => {
    alert(`Your order #${order.id} status has been updated to: ${order.status}`);
  });
});

## 10. Frontend – admin panel (real‑time orders)
The admin page (public/admin.html + public/js/admin.js) acts as a real‑time order dashboard.

Main behaviour:

On page load:
Calls GET /api/orders/all to load all existing orders from PostgreSQL.
Opens a Socket.IO connection and joins an "admins" room.
Listens for:
new_order – when a customer creates an order:
Adds it to the local orders array
Re-renders the list
Plays a notification sound
order_update – when an order status is changed:
Updates that order in the orders array
Re-renders the list
Example snippet:

javascript
const socket = io();
let orders = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadOrders();

  socket.on('connect', () => {
    console.log('Admin connected');
    socket.emit('join', 'admins');
  });

  socket.on('new_order', (order) => {
    orders.push(order);
    renderOrders();
    playNotificationSound();
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

## 11. Technologies used
Node.js – JavaScript runtime for backend
Express – HTTP server and REST API
Socket.IO – real-time communication (orders and status updates)
PostgreSQL – relational database for persistent storage
pg – PostgreSQL client for Node.js
bcrypt – password hashing
jsonwebtoken – JWT-based authentication (if implemented)
nodemon – automatic server restart during development
Google Fonts: Noto Sans TC – main UI font
Custom CSS utilities – hidden scrollbars, touch optimization, slide-in animations