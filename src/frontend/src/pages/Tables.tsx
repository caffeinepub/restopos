import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { TableStatus } from "../backend.d";
import { useActor } from "../hooks/useActor";

const STATUS_STYLE: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  available: { bg: "rgba(16,185,129,0.1)", border: "#10B981", text: "#10B981" },
  occupied: { bg: "rgba(239,68,68,0.1)", border: "#EF4444", text: "#EF4444" },
  reserved: { bg: "rgba(245,158,11,0.1)", border: "#F59E0B", text: "#F59E0B" },
};

export default function Tables() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ name: "", capacity: "4" });

  const { data: tables = [] } = useQuery({
    queryKey: ["tables"],
    queryFn: () => actor!.getAllTables(),
  });

  const createTable = useMutation({
    mutationFn: () =>
      actor!.createTable(form.name, BigInt(Number.parseInt(form.capacity))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      setModal(false);
      setForm({ name: "", capacity: "4" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: ({ t, status }: { t: any; status: TableStatus }) =>
      actor!.updateTable(t.id, t.name, t.capacity, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      setSelected(null);
    },
  });

  const deleteTable = useMutation({
    mutationFn: (id: bigint) => actor!.deleteTable(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      setSelected(null);
    },
  });

  const inputStyle = {
    background: "rgba(17,24,39,0.9)",
    border: "1px solid #263244",
    color: "#E5E7EB",
    borderRadius: 8,
    padding: "8px 12px",
    width: "100%",
  };

  return (
    <div className="flex flex-col h-screen" style={{ color: "#E5E7EB" }}>
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "#263244", background: "rgba(11,18,32,0.6)" }}
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Tables</h1>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            {tables.length} tables
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "#3B82F6" }}
        >
          <Plus size={16} /> Add Table
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-4 mb-6">
          {Object.entries(STATUS_STYLE).map(([s, style]) => (
            <div key={s} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: style.text }}
              />
              <span style={{ color: "#9CA3AF" }} className="capitalize">
                {s}
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-4">
          {tables.map((table) => {
            const s = STATUS_STYLE[table.status] ?? STATUS_STYLE.available;
            return (
              <button
                type="button"
                key={String(table.id)}
                onClick={() => setSelected(table)}
                className="p-5 rounded-xl cursor-pointer transition-all hover:scale-105 text-left"
                style={{ background: s.bg, border: `2px solid ${s.border}` }}
              >
                <h3 className="text-lg font-bold text-white">{table.name}</h3>
                <p className="text-sm mt-1" style={{ color: "#9CA3AF" }}>
                  Capacity: {String(table.capacity)}
                </p>
                <span
                  className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-semibold capitalize"
                  style={{ background: s.bg, color: s.text }}
                >
                  {table.status}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {modal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm p-6 rounded-2xl"
            style={{ background: "#111827", border: "1px solid #263244" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Add Table</h2>
              <button type="button" onClick={() => setModal(false)}>
                <X size={20} style={{ color: "#6B7280" }} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Table Name (e.g. Table 5)"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                style={inputStyle}
              />
              <input
                placeholder="Capacity"
                type="number"
                value={form.capacity}
                onChange={(e) =>
                  setForm((p) => ({ ...p, capacity: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <button
              type="button"
              onClick={() => createTable.mutate()}
              disabled={!form.name}
              className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "#3B82F6" }}
            >
              {createTable.isPending ? "Adding..." : "Add Table"}
            </button>
          </div>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <div
            className="w-full max-w-sm p-6 rounded-2xl"
            style={{ background: "#111827", border: "1px solid #263244" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{selected.name}</h2>
              <button type="button" onClick={() => setSelected(null)}>
                <X size={20} style={{ color: "#6B7280" }} />
              </button>
            </div>
            <p className="text-sm mb-3" style={{ color: "#9CA3AF" }}>
              Capacity: {String(selected.capacity)}
            </p>
            <p className="text-sm mb-3" style={{ color: "#9CA3AF" }}>
              Change Status:
            </p>
            <div className="flex gap-2 mb-4">
              {Object.values(TableStatus).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() =>
                    updateStatus.mutate({ t: selected, status: s })
                  }
                  disabled={selected.status === s}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize disabled:opacity-40"
                  style={{
                    background: STATUS_STYLE[s]?.bg,
                    border: `1px solid ${STATUS_STYLE[s]?.border}`,
                    color: STATUS_STYLE[s]?.text,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => deleteTable.mutate(selected.id)}
              className="w-full py-2 rounded-lg text-sm"
              style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}
            >
              Delete Table
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
