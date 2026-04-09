import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import ChatbotWidget from "./ChatbotWidget";
import useAuth from "../hooks/useAuth";

export default function Layout({ children }) {
  const { role } = useAuth();
  const [open, setOpen] = useState(() => window.innerWidth >= 1024);

  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024) setOpen(true);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f6f9fc]">
      <Sidebar open={open} onToggle={() => setOpen((v) => !v)} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Navbar onMenuClick={() => setOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-5">
          {children}
        </main>
      </div>
      {/* Chatbot only for vendor role */}
      {role !== "admin" && <ChatbotWidget />}
    </div>
  );
}
