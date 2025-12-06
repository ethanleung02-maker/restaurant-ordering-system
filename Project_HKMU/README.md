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
```

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

- These classes are used on scrollable containers, buttons and new UI elements to improve the user experience on both desktop and mobile.

## 4. Database schema (PostgreSQL)
PostgreSQL is used to store users, menu data and orders.



Table roles:

- users – user accounts (customers / admins), with hashed passwords and roles.
- categories – menu categories (e.g. main dishes, snacks, drinks).
- menu_items – individual menu items, linked to categories, with prices and images.
- orders – one row per order, linked to the user who created it, with status and total.
- order_items – items inside each order, linked to orders and menu_items.
- The database is responsible for persistently storing all users, menu items, categories, orders and order details.


## 5. Installation
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

## 6. Running the app
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

## 7. API Overview
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

## 8. Frontend – customer side
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


## 9. Frontend – admin panel (real‑time orders)
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

## 10. Technologies used
- Node.js – JavaScript runtime for backend
- Express – HTTP server and REST API
- Socket.IO – real-time communication (orders and status updates)
- PostgreSQL – relational database for persistent storage
- pg – PostgreSQL client for Node.js
- bcrypt – password hashing
- jsonwebtoken – JWT-based authentication (if implemented)
- nodemon – automatic server restart during development
- Google Fonts: Noto Sans TC – main UI font
- Custom CSS utilities – hidden scrollbars, touch optimization, slide-in animations