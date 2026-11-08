
# VESTRA — Multi-Vendor Fashion E-Commerce Platform

![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-5-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel&logoColor=white)
![Render](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render&logoColor=black)

A modern, full-stack, multi-vendor fashion e-commerce platform built using the MERN stack.

VESTRA provides a luxury-inspired online shopping experience while allowing independent fashion sellers to manage their products, inventory, and orders through dedicated seller dashboards.

The platform includes role-based functionality for **Customers, Sellers, and Administrators**.

---

## Live Demo

**Live Website:**  
https://vestra-delta-three.vercel.app

**Backend API:**  
https://vestra-api-bznn.onrender.com

**GitHub Repository:**  
https://github.com/dulmisliyanage/VESTRA

---

## Project Overview

VESTRA is designed to connect fashion-conscious customers with independent fashion brands through a centralized online marketplace.

The application combines a minimalist user interface with essential e-commerce functionality, including product discovery, seller management, secure authentication, inventory tracking, and order processing.

### Project Objectives

- Develop a complete full-stack e-commerce application.
- Implement authentication and role-based authorization.
- Support multiple independent sellers.
- Provide product and inventory management.
- Build a functional shopping cart and checkout system.
- Implement administrative workflows.
- Create a responsive, modern shopping experience.
- Deploy the application using cloud hosting services.

---

## Technology Stack

### Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios
- Context API
- JavaScript (ES6+)

### Backend

- Node.js
- Express.js
- RESTful APIs
- JWT Authentication
- HTTP-only Cookies

### Database

- MongoDB Atlas
- Mongoose

### Cloud Services

- Cloudinary — Product image storage
- Vercel — Frontend hosting
- Render — Backend hosting
- MongoDB Atlas — Cloud database

### Development Tools

- Visual Studio Code
- Git
- GitHub
- npm

---

## Key Features

### Customer Features

- Customer registration and login
- Browse fashion products
- Search products
- Paginated product listings
- View detailed product information
- Select product variants
- Add products to shopping cart
- Update cart quantities
- Remove products from cart
- Cash-on-delivery checkout
- View order history
- Track order status

### Seller Features

- Seller application process
- Administrator approval workflow
- Dedicated seller dashboard
- Create new products
- Edit existing products
- Delete products
- Upload product images
- Manage product variants
- Manage inventory and stock
- View customer orders
- Update order fulfillment status

### Administrator Features

- Administrator authentication
- Role-based access control
- Review seller applications
- Approve or reject seller applications
- Manage platform products
- Manage orders
- Administrative dashboard

### User Interface Features

- Luxury-inspired minimalist design
- Responsive layouts
- Animated homepage product carousel
- Product image galleries
- Product browsing and navigation
- Interactive shopping cart
- Dedicated customer, seller, and admin interfaces

---

## Application Architecture

VESTRA follows a client-server architecture.

```text
                  CUSTOMER / SELLER / ADMIN
                            |
                            v
                    React Frontend
                       (Vercel)
                            |
                            v
                       REST API
                            |
                            v
                    Express Backend
                       (Render)
                            |
              +-------------+-------------+
              |                           |
              v                           v
         MongoDB Atlas                Cloudinary
          (Database)                (Image Storage)
```

### Project Structure

```text
VESTRA/
|
|-- client/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- contexts/
|   |   |-- pages/
|   |   |-- services/
|   |   |-- App.jsx
|   |   |-- main.jsx
|   |
|   |-- package.json
|   |-- vite.config.js
|
|-- server/
|   |-- controllers/
|   |-- middleware/
|   |-- models/
|   |-- routes/
|   |-- server.js
|   |-- package.json
|
|-- .gitignore
|-- README.md
```

---

## Authentication and Authorization

VESTRA implements JWT-based authentication using HTTP-only cookies.

The platform supports three main user roles:

| Role | Access |
|------|--------|
| Customer | Shopping, cart, checkout, order history |
| Seller | Product management, inventory, order fulfillment |
| Administrator | Seller approvals, product and order administration |

Protected backend endpoints enforce authorization based on the authenticated user's role.

---

## Shopping and Checkout Workflow

The customer shopping process follows these steps:

1. Browse the product collection.
2. Select a product.
3. Choose the required product variant.
4. Add the product to the cart.
5. Review cart items and quantities.
6. Enter checkout information.
7. Place a cash-on-delivery order.
8. View the order confirmation and order history.

The backend handles stock validation and order creation.

MongoDB transactions are used to coordinate order creation and inventory updates.

Checkout idempotency handling helps prevent duplicate order creation.

---

## Seller Workflow

1. A user submits a seller application.
2. An administrator reviews the application.
3. The administrator approves or rejects the request.
4. An approved seller accesses seller functionality.
5. The seller creates products and uploads images.
6. Product variants and inventory are managed.
7. Customer orders can be viewed and fulfilled.

---

## Local Development Setup

### Prerequisites

Ensure the following are installed:

- Node.js
- npm
- Git
- MongoDB Atlas account
- Cloudinary account

### 1. Clone the Repository

```bash
git clone https://github.com/dulmisliyanage/VESTRA.git
cd VESTRA
```

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `server` directory.

Example configuration:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Replace the placeholder values with your own credentials.

Start the development server:

```bash
npm run dev
```

The backend runs locally at:

```text
http://localhost:5000
```

### 3. Frontend Setup

Open another terminal and navigate to the frontend directory from the project root:

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `client` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

## Environment Variables

### Backend Variables

| Variable | Description |
|----------|-------------|
| PORT | Backend server port |
| NODE_ENV | Application environment |
| MONGO_URI | MongoDB Atlas connection string |
| JWT_SECRET | Secret used for JWT signing |
| CLIENT_URL | Allowed frontend origin |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Cloudinary API key |
| CLOUDINARY_API_SECRET | Cloudinary API secret |

### Frontend Variables

| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API base URL |

**Security Note:** Never commit `.env` files, passwords, API secrets, or database credentials to GitHub.

---

## Deployment

VESTRA is deployed using the following services:

| Component | Hosting Platform |
|-----------|------------------|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Product Images | Cloudinary |
| Source Code | GitHub |

### Production URLs

Frontend:

https://vestra-delta-three.vercel.app

Backend:

https://vestra-api-bznn.onrender.com

The frontend communicates with the backend using the configured `VITE_API_URL` environment variable.

The backend uses `CLIENT_URL` to configure the allowed frontend origin.

---

## Security Features

- JWT-based authentication
- HTTP-only authentication cookies
- Role-based access control
- Protected backend routes
- Server-side product and inventory validation
- MongoDB transactions for checkout
- Checkout idempotency handling
- Environment-based secret configuration

Further security testing and production hardening are recommended before handling real commercial transactions.

---

## Future Improvements

- Online payment gateway integration
- Advanced search and product filtering
- Wishlist functionality
- Customer product reviews and ratings
- Seller sales analytics
- Email notifications
- Enhanced accessibility
- Automated unit and integration tests
- Performance optimization
- Additional production security improvements

---

## Project Status

**Status: Deployed — Active Development**

The core multi-vendor e-commerce application has been developed and deployed.

Future development will focus on improving user experience, performance, security, and additional marketplace features.

---

## Author

**Dulmi Sawindi**

GitHub: https://github.com/dulmisliyanage

---

## License

No license has been specified for this project.
