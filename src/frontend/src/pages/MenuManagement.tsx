import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useActor } from "../hooks/useActor";

type CatForm = { name: string; description: string };
type ItemForm = {
  name: string;
  description: string;
  price: string;
  categoryId: string;
};

export default function MenuManagement() {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<bigint | null>(null);
  const [catModal, setCatModal] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [catForm, setCatForm] = useState<CatForm>({
    name: "",
    description: "",
  });
  const [itemModal, setItemModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [itemForm, setItemForm] = useState<ItemForm>({
    name: "",
    description: "",
    price: "",
    categoryId: "",
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => actor!.getAllCategories(),
  });

  const { data: allItems = [] } = useQuery({
    queryKey: ["menuItems"],
    queryFn: () => actor!.getAllMenuItems(),
  });

  const activeCategoryId = activeTab ?? categories[0]?.id;
  const items = allItems.filter((i) => i.categoryId === activeCategoryId);

  const catMutation = useMutation({
    mutationFn: async (data: CatForm) => {
      if (editCat)
        return actor!.updateCategory(editCat.id, data.name, data.description);
      return actor!.createCategory(data.name, data.description);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setCatModal(false);
      setEditCat(null);
    },
  });

  const deleteCat = useMutation({
    mutationFn: (id: bigint) => actor!.deleteCategory(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });

  const itemMutation = useMutation({
    mutationFn: async (data: ItemForm) => {
      const price = BigInt(Math.round(Number.parseFloat(data.price) * 100));
      if (editItem)
        return actor!.updateMenuItem(
          editItem.id,
          data.name,
          data.description,
          price,
          true,
        );
      return actor!.createMenuItem(
        BigInt(data.categoryId),
        data.name,
        data.description,
        price,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["menuItems"] });
      setItemModal(false);
      setEditItem(null);
    },
  });

  const deleteItem = useMutation({
    mutationFn: (id: bigint) => actor!.deleteMenuItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menuItems"] }),
  });

  const toggleAvail = useMutation({
    mutationFn: ({ item }: { item: any }) =>
      actor!.updateMenuItem(
        item.id,
        item.name,
        item.description,
        item.price,
        !item.available,
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menuItems"] }),
  });

  const openAddItem = () => {
    setEditItem(null);
    setItemForm({
      name: "",
      description: "",
      price: "",
      categoryId: String(activeCategoryId ?? ""),
    });
    setItemModal(true);
  };

  const openEditItem = (item: any) => {
    setEditItem(item);
    setItemForm({
      name: item.name,
      description: item.description,
      price: (Number(item.price) / 100).toFixed(2),
      categoryId: String(item.categoryId),
    });
    setItemModal(true);
  };

  const openEditCat = (cat: any) => {
    setEditCat(cat);
    setCatForm({ name: cat.name, description: cat.description });
    setCatModal(true);
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
          <h1 className="text-2xl font-bold text-white">Menu Management</h1>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            {allItems.length} items across {categories.length} categories
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setEditCat(null);
              setCatForm({ name: "", description: "" });
              setCatModal(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
            style={{
              background: "rgba(17,24,39,0.8)",
              border: "1px solid #263244",
              color: "#9CA3AF",
            }}
          >
            <Plus size={16} /> Category
          </button>
          <button
            type="button"
            onClick={openAddItem}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ background: "#3B82F6" }}
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      <div
        className="px-6 py-3 flex gap-2 overflow-x-auto border-b"
        style={{ borderColor: "#263244", background: "rgba(11,18,32,0.4)" }}
      >
        {categories.map((cat) => (
          <div key={String(cat.id)} className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
              style={{
                background:
                  activeCategoryId === cat.id
                    ? "#3B82F6"
                    : "rgba(17,24,39,0.8)",
                color: activeCategoryId === cat.id ? "#fff" : "#9CA3AF",
                border: "1px solid #263244",
              }}
            >
              {cat.name}
            </button>
            <button
              type="button"
              onClick={() => openEditCat(cat)}
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ color: "#6B7280" }}
            >
              <Edit2 size={12} />
            </button>
            <button
              type="button"
              onClick={() => deleteCat.mutate(cat.id)}
              className="w-5 h-5 rounded flex items-center justify-center"
              style={{ color: "#EF4444" }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {items.length === 0 && (
          <p className="text-center py-16" style={{ color: "#6B7280" }}>
            No items in this category. Add one!
          </p>
        )}
        <div className="grid grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={String(item.id)}
              className="p-4 rounded-xl"
              style={{
                background: "rgba(17,24,39,0.8)",
                border: "1px solid #263244",
              }}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-white">{item.name}</h3>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEditItem(item)}
                    className="w-7 h-7 rounded flex items-center justify-center"
                    style={{
                      background: "rgba(59,130,246,0.15)",
                      color: "#3B82F6",
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteItem.mutate(item.id)}
                    className="w-7 h-7 rounded flex items-center justify-center"
                    style={{
                      background: "rgba(239,68,68,0.15)",
                      color: "#EF4444",
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm mb-3" style={{ color: "#9CA3AF" }}>
                {item.description || "No description"}
              </p>
              <div className="flex items-center justify-between">
                <span className="font-bold" style={{ color: "#10B981" }}>
                  ${(Number(item.price) / 100).toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => toggleAvail.mutate({ item })}
                  className="px-2 py-1 rounded text-xs font-semibold"
                  style={{
                    background: item.available
                      ? "rgba(16,185,129,0.15)"
                      : "rgba(239,68,68,0.15)",
                    color: item.available ? "#10B981" : "#EF4444",
                  }}
                >
                  {item.available ? "Available" : "Unavailable"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {catModal && (
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
                {editCat ? "Edit" : "Add"} Category
              </h2>
              <button type="button" onClick={() => setCatModal(false)}>
                <X size={20} style={{ color: "#6B7280" }} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Category Name"
                value={catForm.name}
                onChange={(e) =>
                  setCatForm((p) => ({ ...p, name: e.target.value }))
                }
                style={inputStyle}
              />
              <input
                placeholder="Description"
                value={catForm.description}
                onChange={(e) =>
                  setCatForm((p) => ({ ...p, description: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <button
              type="button"
              onClick={() => catMutation.mutate(catForm)}
              disabled={!catForm.name}
              className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "#3B82F6" }}
            >
              {catMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {itemModal && (
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
                {editItem ? "Edit" : "Add"} Menu Item
              </h2>
              <button type="button" onClick={() => setItemModal(false)}>
                <X size={20} style={{ color: "#6B7280" }} />
              </button>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="sr-only">Category</span>
                <select
                  value={itemForm.categoryId}
                  onChange={(e) =>
                    setItemForm((p) => ({ ...p, categoryId: e.target.value }))
                  }
                  style={inputStyle}
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={String(c.id)} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <input
                placeholder="Item Name"
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm((p) => ({ ...p, name: e.target.value }))
                }
                style={inputStyle}
              />
              <input
                placeholder="Description"
                value={itemForm.description}
                onChange={(e) =>
                  setItemForm((p) => ({ ...p, description: e.target.value }))
                }
                style={inputStyle}
              />
              <input
                placeholder="Price (e.g. 12.99)"
                type="number"
                step="0.01"
                value={itemForm.price}
                onChange={(e) =>
                  setItemForm((p) => ({ ...p, price: e.target.value }))
                }
                style={inputStyle}
              />
            </div>
            <button
              type="button"
              onClick={() => itemMutation.mutate(itemForm)}
              disabled={
                !itemForm.name || !itemForm.price || !itemForm.categoryId
              }
              className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
              style={{ background: "#3B82F6" }}
            >
              {itemMutation.isPending ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
