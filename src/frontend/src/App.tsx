import { RouterProvider, createRouter } from "@tanstack/react-router";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { routeTree } from "./routeTree";

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const { identity, login, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, #0F1420 0%, #111827 50%, #0B1220 100%)",
        }}
      >
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, #0F1420 0%, #111827 50%, #0B1220 100%)",
        }}
      >
        <div
          className="text-center p-8 rounded-2xl"
          style={{
            background: "rgba(17,24,39,0.85)",
            border: "1px solid #263244",
            maxWidth: 400,
            width: "100%",
          }}
        >
          <div className="text-4xl mb-4">🍽️</div>
          <h1 className="text-3xl font-bold text-white mb-2">RestoPOS</h1>
          <p className="text-gray-400 mb-8">Restaurant Point of Sale System</p>
          <button
            type="button"
            onClick={login}
            className="w-full py-3 px-6 rounded-xl font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)" }}
          >
            Sign in with Internet Identity
          </button>
          <p className="text-gray-500 text-sm mt-4">
            Secure, decentralized authentication
          </p>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
