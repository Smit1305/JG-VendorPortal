import React, { useState } from 'react';
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      authApi.setSession(res);
      toast.success("Login successful!");
      const role = res?.data?.role || res?.role;
      if (role === "admin") navigate("/admin/dashboard");
      else navigate("/vendor/main");
    } catch (err) {
      toast.error(err?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 50%, #ebf3fe 0%, #f6f9fc 100%)" }}
    >
      {/* Left — background image */}
      <div
        className="hidden lg:block flex-shrink-0"
        style={{
          width: "58.33%",
          backgroundImage: "url('/assets/images/mainimglogin.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "left center",
        }}
      />

      {/* Right — auth panel */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 min-h-screen">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="flex items-center justify-center mb-5">
            <img
              src="/assets/images/finallogojigi.jpeg"
              alt="Jigisha"
              className="max-h-20 w-auto"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-3">
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="Enter your email"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                  focus:border-[#5d87ff] focus:ring-2 focus:ring-[#5d87ff]/20 focus:outline-none"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm
                    focus:border-[#5d87ff] focus:ring-2 focus:ring-[#5d87ff]/20 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10.585 10.587a2 2 0 0 0 2.829 2.828" />
                      <path d="M16.681 16.673a8.717 8.717 0 0 1-4.681 1.327c-3.6 0-6.6-2-9-6 1.272-2.12 2.712-3.678 4.32-4.674m2.86-1.146a9.055 9.055 0 0 1 1.82-.18c3.6 0 6.6 2 9 6-.666 1.11-1.379 2.067-2.138 2.87" />
                      <path d="M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M10 12a2 2 0 1 0 4 0a2 2 0 0 0-4 0" />
                      <path d="M21 12c-2.4 4-5.4 6-9 6s-6.6-2-9-6c2.4-4 5.4-6 9-6s6.6 2 9 6" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mb-4 rounded-lg text-sm font-semibold text-white
                bg-[#5d87ff] hover:bg-[#4570ea] disabled:opacity-60 transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>

            {/* Register link */}
            <div className="flex items-center justify-center gap-1 text-sm">
              <span className="font-medium text-gray-700">New to Jigisha?</span>
              <Link to="/register" className="text-[#5d87ff] font-medium ml-1 hover:underline">
                Create an account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
