import { Navigate, Route, Routes } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import { useAuthStore } from "./store/useAuthStore";
import { useEffect } from "react";
import PageLoader from "./components/PageLoader";
import { Toaster } from "react-hot-toast";

function App() {
  const { checkAuth, isCheckingAuth, authUser } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 👇 Yeh lines yahan add karo
  console.log("authUser:", authUser);
  console.log("isCheckingAuth:", isCheckingAuth);

  if (isCheckingAuth) return <PageLoader />;

return (
  <div className="min-h-screen bg-slate-900 relative overflow-hidden">

    {/* Background */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px]" />

    <div className="absolute top-0 -left-4 w-96 h-96 bg-pink-500 opacity-20 blur-[100px]" />

    <div className="absolute bottom-0 -right-4 w-96 h-96 bg-cyan-500 opacity-20 blur-[100px]" />

    {/* Main */}
    <div className="relative w-full h-screen md:flex md:items-center md:justify-center md:p-4">

      <Routes>
        <Route
          path="/"
          element={authUser ? <ChatPage /> : <Navigate to="/login" />}
        />

        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />

        <Route
          path="/signup"
          element={!authUser ? <SignUpPage /> : <Navigate to="/" />}
        />
      </Routes>

    </div>

    <Toaster />

  </div>
);
}

export default App;
