"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { Activity, Droplet, Moon, Zap, Pill, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function AnalyticsPage() {
  const router = useRouter();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push("/login");
      return;
    }
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const data: any = await api.get("/medicines/");
      setMedicines(data);
    } catch (err: any) {
      console.error("Error fetching medicines:", err);
      if (err.message.includes("credentials") || err.message.includes("token")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const totalMeds = medicines.length;
  const takenMeds = medicines.filter(m => m.status === "Taken").length;
  const missedMeds = medicines.filter(m => m.status === "Missed").length;
  const upcomingMeds = medicines.filter(m => m.status === "Upcoming" || !m.status).length;
  
  const adherenceRate = totalMeds === 0 ? 0 : Math.round((takenMeds / totalMeds) * 100);

  const pieData = [
    { name: "Taken", value: takenMeds, color: "#4ade80" }, // green-400
    { name: "Missed", value: missedMeds, color: "#f87171" }, // rose-400
    { name: "Upcoming", value: upcomingMeds, color: "#fb923c" } // orange-400
  ];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full gap-3 text-slate-400">
        <Loader2 size={40} className="animate-spin text-blue-500" />
        <p>Analyzing health data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-6 pb-6">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 py-2">
        <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
          <Activity size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Health Analytics</h1>
          <p className="text-sm text-slate-400">Your real-time adherence data</p>
        </div>
      </motion.header>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-panel p-6 rounded-3xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <h2 className="text-sm font-semibold text-slate-300 mb-6 uppercase tracking-wider">Today's Adherence</h2>
        
        <div className="flex items-center justify-between">
          <div className="w-1/2 flex flex-col items-center justify-center relative">
            <div className="h-[140px] w-full relative">
              {totalMeds > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px' }}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-4 border-slate-700/50" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-white">{adherenceRate}%</span>
              </div>
            </div>
          </div>
          
          <div className="w-1/2 space-y-4 pl-4 border-l border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-3 h-3 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" /> Taken
              </div>
              <span className="font-bold text-green-400">{takenMeds}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]" /> Upcoming
              </div>
              <span className="font-bold text-orange-400">{upcomingMeds}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-3 h-3 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]" /> Missed
              </div>
              <span className="font-bold text-rose-400">{missedMeds}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-5 rounded-3xl flex flex-col items-center justify-center gap-2 text-center relative overflow-hidden"
        >
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-indigo-500/5 blur-xl" />
          <Pill size={28} className="text-indigo-400" />
          <div>
            <p className="text-3xl font-bold">{totalMeds}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Total Meds</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-5 rounded-3xl flex flex-col items-center justify-center gap-2 text-center relative overflow-hidden"
        >
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-blue-500/5 blur-xl" />
          <CheckCircle2 size={28} className="text-blue-400" />
          <div>
            <p className="text-3xl font-bold">{takenMeds}</p>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mt-1">Completed</p>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className={`glass-panel p-5 rounded-3xl border-l-4 ${missedMeds > 0 ? 'border-l-rose-500' : adherenceRate === 100 ? 'border-l-green-500' : 'border-l-blue-500'}`}
      >
        <div className="flex items-start gap-4">
          {missedMeds > 0 ? (
            <AlertTriangle className="text-rose-400 mt-1 shrink-0" size={24} />
          ) : (
            <Zap className="text-green-400 mt-1 shrink-0" size={24} />
          )}
          <div>
            <h3 className="font-semibold mb-1 text-white">AI Health Insight</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {totalMeds === 0 
                ? "You haven't added any medicines yet. Scan a prescription to get started." 
                : missedMeds > 0 
                ? `You have missed ${missedMeds} medicine${missedMeds > 1 ? 's' : ''} today. Consistency is key for optimal health outcomes. Try setting an alarm.`
                : adherenceRate === 100 
                ? "Perfect adherence today! You're doing a fantastic job maintaining your health schedule."
                : `You're on track with ${takenMeds} medicine${takenMeds !== 1 ? 's' : ''} taken. Don't forget your upcoming doses.`}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
