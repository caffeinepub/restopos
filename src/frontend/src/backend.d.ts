import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export type Time = bigint;
export interface OrderItem {
    name: string;
    notes: string;
    quantity: bigint;
    unitPrice: bigint;
    menuItemId: bigint;
}
export interface Order {
    id: bigint;
    tax: bigint;
    status: OrderStatus;
    total: bigint;
    createdAt: Time;
    tableId: bigint;
    orderType: OrderType;
    updatedAt: Time;
    discount: bigint;
    customerId?: bigint;
    items: Array<OrderItem>;
    subtotal: bigint;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface MenuItem {
    id: bigint;
    categoryId: bigint;
    name: string;
    description: string;
    available: boolean;
    price: bigint;
}
export interface ShoppingItem {
    productName: string;
    currency: string;
    quantity: bigint;
    priceInCents: bigint;
    productDescription: string;
}
export interface Customer {
    id: bigint;
    name: string;
    createdAt: Time;
    email: string;
    loyaltyPoints: bigint;
    phone: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Table {
    id: bigint;
    status: TableStatus;
    name: string;
    capacity: bigint;
}
export type StripeSessionStatus = {
    __kind__: "completed";
    completed: {
        userPrincipal?: string;
        response: string;
    };
} | {
    __kind__: "failed";
    failed: {
        error: string;
    };
};
export interface StripeConfiguration {
    allowedCountries: Array<string>;
    secretKey: string;
}
export interface UserProfile {
    name: string;
}
export interface Category {
    id: bigint;
    name: string;
    description: string;
}
export enum OrderStatus {
    preparing = "preparing",
    cancelled = "cancelled",
    pending = "pending",
    completed = "completed",
    ready = "ready"
}
export enum OrderType {
    delivery = "delivery",
    dineIn = "dineIn",
    takeaway = "takeaway"
}
export enum TableStatus {
    occupied = "occupied",
    reserved = "reserved",
    available = "available"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    applyOrderDiscount(id: bigint, discount: bigint): Promise<Order>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCategory(name: string, description: string): Promise<Category>;
    createCheckoutSession(items: Array<ShoppingItem>, successUrl: string, cancelUrl: string): Promise<string>;
    createCustomer(name: string, phone: string, email: string): Promise<Customer>;
    createMenuItem(categoryId: bigint, name: string, description: string, price: bigint): Promise<MenuItem>;
    createOrder(tableId: bigint, customerId: bigint | null, orderType: OrderType, items: Array<OrderItem>): Promise<Order>;
    createTable(name: string, capacity: bigint): Promise<Table>;
    deleteCategory(id: bigint): Promise<void>;
    deleteCustomer(id: bigint): Promise<void>;
    deleteMenuItem(id: bigint): Promise<void>;
    deleteOrder(id: bigint): Promise<void>;
    deleteTable(id: bigint): Promise<void>;
    getAllCategories(): Promise<Array<Category>>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllMenuItems(): Promise<Array<MenuItem>>;
    getAllOrders(): Promise<Array<Order>>;
    getAllTables(): Promise<Array<Table>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCategory(id: bigint): Promise<Category>;
    getCustomer(id: bigint): Promise<Customer>;
    getMenuItem(id: bigint): Promise<MenuItem>;
    getMenuItemsByCategory(categoryId: bigint): Promise<Array<MenuItem>>;
    getOrder(id: bigint): Promise<Order>;
    getOrdersByStatus(status: OrderStatus): Promise<Array<Order>>;
    getStripeSessionStatus(sessionId: string): Promise<StripeSessionStatus>;
    getTable(id: bigint): Promise<Table>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isStripeConfigured(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setStripeConfiguration(config: StripeConfiguration): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateCategory(id: bigint, name: string, description: string): Promise<Category>;
    updateCustomer(id: bigint, name: string, phone: string, email: string): Promise<Customer>;
    updateMenuItem(id: bigint, name: string, description: string, price: bigint, available: boolean): Promise<MenuItem>;
    updateOrderItems(id: bigint, items: Array<OrderItem>): Promise<Order>;
    updateOrderStatus(id: bigint, status: OrderStatus): Promise<Order>;
    updateTable(id: bigint, name: string, capacity: bigint, status: TableStatus): Promise<Table>;
}
