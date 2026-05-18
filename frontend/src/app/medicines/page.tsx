"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pill, AlertTriangle, Search, Info, Loader2, Plus, CheckCircle2, XCircle, Clock, Bell, Sun, Sunset, Moon, Trophy, Sparkles, ChevronRight, Filter } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function MedicinesPage() {
  const router = useRouter();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardMessage, setRewardMessage] = useState("");
  const [newMed, setNewMed] = useState({
    name: "", 
    dosage: "", 
    timing: "", 
    frequency: "Daily", 
    notes: "", 
    reminder_enabled: false,
    reminder_time: "08:00",
    categories: ["Morning"] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streak, setStreak] = useState(0);

  // Initial fetch - runs once on mount
  useEffect(() => {
    fetchMedicines();
    requestNotificationPermission();
  }, []);

  // Reminder interval - separate effect to avoid infinite loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      medicines.forEach(med => {
        if (med.reminder_enabled && med.reminder_time === currentTime && med.status !== 'Taken') {
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Prescripto AI Reminder", {
              body: `Time to take your ${med.name} (${med.dosage})`,
              icon: "/favicon.ico"
            });
          }
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [medicines]);

  const checkReminders = () => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    medicines.forEach(med => {
      const categories = med.category?.split(",") || [];
      if (med.reminder_enabled && med.reminder_time === currentTime && med.status !== 'Taken') {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Prescripto AI Reminder", {
            body: `Time to take your ${med.name} (${med.dosage})`,
            icon: "/favicon.ico"
          });
        }
      }
    });
  };

  const appreciationMessages = [
    "Fantastic! Your health is your wealth. Keep it up! 🌟",
    "Great job! Consistency is the key to recovery. 💪",
    "Medicine taken! You're doing amazing today. ✨",
    "Well done! Your body thanks you for being on time. 🍎",
    "Consistency champion! Another dose successfully tracked. 🏆"
  ];

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      await Notification.requestPermission();
    }
  };

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

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await api.put(`/medicines/${id}`, { status: newStatus });
      
      setMedicines(medicines.map(m => m.id === id ? { ...m, status: newStatus } : m));
      
      if (newStatus === "Taken") {
        setStreak(prev => prev + 1);
        setRewardMessage(appreciationMessages[Math.floor(Math.random() * appreciationMessages.length)]);
        setShowRewardModal(true);
        
        // Simulate a notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Prescripto AI", { body: "Great job! Medicine marked as taken." });
        }
      }
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  const get12hTime = (time24: string) => {
    const [h24, min] = (time24 || "08:00").split(':').map(Number);
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 || 12;
    return { h12, min, ampm };
  };

  const handleTimeChange = (type: 'hour' | 'minute' | 'ampm', value: string) => {
    const { h12, min, ampm } = get12hTime(newMed.reminder_time);
    let newH24 = 0;
    let newMin = min;
    let newH12 = h12;
    let newAmpm = ampm;

    if (type === 'hour') newH12 = parseInt(value);
    if (type === 'minute') newMin = parseInt(value);
    if (type === 'ampm') newAmpm = value;

    if (newAmpm === 'PM' && newH12 < 12) newH24 = newH12 + 12;
    else if (newAmpm === 'AM' && newH12 === 12) newH24 = 0;
    else newH24 = newH12;

    const timeString = `${newH24.toString().padStart(2, '0')}:${newMin.toString().padStart(2, '0')}`;
    setNewMed({ ...newMed, reminder_time: timeString });
  };

  const handleAddMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const addedMed: any = await api.post("/medicines/", {
        ...newMed,
        category: newMed.categories.join(","),
        timing: newMed.categories.join(" + "),
        generic_name: "User Added",
        type: "General",
        status: "Upcoming"
      });
      
      setMedicines([...medicines, addedMed]);
      setIsAddModalOpen(false);
      setNewMed({ 
        name: "", 
        dosage: "", 
        timing: "", 
        frequency: "Daily", 
        notes: "", 
        reminder_enabled: false,
        reminder_time: "08:00",
        categories: ["Morning"]
      });
    } catch (err) {
      console.error("Error adding medicine", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMedicines = medicines.filter(med => 
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.generic_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    if (status === "Taken") return <CheckCircle2 size={16} className="text-green-400" />;
    if (status === "Missed") return <XCircle size={16} className="text-rose-400" />;
    return <Clock size={16} className="text-orange-400" />;
  };

  const formatTime = (time24: string) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    let h = parseInt(hours);
    const m = minutes;
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; 
    return `${h}:${m} ${ampm}`;
  };

  return (
    <div className="flex flex-col h-full gap-6 pb-6">
      <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="py-2">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">Tracker</h1>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30 hover:bg-blue-400 transition-colors"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>
        <div className="glass-panel flex items-center gap-3 px-4 py-3 rounded-full border border-slate-600 focus-within:border-blue-500/50 transition-colors shadow-lg">
          <Search size={20} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Search your medicines..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-sm w-full text-white"
          />
        </div>
        
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 no-scrollbar">
          <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-2 border-blue-500/30 bg-blue-500/10 shadow-lg shrink-0">
            <Trophy size={16} className="text-blue-400" />
            <span className="text-xs font-bold text-blue-100">Streak: {streak} days</span>
          </div>
          <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-2 border-green-500/30 bg-green-500/10 shadow-lg shrink-0">
            <CheckCircle2 size={16} className="text-green-400" />
            <span className="text-xs font-bold text-green-100">{medicines.filter(m => m.status === 'Taken').length} Taken Today</span>
          </div>
        </div>
      </motion.header>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 size={40} className="animate-spin text-blue-500" />
          <p>Loading your library...</p>
        </div>
      ) : filteredMedicines.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-4">
          <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700 flex items-center justify-center text-slate-500 shadow-xl">
            <Pill size={40} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-200">No medicines found</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-[250px] mx-auto">Add a medicine manually or scan a prescription to populate your tracker.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8 pb-20">
          {["Morning", "Afternoon", "Night"].map(cat => {
            const catMeds = filteredMedicines.filter(m => m.category?.split(",").includes(cat));
            if (catMeds.length === 0) return null;
            
            return (
              <div key={cat} className="space-y-3">
                <h2 className="text-sm font-bold text-slate-400 px-2 uppercase tracking-[0.2em] flex items-center gap-2">
                  {cat === "Morning" && <Sun size={14} className="text-orange-400" />}
                  {cat === "Afternoon" && <Sunset size={14} className="text-amber-400" />}
                  {cat === "Night" && <Moon size={14} className="text-blue-400" />}
                  {cat} Schedule
                </h2>
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {catMeds.map((med) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        key={med.id} 
                        className={`glass-panel p-5 rounded-3xl relative overflow-hidden group transition-all cursor-pointer border ${med.status === 'Taken' ? 'border-green-500/30 bg-green-900/10 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : med.status === 'Missed' ? 'border-rose-500/30 bg-rose-900/10' : 'border-slate-700/50 hover:border-blue-500/30'}`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${med.status === 'Taken' ? 'bg-green-500/20 text-green-400 border-green-500/20' : med.status === 'Missed' ? 'bg-rose-500/20 text-rose-400 border-rose-500/20' : 'bg-slate-800 text-blue-400 border-blue-500/20'} transition-transform`}>
                              <Pill size={24} />
                            </div>
                            <div>
                              <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                                {med.name}
                              </h3>
                              <p className="text-xs text-slate-400 uppercase tracking-tighter mt-1">
                                {med.dosage} • {med.frequency}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-full text-[10px] font-bold border border-slate-700 text-slate-300 uppercase">
                              <Clock size={12} className="text-blue-400" />
                              {formatTime(med.reminder_time)}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {getStatusIcon(med.status)}
                              <span className={`text-[10px] uppercase font-bold ${med.status === 'Taken' ? 'text-green-400' : med.status === 'Missed' ? 'text-rose-400' : 'text-orange-400'}`}>{med.status}</span>
                            </div>
                          </div>
                        </div>
                        
                        {med.notes && (
                          <div className="mt-3 text-xs text-slate-400 italic bg-slate-800/30 p-2 rounded-lg">
                            Note: {med.notes}
                          </div>
                        )}
                        
                        <div className="mt-4 flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(med.id, "Taken"); }}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all shadow-sm ${med.status === 'Taken' ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-slate-800/50 text-slate-300 hover:bg-green-500/20 hover:text-green-400'}`}
                          >
                            Mark Taken
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); updateStatus(med.id, "Missed"); }}
                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all shadow-sm ${med.status === 'Missed' ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-slate-800/50 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400'}`}
                          >
                            Mark Missed
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Medicine Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="glass-panel w-full max-w-md p-6 rounded-3xl border border-blue-500/30 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Pill className="text-blue-400" />
                Add Medicine
              </h3>
              
              <form onSubmit={handleAddMedicine} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">Medicine Name</label>
                  <input required type="text" value={newMed.name} onChange={(e) => setNewMed({...newMed, name: e.target.value})} className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-white" placeholder="e.g. Paracetamol" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">Dosage</label>
                    <input required type="text" value={newMed.dosage} onChange={(e) => setNewMed({...newMed, dosage: e.target.value})} className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-white" placeholder="e.g. 500mg" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">Frequency</label>
                    <select value={newMed.frequency} onChange={(e) => setNewMed({...newMed, frequency: e.target.value})} className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-white appearance-none cursor-pointer">
                      <option value="Daily">Daily</option>
                      <option value="Twice Daily">Twice Daily</option>
                      <option value="Thrice Daily">Thrice Daily</option>
                      <option value="Weekly">Weekly</option>
                      <option value="As Needed">As Needed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">Notes (Optional)</label>
                  <input type="text" value={newMed.notes} onChange={(e) => setNewMed({...newMed, notes: e.target.value})} className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-white" placeholder="e.g. Take after meals" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">Reminder Time</label>
                    <div className="flex items-center gap-2">
                      <select 
                        value={get12hTime(newMed.reminder_time).h12} 
                        onChange={(e) => handleTimeChange('hour', e.target.value)}
                        className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-white appearance-none cursor-pointer"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                          <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                      <span className="text-slate-500 font-bold">:</span>
                      <select 
                        value={get12hTime(newMed.reminder_time).min} 
                        onChange={(e) => handleTimeChange('minute', e.target.value)}
                        className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-white appearance-none cursor-pointer"
                      >
                        {Array.from({ length: 60 }, (_, i) => i).map(m => (
                          <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                      <select 
                        value={get12hTime(newMed.reminder_time).ampm} 
                        onChange={(e) => handleTimeChange('ampm', e.target.value)}
                        className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-blue-400 font-bold cursor-pointer"
                      >
                        <option value="AM" className="bg-slate-900 text-white">AM</option>
                        <option value="PM" className="bg-slate-900 text-white">PM</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 mb-2 block uppercase tracking-wider">Categories (Select Multiple)</label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Morning", "Afternoon", "Night"].map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            const cats = newMed.categories.includes(cat)
                              ? newMed.categories.filter(c => c !== cat)
                              : [...newMed.categories, cat];
                            if (cats.length > 0) setNewMed({...newMed, categories: cats});
                          }}
                          className={`py-2 px-1 rounded-xl text-[10px] font-bold border transition-all ${
                            newMed.categories.includes(cat)
                              ? "bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/20"
                              : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border border-slate-700 rounded-2xl bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <Bell size={20} className={newMed.reminder_enabled ? "text-blue-400" : "text-slate-500"} />
                    <div>
                      <span className="text-sm font-bold block">Enable Alerts</span>
                      <span className="text-[10px] text-slate-500 uppercase">Notify me at {formatTime(newMed.reminder_time)}</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setNewMed({...newMed, reminder_enabled: !newMed.reminder_enabled})}
                    className={`w-12 h-6 rounded-full transition-colors relative ${newMed.reminder_enabled ? 'bg-blue-500' : 'bg-slate-600'}`}
                  >
                    <motion.div 
                      layout
                      className="w-4 h-4 bg-white rounded-full absolute top-1"
                      animate={{ left: newMed.reminder_enabled ? '1.75rem' : '0.25rem' }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                <div className="flex gap-3 mt-8 pt-4">
                  <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 rounded-xl glass-panel hover:bg-slate-800 transition-colors font-medium">Cancel</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center">
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Save Medicine"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reward/Appreciation Modal */}
      <AnimatePresence>
        {showRewardModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-panel-elevated w-full max-w-sm p-8 rounded-[2rem] border-green-500/30 shadow-[0_20px_50px_rgba(34,197,94,0.2)] text-center relative overflow-hidden"
            >
              {/* Decorative background sparkles */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
                <Sparkles size={100} className="absolute -top-10 -left-10 text-yellow-400 rotate-12" />
                <Sparkles size={80} className="absolute -bottom-10 -right-10 text-green-400 -rotate-12" />
              </div>

              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/40 relative z-10">
                <Trophy size={48} className="text-white" />
              </div>
              
              <h3 className="text-2xl font-black text-white mb-4 relative z-10">Bravo!</h3>
              <p className="text-slate-200 font-medium mb-8 leading-relaxed relative z-10">
                {rewardMessage}
              </p>
              
              <button 
                onClick={() => setShowRewardModal(false)}
                className="w-full py-4 rounded-2xl bg-white text-green-600 font-black text-lg hover:bg-green-50 shadow-xl transition-all relative z-10"
              >
                Keep it up!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
