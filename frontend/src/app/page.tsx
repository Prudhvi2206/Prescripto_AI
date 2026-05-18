"use client";

import { useState, useEffect } from "react";
import { Camera, MessageSquare, Calendar, Pill, Activity, User, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("User");
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loadingMeds, setLoadingMeds] = useState(true);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push("/login");
      return;
    }

    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.name || "User");
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }
    }

    fetchTodayMedicines();
  }, [router]);

  async function fetchTodayMedicines() {
    try {
      const data: any = await api.get("/medicines/");
      setMedicines(data);
    } catch (err) {
      console.error("Error fetching medicines:", err);
    } finally {
      setLoadingMeds(false);
    }
  }

  const getStatusColor = (status: string) => {
    if (status === "Taken") return "border-l-green-500";
    if (status === "Missed") return "border-l-rose-500";
    return "border-l-orange-500";
  };

  const getStatusIcon = (status: string) => {
    if (status === "Taken") return <CheckCircle2 size={14} className="text-green-400" />;
    if (status === "Missed") return <XCircle size={14} className="text-rose-400" />;
    return <Clock size={14} className="text-orange-400" />;
  };

  const formatTime = (time24: string) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${minutes} ${ampm}`;
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex flex-col gap-8 pb-20">
      {/* Header section */}
      <header className="flex justify-between items-center py-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Prescripto AI
          </h1>
          <p className="text-sm text-slate-400 mt-1">{greeting()}, {userName} 👋</p>
        </div>
        <Link href="/profile" className="w-12 h-12 rounded-full glass-panel flex items-center justify-center overflow-hidden border-2 border-blue-500/30">
          <User className="text-blue-400" size={24} />
        </Link>
      </header>

      {/* Main Quick Action */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 flex flex-col items-center text-center gap-4 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl -ml-10 -mb-10" />
        
        <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mb-2">
          <Camera size={40} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Scan Prescription</h2>
          <p className="text-slate-300 text-sm mb-6 max-w-[250px] mx-auto">
            Use AI to instantly read and understand your medical prescriptions.
          </p>
        </div>
        <Link href="/scan" className="glass-button px-8 py-3 font-medium w-full max-w-xs flex items-center justify-center gap-2">
          <Camera size={20} />
          <span>Open Scanner</span>
        </Link>
      </motion.div>

      {/* Secondary Actions Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Link href="/chat" className="glass-panel p-5 flex flex-col items-center gap-3 text-center transition-all hover:bg-slate-800/50 hover:border-blue-500/30 w-full h-full">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
            <MessageSquare size={24} />
          </div>
          <span className="font-medium text-sm">AI Medical Assistant</span>
        </Link>

        <Link href="/medicines" className="glass-panel p-5 flex flex-col items-center gap-3 text-center transition-all hover:bg-slate-800/50 hover:border-blue-500/30 cursor-pointer w-full h-full">
          <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
            <Pill size={24} />
          </div>
          <span className="font-medium text-sm">Medicine Library</span>
        </Link>

        <Link href="/chat?action=symptoms" className="glass-panel p-5 flex flex-col items-center gap-3 text-center transition-all hover:bg-slate-800/50 hover:border-blue-500/30 cursor-pointer w-full h-full">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
            <Activity size={24} />
          </div>
          <span className="font-medium text-sm">Symptom Checker</span>
        </Link>

        <Link href="/analytics" className="glass-panel p-5 flex flex-col items-center gap-3 text-center transition-all hover:bg-slate-800/50 hover:border-blue-500/30 cursor-pointer w-full h-full">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
            <Calendar size={24} />
          </div>
          <span className="font-medium text-sm">Health Analytics</span>
        </Link>
      </div>
      
      {/* Today's Medicines - Real Data */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-4 pl-2 border-l-4 border-blue-500">Today&apos;s Medicines</h3>
        <div className="flex flex-col gap-3">
          {loadingMeds ? (
            <div className="flex items-center justify-center py-8 text-slate-400 gap-2">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Loading medicines...</span>
            </div>
          ) : medicines.length === 0 ? (
            <div className="glass-panel p-6 text-center">
              <Pill size={32} className="text-slate-500 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No medicines added yet.</p>
              <Link href="/scan" className="text-blue-400 text-sm font-semibold mt-2 inline-block hover:text-blue-300">
                Scan a prescription to get started →
              </Link>
            </div>
          ) : (
            medicines.slice(0, 5).map((med) => (
              <motion.div
                key={med.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`glass-panel p-4 flex items-center justify-between border-l-4 ${getStatusColor(med.status)}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center ${
                    med.status === "Taken" ? "text-green-400" : med.status === "Missed" ? "text-rose-400" : "text-blue-400"
                  }`}>
                    <Pill size={20} />
                  </div>
                  <div>
                    <p className="font-medium">{med.name}</p>
                    <p className="text-xs text-slate-400">{med.dosage} • {med.frequency || "Daily"}</p>
                  </div>
                </div>
                <div className="text-right">
                  {med.reminder_time && (
                    <p className="font-bold text-sm">{formatTime(med.reminder_time)}</p>
                  )}
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    {getStatusIcon(med.status)}
                    <p className={`text-xs font-semibold ${
                      med.status === "Taken" ? "text-green-400" : med.status === "Missed" ? "text-rose-400" : "text-orange-400"
                    }`}>{med.status || "Upcoming"}</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
