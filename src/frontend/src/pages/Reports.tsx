import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, DollarSign, ShoppingBag } from "lucide-react";
import { OrderStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";

export default function Reports() {
  const { actor } = useActor();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: () => actor!.getAllOrders(),
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayMs = todayStart.getTime();

  const todayOrders = orders.filter(
    (o) => Number(o.createdAt) / 1_000_000 >= todayMs,
  );
  const revenueToday = todayOrders
    .filter((o) => o.status === OrderStatus.completed)
    .reduce((sum, o) => sum + Number(o.total), 0);
  const totalRevenue = orders
    .filter((o) => o.status === OrderStatus.completed)
    .reduce((sum, o) => sum + Number(o.total), 0);
  const activeOrders = orders.filter(
    (o) =>
      o.status === OrderStatus.pending || o.status === OrderStatus.preparing,
  ).length;
  const completedOrders = orders.filter(
    (o) => o.status === OrderStatus.completed,
  ).length;

  const statusCounts: Record<string, number> = {};
  for (const s of Object.values(OrderStatus)) {
    statusCounts[s] = orders.filter((o) => o.status === s).length;
  }

  const recent = [...orders]
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 8);

  const statusColors: Record<string, string> = {
    pending: "#F59E0B",
    preparing: "#3B82F6",
    ready: "#10B981",
    completed: "#6B7280",
    cancelled: "#EF4444",
  };

  const card = (
    icon: any,
    label: string,
    value: string,
    sub?: string,
    color = "#3B82F6",
  ) => (
    <div
      className="p-5 rounded-xl"
      style={{ background: "rgba(17,24,39,0.8)", border: "1px solid #263244" }}
    >
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${color}22` }}
        >
          {icon}
        </div>
        <span className="text-sm" style={{ color: "#9CA3AF" }}>
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && (
        <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
          {sub}
        </p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-screen" style={{ color: "#E5E7EB" }}>
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: "#263244", background: "rgba(11,18,32,0.6)" }}
      >
        <h1 className="text-2xl font-bold text-white">Reports</h1>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          Business overview
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading && <p style={{ color: "#6B7280" }}>Loading...</p>}

        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          {card(
            <DollarSign size={20} style={{ color: "#10B981" }} />,
            "Today's Revenue",
            `$${(revenueToday / 100).toFixed(2)}`,
            `${todayOrders.length} orders today`,
            "#10B981",
          )}
          {card(
            <DollarSign size={20} style={{ color: "#3B82F6" }} />,
            "Total Revenue",
            `$${(totalRevenue / 100).toFixed(2)}`,
            `${completedOrders} completed orders`,
            "#3B82F6",
          )}
          {card(
            <ShoppingBag size={20} style={{ color: "#F59E0B" }} />,
            "Total Orders",
            String(orders.length),
            "All time",
            "#F59E0B",
          )}
          {card(
            <Clock size={20} style={{ color: "#EF4444" }} />,
            "Active Orders",
            String(activeOrders),
            "Pending + Preparing",
            "#EF4444",
          )}
        </div>

        {/* Status Breakdown */}
        <div
          className="p-5 rounded-xl"
          style={{
            background: "rgba(17,24,39,0.8)",
            border: "1px solid #263244",
          }}
        >
          <h2 className="text-lg font-semibold mb-4 text-white">
            Orders by Status
          </h2>
          <div className="flex gap-4">
            {Object.entries(statusCounts).map(([s, count]) => (
              <div
                key={s}
                className="flex-1 text-center p-3 rounded-xl"
                style={{
                  background: `${statusColors[s]}15`,
                  border: `1px solid ${statusColors[s]}`,
                }}
              >
                <p
                  className="text-2xl font-bold"
                  style={{ color: statusColors[s] }}
                >
                  {count}
                </p>
                <p
                  className="text-xs capitalize mt-1"
                  style={{ color: "#9CA3AF" }}
                >
                  {s}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div
          className="p-5 rounded-xl"
          style={{
            background: "rgba(17,24,39,0.8)",
            border: "1px solid #263244",
          }}
        >
          <h2 className="text-lg font-semibold mb-4 text-white">
            Recent Orders
          </h2>
          {recent.length === 0 && (
            <p style={{ color: "#6B7280" }}>No orders yet</p>
          )}
          <div className="space-y-2">
            {recent.map((o) => (
              <div
                key={String(o.id)}
                className="flex items-center justify-between py-2 border-b"
                style={{ borderColor: "#263244" }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-white">
                    #{String(o.id)}
                  </span>
                  <span
                    className="text-sm capitalize"
                    style={{ color: "#9CA3AF" }}
                  >
                    {o.orderType === "dineIn" ? "Dine-in" : o.orderType}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full capitalize"
                    style={{
                      background: `${statusColors[o.status]}20`,
                      color: statusColors[o.status],
                    }}
                  >
                    {o.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm" style={{ color: "#9CA3AF" }}>
                    {o.items.length} items
                  </span>
                  <span className="font-semibold" style={{ color: "#10B981" }}>
                    ${(Number(o.total) / 100).toFixed(2)}
                  </span>
                  <span className="text-xs" style={{ color: "#6B7280" }}>
                    {new Date(
                      Number(o.createdAt) / 1_000_000,
                    ).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
