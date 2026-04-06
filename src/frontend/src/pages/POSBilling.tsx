import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  type Category,
  type MenuItem,
  type OrderItem,
  OrderType,
  type Table,
  TableStatus,
} from "../backend.d";
import { useActor } from "../hooks/useActor";

type CartItem = {
  menuItemId: bigint;
  name: string;
  unitPrice: bigint;
  quantity: number;
  notes: string;
};

const SEED_CATEGORIES = [
  { name: "Starters", description: "Appetizers and starters" },
  { name: "Main Course", description: "Main dishes" },
  { name: "Pizza", description: "Wood-fired pizzas" },
  { name: "Drinks", description: "Beverages" },
  { name: "Desserts", description: "Sweet treats" },
];

const SEED_ITEMS: {
  catIndex: number;
  name: string;
  desc: string;
  price: number;
}[] = [
  {
    catIndex: 0,
    name: "Garlic Bread",
    desc: "Toasted garlic bread",
    price: 499,
  },
  {
    catIndex: 0,
    name: "Chicken Wings",
    desc: "Crispy wings with sauce",
    price: 899,
  },
  {
    catIndex: 0,
    name: "Soup of the Day",
    desc: "Chef's daily special soup",
    price: 649,
  },
  {
    catIndex: 1,
    name: "Grilled Chicken",
    desc: "Herb grilled chicken breast",
    price: 1499,
  },
  {
    catIndex: 1,
    name: "Beef Steak",
    desc: "Prime cut beef steak",
    price: 2499,
  },
  {
    catIndex: 1,
    name: "Pasta Carbonara",
    desc: "Creamy pasta with bacon",
    price: 1299,
  },
  {
    catIndex: 2,
    name: "Margherita Pizza",
    desc: "Classic tomato and mozzarella",
    price: 1199,
  },
  {
    catIndex: 2,
    name: "Pepperoni Pizza",
    desc: "Loaded with pepperoni",
    price: 1399,
  },
  {
    catIndex: 2,
    name: "BBQ Chicken Pizza",
    desc: "BBQ sauce and chicken",
    price: 1499,
  },
  { catIndex: 3, name: "Coca Cola", desc: "330ml can", price: 299 },
  {
    catIndex: 3,
    name: "Fresh Orange Juice",
    desc: "Freshly squeezed",
    price: 499,
  },
  {
    catIndex: 3,
    name: "Iced Coffee",
    desc: "Cold brew iced coffee",
    price: 549,
  },
  {
    catIndex: 4,
    name: "Chocolate Lava Cake",
    desc: "Warm chocolate cake",
    price: 749,
  },
  {
    catIndex: 4,
    name: "Ice Cream Sundae",
    desc: "Three scoops with toppings",
    price: 649,
  },
];

export default function POSBilling() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<bigint | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>(OrderType.dineIn);
  const [selectedTable, setSelectedTable] = useState<bigint | null>(null);
  const [discount, setDiscount] = useState(0);
  const [seeded, setSeeded] = useState(false);

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => actor!.getAllCategories(),
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ["menuItems"],
    queryFn: () => actor!.getAllMenuItems(),
  });

  const { data: tables = [] } = useQuery({
    queryKey: ["tables"],
    queryFn: () => actor!.getAllTables(),
  });

  // Seed data if empty
  useEffect(() => {
    if (seeded || catsLoading) return;
    if (categories.length === 0) {
      seedData();
    }
  }, [categories, catsLoading, seeded]);

  async function seedData() {
    setSeeded(true);
    try {
      const cats: Category[] = [];
      for (const c of SEED_CATEGORIES) {
        const cat = await actor!.createCategory(c.name, c.description);
        cats.push(cat);
      }
      for (const item of SEED_ITEMS) {
        const cat = cats[item.catIndex];
        if (cat) {
          await actor!.createMenuItem(
            cat.id,
            item.name,
            item.desc,
            BigInt(item.price),
          );
        }
      }
      const tablesData = await actor!.getAllTables();
      if (tablesData.length === 0) {
        for (let i = 1; i <= 8; i++) {
          await actor!.createTable(`Table ${i}`, BigInt(4));
        }
      }
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["menuItems"] });
      qc.invalidateQueries({ queryKey: ["tables"] });
    } catch (e) {
      console.error("Seed error", e);
    }
  }

  const filteredItems = selectedCategory
    ? allItems.filter((i) => i.categoryId === selectedCategory && i.available)
    : allItems.filter((i) => i.available);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity: 1,
          notes: "",
        },
      ];
    });
  };

  const updateQty = (id: bigint, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.menuItemId === id ? { ...c, quantity: c.quantity + delta } : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const removeFromCart = (id: bigint) => {
    setCart((prev) => prev.filter((c) => c.menuItemId !== id));
  };

  const subtotal = cart.reduce(
    (sum, c) => sum + Number(c.unitPrice) * c.quantity,
    0,
  );
  const tax = Math.round(subtotal * 0.1);
  const discountAmt = Math.round(subtotal * (discount / 100));
  const total = subtotal + tax - discountAmt;

  const createOrderMutation = useMutation({
    mutationFn: async (status: "kitchen" | "pay") => {
      const tableId = selectedTable ?? BigInt(0);
      const items: OrderItem[] = cart.map((c) => ({
        menuItemId: c.menuItemId,
        name: c.name,
        quantity: BigInt(c.quantity),
        unitPrice: c.unitPrice,
        notes: c.notes,
      }));
      const order = await actor!.createOrder(tableId, null, orderType, items);
      if (status === "pay") {
        await actor!.updateOrderStatus(order.id, "completed" as any);
      }
      if (discountAmt > 0) {
        await actor!.applyOrderDiscount(order.id, BigInt(discountAmt));
      }
      return order;
    },
    onSuccess: () => {
      setCart([]);
      setDiscount(0);
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const availableTables = tables.filter(
    (t) =>
      t.status === TableStatus.available || t.status === TableStatus.occupied,
  );

  return (
    <div className="flex flex-col h-screen" style={{ color: "#E5E7EB" }}>
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "#263244", background: "rgba(11,18,32,0.6)" }}
      >
        <div>
          <h1 className="text-2xl font-bold text-white">POS Billing</h1>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            Create new order
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ShoppingCart size={20} style={{ color: "#9CA3AF" }} />
          <span className="text-sm" style={{ color: "#9CA3AF" }}>
            {cart.length} items in cart
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Categories + Items */}
        <div className="flex flex-1 overflow-hidden">
          {/* Categories */}
          <div
            className="w-44 flex flex-col border-r overflow-y-auto"
            style={{ borderColor: "#263244", background: "rgba(11,18,32,0.4)" }}
          >
            <div
              className="px-3 py-3 border-b"
              style={{ borderColor: "#263244" }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#6B7280" }}
              >
                Categories
              </p>
            </div>
            <div className="p-2 space-y-1">
              <button
                type="button"
                onClick={() => setSelectedCategory(null)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background:
                    selectedCategory === null ? "#3B82F6" : "transparent",
                  color: selectedCategory === null ? "#fff" : "#9CA3AF",
                }}
              >
                All Items
              </button>
              {categories.map((cat) => (
                <button
                  type="button"
                  key={String(cat.id)}
                  onClick={() => setSelectedCategory(cat.id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    background:
                      selectedCategory === cat.id ? "#3B82F6" : "transparent",
                    color: selectedCategory === cat.id ? "#fff" : "#9CA3AF",
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Menu items grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={String(item.id)}
                  className="rounded-xl p-4 flex flex-col gap-2 transition-all hover:border-blue-500"
                  style={{
                    background: "rgba(17,24,39,0.80)",
                    border: "1px solid #263244",
                  }}
                >
                  <div className="text-2xl text-center py-2">
                    {item.categoryId ===
                    categories.find((c) => c.name === "Drinks")?.id
                      ? "🍹"
                      : item.categoryId ===
                          categories.find((c) => c.name === "Pizza")?.id
                        ? "🍕"
                        : item.categoryId ===
                            categories.find((c) => c.name === "Desserts")?.id
                          ? "🍰"
                          : item.categoryId ===
                              categories.find((c) => c.name === "Starters")?.id
                            ? "🥗"
                            : "🍽️"}
                  </div>
                  <h3 className="text-sm font-semibold text-white leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold" style={{ color: "#10B981" }}>
                      ${(Number(item.price) / 100).toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: "#3B82F6", color: "#fff" }}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {filteredItems.length === 0 && (
                <div
                  className="col-span-3 text-center py-16"
                  style={{ color: "#6B7280" }}
                >
                  <p>No items available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Order Panel */}
        <div
          className="w-80 flex flex-col border-l"
          style={{ borderColor: "#263244", background: "rgba(11,18,32,0.6)" }}
        >
          {/* Order type */}
          <div className="p-4 border-b" style={{ borderColor: "#263244" }}>
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: "#6B7280" }}
            >
              Order Type
            </p>
            <div className="flex gap-2">
              {(
                [
                  OrderType.dineIn,
                  OrderType.takeaway,
                  OrderType.delivery,
                ] as OrderType[]
              ).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setOrderType(type)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background:
                      orderType === type ? "#3B82F6" : "rgba(17,24,39,0.8)",
                    color: orderType === type ? "#fff" : "#9CA3AF",
                    border: "1px solid #263244",
                  }}
                >
                  {type === OrderType.dineIn
                    ? "Dine-in"
                    : type === OrderType.takeaway
                      ? "Takeaway"
                      : "Delivery"}
                </button>
              ))}
            </div>
            {orderType === OrderType.dineIn && (
              <select
                value={selectedTable ? String(selectedTable) : ""}
                onChange={(e) =>
                  setSelectedTable(
                    e.target.value ? BigInt(e.target.value) : null,
                  )
                }
                className="w-full mt-2 px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "rgba(17,24,39,0.9)",
                  border: "1px solid #263244",
                  color: "#E5E7EB",
                }}
              >
                <option value="">Select Table</option>
                {availableTables.map((t) => (
                  <option key={String(t.id)} value={String(t.id)}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: "#6B7280" }}
            >
              Order Items
            </p>
            {cart.length === 0 && (
              <div className="text-center py-8" style={{ color: "#6B7280" }}>
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No items added</p>
              </div>
            )}
            {cart.map((item) => (
              <div
                key={String(item.menuItemId)}
                className="flex items-center gap-2 p-2 rounded-lg"
                style={{ background: "rgba(17,24,39,0.6)" }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {item.name}
                  </p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>
                    ${(Number(item.unitPrice) / 100).toFixed(2)} each
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => updateQty(item.menuItemId, -1)}
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ background: "#1F2937", color: "#9CA3AF" }}
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-6 text-center text-sm text-white">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQty(item.menuItemId, 1)}
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ background: "#1F2937", color: "#9CA3AF" }}
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.menuItemId)}
                    className="w-6 h-6 rounded flex items-center justify-center ml-1"
                    style={{
                      background: "rgba(239,68,68,0.15)",
                      color: "#EF4444",
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="p-4 border-t" style={{ borderColor: "#263244" }}>
            <div className="space-y-1.5 mb-3">
              <div className="flex justify-between text-sm">
                <span style={{ color: "#9CA3AF" }}>Subtotal</span>
                <span className="text-white">
                  ${(subtotal / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span style={{ color: "#9CA3AF" }}>Tax (10%)</span>
                <span className="text-white">${(tax / 100).toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span style={{ color: "#9CA3AF" }}>Discount %</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-16 px-2 py-0.5 rounded text-sm text-right"
                  style={{
                    background: "rgba(17,24,39,0.9)",
                    border: "1px solid #263244",
                    color: "#E5E7EB",
                  }}
                />
              </div>
              {discountAmt > 0 && (
                <div className="flex justify-between text-sm">
                  <span style={{ color: "#EF4444" }}>Discount</span>
                  <span style={{ color: "#EF4444" }}>
                    -${(discountAmt / 100).toFixed(2)}
                  </span>
                </div>
              )}
              <div
                className="flex justify-between font-bold text-base pt-1 border-t"
                style={{ borderColor: "#263244" }}
              >
                <span className="text-white">Total</span>
                <span style={{ color: "#10B981" }}>
                  ${(total / 100).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => createOrderMutation.mutate("kitchen")}
                disabled={cart.length === 0 || createOrderMutation.isPending}
                className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid #3B82F6",
                  color: "#3B82F6",
                }}
              >
                Send to Kitchen
              </button>
              <button
                type="button"
                onClick={() => createOrderMutation.mutate("pay")}
                disabled={cart.length === 0 || createOrderMutation.isPending}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                style={{
                  background: "linear-gradient(135deg, #10B981, #059669)",
                }}
              >
                {createOrderMutation.isPending ? "Processing..." : "Pay Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
