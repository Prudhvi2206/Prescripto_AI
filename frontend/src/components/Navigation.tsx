"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, Activity, User, Pill } from "lucide-react";
import { motion } from "framer-motion";

export default function Navigation() {
  const pathname = usePathname();

  // Hide navigation on auth pages
  const authPages = ["/login", "/signup"];
  if (authPages.includes(pathname)) return null;

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/chat", icon: MessageSquare, label: "AI Chat" },
    { href: "/medicines", icon: Pill, label: "Medicines" },
    { href: "/analytics", icon: Activity, label: "Health" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <>
      {/* Desktop Sidebar - hidden on mobile */}
      <nav className="hidden lg:flex desktop-sidebar" aria-label="Desktop navigation">
        <Link href="/" className="flex items-center gap-3 px-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30 border border-white/10">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Prescripto</span>
        </Link>

        <div className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.href} 
                href={item.href} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? "bg-blue-500/15 text-blue-400" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-700/50">
          <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest">Prescripto AI v1.0</p>
        </div>
      </nav>

      {/* Mobile Bottom Bar - hidden on desktop */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-6 z-50 flex justify-center pointer-events-none" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <div className="glass-panel w-full max-w-md px-6 py-3 flex justify-between items-center rounded-full border border-blue-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)] pointer-events-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href} className="relative flex flex-col items-center p-2 group">
                <Icon 
                  size={24} 
                  className={`transition-all duration-300 ${isActive ? "text-blue-400" : "text-slate-400 group-hover:text-slate-200"}`} 
                />
                {isActive && (
                  <motion.div 
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                    transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
