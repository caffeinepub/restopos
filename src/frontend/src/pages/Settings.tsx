import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, LogOut, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const PLANS = [
  {
    name: "Basic",
    price: "$29",
    period: "/ month",
    features: [
      "Up to 2 staff",
      "Basic POS",
      "Order management",
      "Menu management",
    ],
    color: "#6B7280",
  },
  {
    name: "Standard",
    price: "$59",
    period: "/ month",
    features: [
      "Up to 10 staff",
      "Full POS",
      "Kitchen Display",
      "Reports",
      "Customer CRM",
    ],
    color: "#3B82F6",
    popular: true,
  },
  {
    name: "Premium",
    price: "$99",
    period: "/ month",
    features: [
      "Unlimited staff",
      "Everything in Standard",
      "Multi-branch",
      "Priority support",
      "Advanced analytics",
    ],
    color: "#10B981",
  },
];

export default function Settings() {
  const { actor } = useActor();
  const { clear } = useInternetIdentity();
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => actor!.getCallerUserProfile(),
  });

  useEffect(() => {
    if (profile?.name) setName(profile.name);
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: () => actor!.saveCallerUserProfile({ name }),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
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
        className="px-6 py-4 border-b"
        style={{ borderColor: "#263244", background: "rgba(11,18,32,0.6)" }}
      >
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          Manage your account and subscription
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Profile */}
        <div
          className="p-5 rounded-xl"
          style={{
            background: "rgba(17,24,39,0.8)",
            border: "1px solid #263244",
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <User size={20} style={{ color: "#3B82F6" }} />
            <h2 className="text-lg font-semibold text-white">User Profile</h2>
          </div>
          <div className="max-w-sm space-y-3">
            <div>
              <label
                htmlFor="display-name"
                className="text-sm block mb-1"
                style={{ color: "#9CA3AF" }}
              >
                Display Name
              </label>
              <input
                id="display-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
              />
            </div>
            <button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={!name || saveMutation.isPending}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-40 flex items-center gap-2"
              style={{ background: saved ? "#10B981" : "#3B82F6" }}
            >
              {saved && <Check size={16} />}
              {saved
                ? "Saved!"
                : saveMutation.isPending
                  ? "Saving..."
                  : "Save Profile"}
            </button>
          </div>
        </div>

        {/* Subscription Plans */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Subscription Plans
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className="p-5 rounded-xl relative"
                style={{
                  background: "rgba(17,24,39,0.8)",
                  border: `2px solid ${plan.popular ? plan.color : "#263244"}`,
                }}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: "#3B82F6", color: "#fff" }}
                  >
                    Most Popular
                  </div>
                )}
                <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                <div className="mt-1 mb-4">
                  <span
                    className="text-3xl font-bold"
                    style={{ color: plan.color }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-sm" style={{ color: "#9CA3AF" }}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm"
                      style={{ color: "#E5E7EB" }}
                    >
                      <Check
                        size={14}
                        style={{ color: plan.color, flexShrink: 0 }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: plan.popular ? plan.color : "transparent",
                    border: `1px solid ${plan.color}`,
                    color: plan.popular ? "#fff" : plan.color,
                  }}
                >
                  Get {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Logout */}
        <div
          className="p-5 rounded-xl"
          style={{
            background: "rgba(17,24,39,0.8)",
            border: "1px solid #263244",
          }}
        >
          <h2 className="text-lg font-semibold text-white mb-3">Account</h2>
          <button
            type="button"
            onClick={() => clear()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid #EF4444",
              color: "#EF4444",
            }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
