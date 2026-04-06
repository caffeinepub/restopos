import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Star, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";

type CustomerForm = { name: string; phone: string; email: string };

export default function Customers() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [form, setForm] = useState<CustomerForm>({
    name: "",
    phone: "",
    email: "",
  });

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => actor!.getAllCustomers(),
  });

  const saveMutation = useMutation({
    mutationFn: (data: CustomerForm) => {
      if (editCustomer)
        return actor!.updateCustomer(
          editCustomer.id,
          data.name,
          data.phone,
          data.email,
        );
      return actor!.createCustomer(data.name, data.phone, data.email);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setModal(false);
      setEditCustomer(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: bigint) => actor!.deleteCustomer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });

  const openEdit = (c: any) => {
    setEditCustomer(c);
    setForm({ name: c.name, phone: c.phone, email: c.email });
    setModal(true);
  };

  const openAdd = () => {
    setEditCustomer(null);
    setForm({ name: "", phone: "", email: "" });
    setModal(true);
  };

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
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            {customers.length} registered customers
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
          style={{ background: "#3B82F6" }}
        >
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && <p style={{ color: "#6B7280" }}>Loading...</p>}
        {customers.length === 0 && !isLoading && (
          <p className="text-center py-16" style={{ color: "#6B7280" }}>
            No customers yet
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          {customers.map((c) => (
            <div
              key={String(c.id)}
              className="p-4 rounded-xl"
              style={{
                background: "rgba(17,24,39,0.8)",
                border: "1px solid #263244",
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  <p className="text-sm mt-0.5" style={{ color: "#9CA3AF" }}>
                    {c.phone}
                  </p>
                  <p className="text-sm" style={{ color: "#6B7280" }}>
                    {c.email || "No email"}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(c)}
                    className="w-8 h-8 rounded flex items-center justify-center"
                    style={{
                      background: "rgba(59,130,246,0.15)",
                      color: "#3B82F6",
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(c.id)}
                    className="w-8 h-8 rounded flex items-center justify-center"
                    style={{
                      background: "rgba(239,68,68,0.15)",
                      color: "#EF4444",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Star size={14} style={{ color: "#F59E0B" }} />
                <span className="text-sm" style={{ color: "#F59E0B" }}>
                  {String(c.loyaltyPoints)} loyalty points
                </span>
              </div>
              <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
                Member since{" "}
                {new Date(Number(c.createdAt) / 1_000_000).toLocaleDateString()}
              </p>
            </div>
          ))}
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
              <h2 className="text-lg font-bold text-white">
                {editCustomer ? "Edit" : "Add"} Customer
              </h2>
              <button type="button" onClick={() => setModal(false)}>
                <X size={20} style={{ color: "#6B7280" }} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Full Name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                style={inputStyle}
              />
              <input
                placeholder="Phone"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                style={inputStyle}
              />
              <input
                placeholder="Email (optional)"
                value={form.email}
                onChange={(e) =>
                  setForm((p) => ({ ...p, email: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <button
              type="button"
              onClick={() => saveMutation.mutate(form)}
              disabled={!form.name || !form.phone}
              className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "#3B82F6" }}
            >
              {saveMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
