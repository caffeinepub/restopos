import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, RefreshCw } from "lucide-react";
import { OrderStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";

function timeAgo(ns: bigint) {
  const ms = Number(ns) / 1_000_000;
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export default function Kitchen() {
  const { actor } = useActor();
  const qc = useQueryClient();

  const { data: orders = [], refetch } = useQuery({
    queryKey: ["kitchen-orders"],
    queryFn: async () => {
      const [pending, preparing] = await Promise.all([
        actor!.getOrdersByStatus(OrderStatus.pending),
        actor!.getOrdersByStatus(OrderStatus.preparing),
      ]);
      return [...pending, ...preparing];
    },
    refetchInterval: 10000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: bigint; status: OrderStatus }) =>
      actor!.updateOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["kitchen-orders"] }),
  });

  const pending = orders.filter((o) => o.status === OrderStatus.pending);
  const preparing = orders.filter((o) => o.status === OrderStatus.preparing);

  return (
    <div className="flex flex-col h-screen" style={{ color: "#E5E7EB" }}>
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "#263244", background: "rgba(11,18,32,0.6)" }}
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Kitchen Display</h1>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            Auto-refreshes every 10s &bull; {orders.length} active orders
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

      <div className="flex-1 overflow-y-auto p-6">
        {orders.length === 0 && (
          <div className="text-center py-20" style={{ color: "#6B7280" }}>
            <p className="text-xl">No active orders</p>
            <p className="text-sm mt-2">
              New orders will appear here automatically
            </p>
          </div>
        )}

        {pending.length > 0 && (
          <div className="mb-6">
            <h2
              className="text-lg font-semibold mb-3"
              style={{ color: "#F59E0B" }}
            >
              Pending ({pending.length})
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {pending.map((order) => (
                <div
                  key={String(order.id)}
                  className="p-4 rounded-xl"
                  style={{
                    background: "rgba(17,24,39,0.8)",
                    border: "2px solid #F59E0B",
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-white text-lg">
                      #{String(order.id)}
                    </span>
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "#9CA3AF" }}
                    >
                      <Clock size={12} /> {timeAgo(order.createdAt)}
                    </span>
                  </div>
                  <div className="mb-1 text-sm" style={{ color: "#9CA3AF" }}>
                    {order.orderType === "dineIn"
                      ? `Dine-in${order.tableId > BigInt(0) ? ` · Table ${String(order.tableId)}` : ""}`
                      : order.orderType}
                  </div>
                  <ul className="space-y-1 mb-4">
                    {order.items.map((item) => (
                      <li
                        key={`${String(order.id)}-${String(item.menuItemId)}`}
                        className="text-sm text-white"
                      >
                        <span style={{ color: "#F59E0B" }}>
                          {String(item.quantity)}x
                        </span>{" "}
                        {item.name}
                        {item.notes && (
                          <span
                            className="text-xs ml-1"
                            style={{ color: "#6B7280" }}
                          >
                            ({item.notes})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() =>
                      updateStatus.mutate({
                        id: order.id,
                        status: OrderStatus.preparing,
                      })
                    }
                    className="w-full py-2 rounded-lg text-sm font-semibold"
                    style={{
                      background: "rgba(59,130,246,0.2)",
                      border: "1px solid #3B82F6",
                      color: "#3B82F6",
                    }}
                  >
                    Start Preparing
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {preparing.length > 0 && (
          <div>
            <h2
              className="text-lg font-semibold mb-3"
              style={{ color: "#3B82F6" }}
            >
              Preparing ({preparing.length})
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {preparing.map((order) => (
                <div
                  key={String(order.id)}
                  className="p-4 rounded-xl"
                  style={{
                    background: "rgba(17,24,39,0.8)",
                    border: "2px solid #3B82F6",
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-bold text-white text-lg">
                      #{String(order.id)}
                    </span>
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "#9CA3AF" }}
                    >
                      <Clock size={12} /> {timeAgo(order.createdAt)}
                    </span>
                  </div>
                  <div className="mb-1 text-sm" style={{ color: "#9CA3AF" }}>
                    {order.orderType === "dineIn"
                      ? `Dine-in${order.tableId > BigInt(0) ? ` · Table ${String(order.tableId)}` : ""}`
                      : order.orderType}
                  </div>
                  <ul className="space-y-1 mb-4">
                    {order.items.map((item) => (
                      <li
                        key={`${String(order.id)}-${String(item.menuItemId)}`}
                        className="text-sm text-white"
                      >
                        <span style={{ color: "#3B82F6" }}>
                          {String(item.quantity)}x
                        </span>{" "}
                        {item.name}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() =>
                      updateStatus.mutate({
                        id: order.id,
                        status: OrderStatus.ready,
                      })
                    }
                    className="w-full py-2 rounded-lg text-sm font-semibold"
                    style={{
                      background: "rgba(16,185,129,0.2)",
                      border: "1px solid #10B981",
                      color: "#10B981",
                    }}
                  >
                    Mark Ready
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
