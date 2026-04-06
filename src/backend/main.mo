import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Stripe configuration state (for main actor only)
  var stripeConfiguration : ?Stripe.StripeConfiguration = null;

  // User Profile Management
  public type UserProfile = {
    name : Text;
  };

  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Stripe Integration Functions
  public query func isStripeConfigured() : async Bool {
    stripeConfiguration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfiguration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfiguration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?config) { config };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Type definitions
  type TableStatus = { #available; #occupied; #reserved };
  type OrderType = { #dineIn; #takeaway; #delivery };
  type OrderStatus = { #pending; #preparing; #ready; #completed; #cancelled };

  type Category = {
    id : Nat;
    name : Text;
    description : Text;
  };

  type MenuItem = {
    id : Nat;
    categoryId : Nat;
    name : Text;
    description : Text;
    price : Nat;
    available : Bool;
  };

  type Table = {
    id : Nat;
    name : Text;
    capacity : Nat;
    status : TableStatus;
  };

  type Customer = {
    id : Nat;
    name : Text;
    phone : Text;
    email : Text;
    loyaltyPoints : Nat;
    createdAt : Time.Time;
  };

  type OrderItem = {
    menuItemId : Nat;
    name : Text;
    quantity : Nat;
    unitPrice : Nat;
    notes : Text;
  };

  type Order = {
    id : Nat;
    tableId : Nat;
    customerId : ?Nat;
    orderType : OrderType;
    status : OrderStatus;
    items : [OrderItem];
    subtotal : Nat;
    tax : Nat;
    discount : Nat;
    total : Nat;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  // Storage
  let categories = Map.empty<Nat, Category>();
  let menuItems = Map.empty<Nat, MenuItem>();
  let tables = Map.empty<Nat, Table>();
  let customers = Map.empty<Nat, Customer>();
  let orders = Map.empty<Nat, Order>();

  var nextCategoryId = 1;
  var nextMenuItemId = 1;
  var nextTableId = 1;
  var nextCustomerId = 1;
  var nextOrderId = 1;

  // Category CRUD - Admin only
  public shared ({ caller }) func createCategory(name : Text, description : Text) : async Category {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create categories");
    };
    let id = nextCategoryId;
    let category : Category = {
      id;
      name;
      description;
    };
    categories.add(id, category);
    nextCategoryId += 1;
    category;
  };

  public query ({ caller }) func getCategory(id : Nat) : async Category {
    // Anyone can view categories (including guests for menu browsing)
    switch (categories.get(id)) {
      case (null) { Runtime.trap("Category not found") };
      case (?category) { category };
    };
  };

  public shared ({ caller }) func updateCategory(id : Nat, name : Text, description : Text) : async Category {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update categories");
    };
    switch (categories.get(id)) {
      case (null) { Runtime.trap("Category not found") };
      case (?category) {
        let updated = { category with name; description };
        categories.add(id, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func deleteCategory(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete categories");
    };
    if (not categories.containsKey(id)) { Runtime.trap("Category not found") };
    categories.remove(id);
  };

  public query ({ caller }) func getAllCategories() : async [Category] {
    // Anyone can view categories (including guests for menu browsing)
    categories.values().toArray();
  };

  // MenuItem CRUD - Admin only
  public shared ({ caller }) func createMenuItem(categoryId : Nat, name : Text, description : Text, price : Nat) : async MenuItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create menu items");
    };
    if (not categories.containsKey(categoryId)) { Runtime.trap("Category not found") };
    let id = nextMenuItemId;
    let item : MenuItem = {
      id;
      categoryId;
      name;
      description;
      price;
      available = true;
    };
    menuItems.add(id, item);
    nextMenuItemId += 1;
    item;
  };

  public query ({ caller }) func getMenuItem(id : Nat) : async MenuItem {
    // Anyone can view menu items (including guests for menu browsing)
    switch (menuItems.get(id)) {
      case (null) { Runtime.trap("MenuItem not found") };
      case (?item) { item };
    };
  };

  public shared ({ caller }) func updateMenuItem(id : Nat, name : Text, description : Text, price : Nat, available : Bool) : async MenuItem {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update menu items");
    };
    switch (menuItems.get(id)) {
      case (null) { Runtime.trap("MenuItem not found") };
      case (?item) {
        let updated = { item with name; description; price; available };
        menuItems.add(id, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func deleteMenuItem(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete menu items");
    };
    if (not menuItems.containsKey(id)) { Runtime.trap("MenuItem not found") };
    menuItems.remove(id);
  };

  public query ({ caller }) func getMenuItemsByCategory(categoryId : Nat) : async [MenuItem] {
    // Anyone can view menu items (including guests for menu browsing)
    menuItems.values().toArray().filter(func(item) { item.categoryId == categoryId });
  };

  public query ({ caller }) func getAllMenuItems() : async [MenuItem] {
    // Anyone can view menu items (including guests for menu browsing)
    menuItems.values().toArray();
  };

  // Table CRUD - Admin only
  public shared ({ caller }) func createTable(name : Text, capacity : Nat) : async Table {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create tables");
    };
    let id = nextTableId;
    let table : Table = {
      id;
      name;
      capacity;
      status = #available;
    };
    tables.add(id, table);
    nextTableId += 1;
    table;
  };

  public query ({ caller }) func getTable(id : Nat) : async Table {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tables");
    };
    switch (tables.get(id)) {
      case (null) { Runtime.trap("Table not found") };
      case (?table) { table };
    };
  };

  public shared ({ caller }) func updateTable(id : Nat, name : Text, capacity : Nat, status : TableStatus) : async Table {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update tables");
    };
    switch (tables.get(id)) {
      case (null) { Runtime.trap("Table not found") };
      case (?table) {
        let updated = { table with name; capacity; status };
        tables.add(id, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func deleteTable(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete tables");
    };
    if (not tables.containsKey(id)) { Runtime.trap("Table not found") };
    tables.remove(id);
  };

  public query ({ caller }) func getAllTables() : async [Table] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view tables");
    };
    tables.values().toArray();
  };

  // Customer CRUD
  public shared ({ caller }) func createCustomer(name : Text, phone : Text, email : Text) : async Customer {
    // Anyone can create a customer (self-registration or staff creating customer records)
    let id = nextCustomerId;
    let customer : Customer = {
      id;
      name;
      phone;
      email;
      loyaltyPoints = 0;
      createdAt = Time.now();
    };
    customers.add(id, customer);
    nextCustomerId += 1;
    customer;
  };

  public query ({ caller }) func getCustomer(id : Nat) : async Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) { customer };
    };
  };

  public shared ({ caller }) func updateCustomer(id : Nat, name : Text, phone : Text, email : Text) : async Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update customers");
    };
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) {
        let updated = { customer with name; phone; email };
        customers.add(id, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func deleteCustomer(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete customers");
    };
    if (not customers.containsKey(id)) { Runtime.trap("Customer not found") };
    customers.remove(id);
  };

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    customers.values().toArray();
  };

  // Order CRUD
  public shared ({ caller }) func createOrder(tableId : Nat, customerId : ?Nat, orderType : OrderType, items : [OrderItem]) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create orders");
    };
    if (not tables.containsKey(tableId)) { Runtime.trap("Table not found") };
    switch (customerId) {
      case (null) {};
      case (?id) {
        if (not customers.containsKey(id)) { Runtime.trap("Customer not found") };
      };
    };

    let subtotal = items.foldLeft(0, func(acc, item) { acc + (item.unitPrice * item.quantity) });
    let tax = Nat.div(subtotal * 10, 100); // 10% tax
    let total = subtotal + tax;

    let id = nextOrderId;
    let now = Time.now();
    let order : Order = {
      id;
      tableId;
      customerId;
      orderType;
      status = #pending;
      items;
      subtotal;
      tax;
      discount = 0;
      total;
      createdAt = now;
      updatedAt = now;
    };
    orders.add(id, order);
    nextOrderId += 1;
    order;
  };

  public query ({ caller }) func getOrder(id : Nat) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) { order };
    };
  };

  public shared ({ caller }) func updateOrderStatus(id : Nat, status : OrderStatus) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update order status");
    };
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updated = { order with status; updatedAt = Time.now() };
        orders.add(id, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func updateOrderItems(id : Nat, items : [OrderItem]) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update order items");
    };
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let subtotal = items.foldLeft(0, func(acc, item) { acc + (item.unitPrice * item.quantity) });
        let tax = Nat.div(subtotal * 10, 100); // 10% tax
        let total = (subtotal + tax) - order.discount;

        let updated = {
          order with
          items;
          subtotal;
          tax;
          total;
          updatedAt = Time.now();
        };
        orders.add(id, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func applyOrderDiscount(id : Nat, discount : Nat) : async Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can apply discounts");
    };
    switch (orders.get(id)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let total = (order.subtotal + order.tax) - discount;
        let updated = { order with discount; total; updatedAt = Time.now() };
        orders.add(id, updated);
        updated;
      };
    };
  };

  public shared ({ caller }) func deleteOrder(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete orders");
    };
    if (not orders.containsKey(id)) { Runtime.trap("Order not found") };
    orders.remove(id);
  };

  public query ({ caller }) func getOrdersByStatus(status : OrderStatus) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can query orders");
    };
    orders.values().toArray().filter(func(order) { order.status == status });
  };

  public query ({ caller }) func getAllOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orders.values().toArray();
  };
};
