# RestoPOS - Restaurant POS System

## Current State
New project with empty Motoko backend and no frontend UI.

## Requested Changes (Diff)

### Add
- Full Restaurant POS system with role-based access (Admin, Manager, Cashier, Kitchen Staff)
- Menu management: categories and menu items with prices
- POS billing screen: create orders (Dine-in / Takeaway / Delivery), add items, set quantity, apply tax/discount, generate invoice
- Order management: list orders, update status
- Kitchen Display System (KDS): view pending/preparing/ready orders, update status
- Table management: manage tables, assign to orders
- Customer management: save customer info, view order history
- Basic analytics/reports: daily sales, top items
- User authentication with roles
- Subscription plans displayed (Basic, Standard, Premium) - UI only with Stripe for upgrades

### Modify
- Nothing (new project)

### Remove
- Nothing

## Implementation Plan
1. Backend (Motoko):
   - Users/auth via authorization component
   - Categories and MenuItems stable storage
   - Tables stable storage
   - Orders and OrderItems stable storage
   - Customers stable storage
   - CRUD APIs for all entities
   - Order workflow: create, update item quantities, apply discount/tax, mark status
   - Kitchen: query orders by status, update status
   - Stripe for subscription billing

2. Frontend (React + Tailwind):
   - Login screen
   - Sidebar layout with navigation
   - POS screen (category tabs, menu grid, order summary panel)
   - Orders list page
   - Kitchen Display (KDS) page
   - Menu management page
   - Tables page
   - Customers page
   - Reports/Analytics page
   - Settings/Subscription page
