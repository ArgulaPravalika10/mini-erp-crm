# Mini ERP + CRM Operations Portal

A full-stack Mini ERP + CRM application for a wholesale/distribution workflow. It covers internal employee login, role-based access, customer CRM follow-ups, product inventory, stock movement history, sales challans, automatic stock deduction, and dashboard reporting.

## Features

- JWT login with hashed passwords and role-based navigation.
- Roles: Admin, Sales, Warehouse, Accounts.
- Customer CRM with create, edit, delete, search, detail pages, follow-up dates, and note history.
- Product and inventory management with SKU, category, warehouse location, stock levels, low-stock alerts, and stock movement logs.
- Sales challans with automatic challan numbers, customer selection, multiple products, product snapshot data, Draft/Confirmed/Cancelled statuses, and stock validation.
- Dashboard with customer/product/challan totals, confirmed revenue, sales trend chart, recent challans, activity feed, and inventory alerts.
- Responsive React dashboard UI with protected routes, loading states, empty states, errors, and success messages.

## Tech Stack

- Backend: Node.js, TypeScript, Express.js, PostgreSQL, pg, bcrypt, jsonwebtoken.
- Frontend: React, TypeScript, React Router, Axios, Vite, CSS.
- Database: PostgreSQL with schema bootstrap on server startup.

## Project Structure

```text
backend/
  src/config/          Database connection and schema bootstrap
  src/controllers/     REST API handlers
  src/middleware/      JWT auth, RBAC, error handling
  src/routes/          API route definitions
  src/scripts/         Seed script for demo users
frontend/
  src/components/      Reusable layout and UI components
  src/context/         Auth context
  src/pages/           Dashboard and module pages
  src/services/        Axios API client
  src/utils/           Formatting helpers
```

## Architecture

The application uses a classic REST architecture. The React frontend stores the JWT in local storage, attaches it to Axios requests, and guards routes by role. The Express backend verifies the token, applies role-based middleware, validates request payloads, and uses PostgreSQL transactions for inventory-sensitive challan operations.

The backend keeps business data normalized across customers, products, stock movements, challans, and challan items. Challan line items intentionally store product snapshot fields so historical sales remain accurate even if the product catalog changes later.

## Environment Setup

Backend `.env`:

```env
PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=mini_erp_crm
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1d
CORS_ORIGIN=http://localhost:5173
```

Frontend `.env`:

```env
VITE_API_URL=http://localhost:5000
```

Example files are included at `backend/.env.example` and `frontend/.env.example`.

## Installation

1. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

2. Install frontend dependencies:

   ```bash
   cd ../frontend
   npm install
   ```

3. Create a PostgreSQL database:

   ```sql
   CREATE DATABASE mini_erp_crm;
   ```

4. Add backend and frontend environment files from the examples.

5. Seed demo login users:

   ```bash
   cd backend
   npm run seed
   ```

6. Start the backend:

   ```bash
   npm run dev
   ```

7. Start the frontend:

   ```bash
   cd ../frontend
   npm run dev
   ```

8. Open the app:

   ```text
   http://localhost:5173
   ```

## Demo Credentials

All demo accounts use password `Password@123`.

| Role | Email |
| --- | --- |
| Admin | admin@minierp.test |
| Sales | sales@minierp.test |
| Warehouse | warehouse@minierp.test |
| Accounts | accounts@minierp.test |

## Role Permissions

| Module | Admin | Sales | Warehouse | Accounts |
| --- | --- | --- | --- | --- |
| Dashboard | Yes | Yes | Yes | Yes |
| Customers | Full access | Create/Edit/View/Follow-ups | No access | View |
| Products | Full access | View | Create/Edit/Stock/View | View |
| Challans | Full access | Create/Confirm/Cancel/View | View | View |
| Reports | Yes | No | No | Yes |

## API Overview

An importable Postman collection is included at `docs/Mini-ERP-CRM.postman_collection.json`.

All protected endpoints require:

```http
Authorization: Bearer <jwt_token>
```

Authentication:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/register` Admin only

Customers:

- `GET /api/customers?search=&status=&page=&limit=`
- `POST /api/customers`
- `GET /api/customers/:id`
- `PUT /api/customers/:id`
- `DELETE /api/customers/:id`
- `POST /api/customers/:id/follow-ups`

Products and inventory:

- `GET /api/products?search=&lowStock=&page=&limit=`
- `POST /api/products`
- `GET /api/products/:id`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/products/:id/stock`
- `GET /api/products/:id/movements`

Sales challans:

- `GET /api/orders?search=&status=&page=&limit=`
- `POST /api/orders`
- `GET /api/orders/:id`
- `PUT /api/orders/:id/status`
- `DELETE /api/orders/:id`

Dashboard and reports:

- `GET /api/dashboard`
- `GET /api/dashboard/sales`

## Database Notes

The backend verifies and upgrades the PostgreSQL schema when the server starts. Core tables:

- `users`
- `customers`
- `customer_followups`
- `products`
- `stock_movements`
- `challans`
- `challan_items`

Important constraints and indexes are created for login email, product SKU, search/filter fields, challan numbers, stock movement lookups, and customer follow-up history.

## Business Logic

- Confirmed challans reduce product stock inside a database transaction.
- Stock cannot go negative; insufficient stock returns an HTTP `409` error.
- Cancelling a confirmed challan restores stock and records an `IN` movement.
- Challan items store product name, SKU, and unit price snapshots.
- Low-stock products are detected when `current_stock <= minimum_stock_alert_quantity`.

## Deployment Notes

Recommended free deployment path:

- Frontend: Vercel, Netlify, or Render Static Site.
- Backend: Render, Railway, or Fly.io.
- Database: Neon, Supabase, or Render PostgreSQL.

Set production environment variables on each platform. Configure `CORS_ORIGIN` to the deployed frontend URL and `VITE_API_URL` to the deployed backend URL.

## Assumptions

- Purchase orders and invoices are business-context examples in the PDF; the required core implementation is focused on authentication, CRM, product inventory, sales challans, and dashboard/reporting.
- AWS deployment, Docker, GitHub Actions, invoice PDF export, and S3 uploads are bonus items, so they are documented as future enhancements rather than required local functionality.
- If not deployed, this submission provides a working local setup, API documentation, and a Postman collection. A screen recording can be captured manually after running the app locally.

## Screenshots

Add screenshots here after running the application locally:

- Login page
- Dashboard
- Customer detail with follow-ups
- Product detail with stock history
- Create challan
- Challan detail/status tracking

## Verification

Completed locally:

- Backend TypeScript build.
- Frontend TypeScript and Vite production build.
- Seeded all role users.
- Tested admin login, customer creation, product creation, confirmed challan creation, automatic stock reduction, and dashboard totals through live APIs.

Known limitation: the in-app browser automation tool could not initialize in this Windows sandbox because of a local `EPERM` permission error on `AppData`; UI verification was covered with TypeScript/Vite build and live server availability checks.
