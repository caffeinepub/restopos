import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { OrderStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "rgba(245,158,11,0.15)", text: "#F59E0B" },
  preparing: { bg: "rgba(59,130,246,0.15)", text: "#3B82F6" },
  ready: { bg: "rgba(16,185,129,0.15)", text: "#10B981" },
  completed: { bg: "rgba(107,114,128,0.15)", text: "#6B7280" },
  cancelled: { bg: "rgba(239,68,68,0.15)", text: "#EF4444" },
};

const STATUS_LIST = ["all", ...Object.values(OrderStatus)];

export default function Orders() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<any>(null);

  const {
    data: orders = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: () => actor!.getAllOrders(),
    refetchInterval: 15000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: bigint; status: OrderStatus }) =>
      actor!.updateOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      setSelected(null);
    },
  });

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const sorted = [...filtered].sort(
    (a, b) => Number(b.createdAt) - Number(a.createdAt),
  );

  return (
    <div className="flex flex-col h-screen" style={{ color: "#E5E7EB" }}>
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "#263244", background: "rgba(11,18,32,0.6)" }}
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            {orders.length} total orders
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{
            background: "rgba(17,24,39,0.8)",
            border: "1px solid #263244",
            color: "#9CA3AF",
          }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div
        className="px-6 py-3 flex gap-2 border-b"
        style={{ borderColor: "#263244", background: "rgba(11,18,32,0.4)" }}
      >
        {STATUS_LIST.map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setFilter(s)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
            style={{
              background: filter === s ? "#3B82F6" : "rgba(17,24,39,0.8)",
              color: filter === s ? "#fff" : "#9CA3AF",
              border: "1px solid #263244",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && <p style={{ color: "#6B7280" }}>Loading orders...</p>}
        {sorted.length === 0 && !isLoading && (
          <p className="text-center py-16" style={{ color: "#6B7280" }}>
            No orders found
          </p>
        )}
        <div className="space-y-3">
          {sorted.map((order) => {
            const sc = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending;
            return (
              <button
                type="button"
                key={String(order.id)}
                onClick={() => setSelected(order)}
                className="w-full p-4 rounded-xl cursor-pointer transition-all hover:border-blue-500 text-left"
                style={{
                  background: "rgba(17,24,39,0.80)",
                  border: "1px solid #263244",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">
                      #{String(order.id)}
                    </span>
                    <span className="text-sm" style={{ color: "#9CA3AF" }}>
                      {order.orderType === "dineIn"
                        ? "Dine-in"
                        : order.orderType === "takeaway"
                          ? "Takeaway"
                          : "Delivery"}
                    </span>
                    {order.tableId > BigInt(0) && (
                      <span className="text-sm" style={{ color: "#9CA3AF" }}>
                        Table {String(order.tableId)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm" style={{ color: "#9CA3AF" }}>
                      {order.items.length} items
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "#10B981" }}
                    >
                      ${(Number(order.total) / 100).toFixed(2)}
                    </span>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: sc.bg, color: sc.text }}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-md p-6 rounded-2xl"
            style={{ background: "#111827", border: "1px solid #263244" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                Order #{String(selected.id)}
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                style={{ color: "#6B7280" }}
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 mb-4">
              {selected.items.map((item: any, i: number) => (
                <div
                  key={`${String(selected.id)}-item-${String(item.menuItemId)}-${i}`}
                  className="flex justify-between text-sm"
                >
                  <span style={{ color: "#E5E7EB" }}>
                    {String(item.quantity)}x {item.name}
                  </span>
                  <span style={{ color: "#9CA3AF" }}>
                    $
                    {(
                      (Number(item.unitPrice) * Number(item.quantity)) /
                      100
                    ).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t pt-2" style={{ borderColor: "#263244" }}>
                <div className="flex justify-between font-bold">
                  <span className="text-white">Total</span>
                  <span style={{ color: "#10B981" }}>
                    ${(Number(selected.total) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            <p className="text-sm mb-3" style={{ color: "#9CA3AF" }}>
              Update Status:
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.values(OrderStatus).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() =>
                    updateStatus.mutate({ id: selected.id, status: s })
                  }
                  disabled={selected.status === s}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize disabled:opacity-40"
                  style={{
                    background: STATUS_COLORS[s]?.bg,
                    color: STATUS_COLORS[s]?.text,
                    border: `1px solid ${STATUS_COLORS[s]?.text}`,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
