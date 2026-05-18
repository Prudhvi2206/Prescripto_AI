"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, Bell, Shield, HeartPulse, LogOut, ChevronRight, Camera, Phone, Mail, FileText, Key, Lock, EyeOff, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingHealth, setIsEditingHealth] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isRequestingNotification, setIsRequestingNotification] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>("default");
  
  const [profileData, setProfileData] = useState({
    name: "Loading...",
    email: "",
    phone_number: "",
    profile_picture_url: ""
  });

  const [healthData, setHealthData] = useState({
    bloodGroup: "Unknown",
    allergies: "None",
    chronicConditions: "None",
  });

  useEffect(() => {
    fetchProfile();
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationStatus(Notification.permission);
    }
  }, []);

  async function fetchProfile() {
    try {
      const data: any = await api.get("/users/me");
      
      setProfileData({
        name: data.name || "User",
        email: data.email || "",
        phone_number: data.phone_number || "",
        profile_picture_url: data.profile_picture_url || ""
      });
      
      setHealthData({
        bloodGroup: data.blood_group || "Unknown",
        allergies: data.allergies || "None",
        chronicConditions: data.chronic_conditions || "None",
      });
    } catch (err: any) {
      console.error("Error fetching profile:", err);
      if (err.message.includes("credentials") || err.message.includes("token") || err.message.includes("authenticated")) {
        router.push("/login");
      }
    }
  }

  const saveProfileData = async () => {
    try {
      await api.put("/users/me", {
        name: profileData.name,
        email: profileData.email,
        phone_number: profileData.phone_number,
        profile_picture_url: profileData.profile_picture_url
      });
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Error saving profile:", err);
    }
  };

  const saveHealthData = async () => {
    try {
      await api.put("/users/me", {
        blood_group: healthData.bloodGroup,
        allergies: healthData.allergies,
        chronic_conditions: healthData.chronicConditions
      });
      setIsEditingHealth(false);
    } catch (err) {
      console.error("Error saving health data:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const downloadHealthReport = async () => {
    try {
      const meds: any = await api.get("/medicines/");
      
      let report = `PRESCRIPTO AI - HEALTH REPORT\n`;
      report += `=============================\n\n`;
      report += `Name: ${profileData.name}\n`;
      report += `Email: ${profileData.email}\n`;
      report += `Phone: ${profileData.phone_number || 'N/A'}\n\n`;
      
      report += `MEDICAL ID\n`;
      report += `----------\n`;
      report += `Blood Group: ${healthData.bloodGroup}\n`;
      report += `Allergies: ${healthData.allergies}\n`;
      report += `Chronic Conditions: ${healthData.chronicConditions}\n\n`;
      
      report += `MEDICATIONS\n`;
      report += `-----------\n`;
      if (meds && meds.length > 0) {
        meds.forEach((m: any, i: number) => {
          report += `${i+1}. ${m.name} (${m.dosage})\n`;
          report += `   Frequency: ${m.frequency || 'N/A'}\n`;
          report += `   Timing: ${m.timing || 'N/A'}\n`;
          report += `   Duration: ${m.duration || 'N/A'}\n`;
          report += `   Status: ${m.status || 'N/A'}\n\n`;
        });
      } else {
        report += `No active medications.\n\n`;
      }
      
      report += `Generated on: ${new Date().toLocaleString()}\n`;
      report += `Confidential Medical Information\n`;
      
      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Health_Report_${profileData.name.replace(/\\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Error generating report", err);
      alert("Failed to generate health report. Please try again.");
    }
  };
  
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications");
      return;
    }
    
    setIsRequestingNotification(true);
    try {
      // Some older browsers don't support the promise-based requestPermission
      // This wrapper handles both cases
      const permission = await new Promise<NotificationPermission>((resolve) => {
        const result = Notification.requestPermission(resolve);
        if (result) {
          result.then(resolve);
        }
      });
      
      setNotificationStatus(permission);
      
      if (permission === "granted") {
        new Notification("Prescripto AI", {
          body: "Health notifications enabled! We'll keep you updated on your medications.",
          icon: "/favicon.ico"
        });
        setTimeout(() => setShowNotificationsModal(false), 1000);
      } else if (permission === "denied") {
        alert("Notifications are blocked. Please enable them in your browser settings to receive health alerts.");
      }
    } catch (error) {
      console.error("Notification permission error:", error);
    } finally {
      setIsRequestingNotification(false);
    }
  };

  const modalVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 300, damping: 25 } },
    exit: { opacity: 0, y: 20, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <div className="flex flex-col h-full gap-8 pb-10 relative">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="py-6 text-center flex flex-col items-center relative"
      >
        <div className="absolute top-0 right-4 text-slate-400 hover:text-white cursor-pointer transition-colors p-2" onClick={() => setIsEditingProfile(true)}>
          <Settings size={24} />
        </div>
        
        <div className="relative mb-4">
          <div className="w-28 h-28 rounded-full glass-panel flex items-center justify-center border-4 border-blue-500/30 overflow-hidden shadow-[0_0_30px_rgba(59,130,246,0.3)]">
            {profileData.profile_picture_url ? (
              <img src={profileData.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User size={48} className="text-blue-400" />
            )}
          </div>
          <button 
            onClick={() => setIsEditingProfile(true)}
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center border-2 border-slate-900 text-white shadow-lg hover:bg-blue-400 transition-colors"
          >
            <Camera size={14} />
          </button>
        </div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">{profileData.name}</h1>
        <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
          <Mail size={14} /> {profileData.email || "No email provided"}
        </p>
        {profileData.phone_number && (
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <Phone size={14} /> {profileData.phone_number}
          </p>
        )}
      </motion.header>

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 px-4 uppercase tracking-wider">Health Profile</h2>
        <div className="glass-panel rounded-3xl overflow-hidden shadow-lg">
          <div 
            onClick={() => setIsEditingHealth(true)}
            className="p-5 flex items-center justify-between border-b border-slate-700/50 hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
                <HeartPulse size={20} />
              </div>
              <div>
                <span className="font-semibold block text-base">Medical ID & Records</span>
                <span className="text-xs text-slate-400">Blood: {healthData.bloodGroup} • Allergies: {healthData.allergies}</span>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-500" />
          </div>
          <div 
            onClick={downloadHealthReport}
            className="p-5 flex items-center justify-between hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <FileText size={20} />
              </div>
              <span className="font-semibold text-base">Download Health Report</span>
            </div>
            <ChevronRight size={20} className="text-slate-500" />
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 px-4 uppercase tracking-wider">Preferences</h2>
        <div className="glass-panel rounded-3xl overflow-hidden shadow-lg">
          <div 
            onClick={() => setShowNotificationsModal(true)}
            className="p-5 flex items-center justify-between border-b border-slate-700/50 hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400">
                <Bell size={20} />
              </div>
              <div>
                <span className="font-semibold block text-base">Notifications</span>
                <span className="text-xs text-slate-400">
                  {notificationStatus === "granted" ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
            <ChevronRight size={20} className="text-slate-500" />
          </div>
          <div 
            onClick={() => setShowPrivacyModal(true)}
            className="p-5 flex items-center justify-between hover:bg-slate-800/50 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400">
                <Shield size={20} />
              </div>
              <span className="font-semibold text-base">Privacy & Security</span>
            </div>
            <ChevronRight size={20} className="text-slate-500" />
          </div>
        </div>
      </motion.div>

      <motion.button 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={handleLogout}
        className="glass-panel p-4 rounded-2xl flex items-center justify-center gap-3 text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/50 transition-all mt-4 shadow-lg shadow-rose-500/5"
      >
        <LogOut size={20} />
        <span className="font-bold text-lg">Secure Log Out</span>
      </motion.button>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-panel w-full max-w-md p-6 rounded-3xl border border-blue-500/30 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <User className="text-blue-400" />
                Edit Profile
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">Phone Number</label>
                  <input 
                    type="tel"
                    value={profileData.phone_number}
                    onChange={(e) => setProfileData({...profileData, phone_number: e.target.value})}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-white"
                    placeholder="+1 234 567 8900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">Profile Picture URL</label>
                  <input 
                    type="url"
                    value={profileData.profile_picture_url}
                    onChange={(e) => setProfileData({...profileData, profile_picture_url: e.target.value})}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 outline-none focus:border-blue-500 transition-colors text-white"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-3 rounded-xl glass-panel hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveProfileData}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold transition-colors shadow-lg shadow-blue-500/20"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Health Profile Modal */}
      <AnimatePresence>
        {isEditingHealth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-panel w-full max-w-md p-6 rounded-3xl border border-rose-500/30 shadow-2xl"
            >
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <HeartPulse className="text-rose-400" />
                Medical ID
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">Blood Group</label>
                  <select 
                    value={healthData.bloodGroup}
                    onChange={(e) => setHealthData({...healthData, bloodGroup: e.target.value})}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 outline-none focus:border-rose-500 transition-colors text-white appearance-none"
                  >
                    <option value="Unknown">Unknown</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">Allergies</label>
                  <input 
                    type="text"
                    value={healthData.allergies}
                    onChange={(e) => setHealthData({...healthData, allergies: e.target.value})}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 outline-none focus:border-rose-500 transition-colors text-white"
                    placeholder="e.g. Peanuts, Penicillin"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1 block uppercase tracking-wider">Chronic Conditions</label>
                  <input 
                    type="text"
                    value={healthData.chronicConditions}
                    onChange={(e) => setHealthData({...healthData, chronicConditions: e.target.value})}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 outline-none focus:border-rose-500 transition-colors text-white"
                    placeholder="e.g. Asthma, Diabetes"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button 
                  onClick={() => setIsEditingHealth(false)}
                  className="flex-1 py-3 rounded-xl glass-panel hover:bg-slate-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveHealthData}
                  className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 font-bold transition-colors shadow-lg shadow-rose-500/20"
                >
                  Save Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Notifications Modal */}
      <AnimatePresence>
        {showNotificationsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-panel w-full max-w-md p-8 rounded-3xl border border-orange-500/30 shadow-2xl text-center"
            >
              <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-6 text-orange-400">
                <Bell size={40} className="animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Enable Notifications</h3>
              <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                Stay updated on your health journey. We'll send you reminders for medications, appointments, and critical health alerts.
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={requestNotificationPermission}
                  disabled={isRequestingNotification || notificationStatus === "granted"}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                    notificationStatus === "granted" 
                      ? "bg-green-500/20 text-green-400 border border-green-500/30 cursor-default" 
                      : "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]"
                  }`}
                >
                  {isRequestingNotification ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : notificationStatus === "granted" ? (
                    <>
                      <CheckCircle2 size={20} />
                      Notifications Enabled
                    </>
                  ) : (
                    <>
                      <Bell size={20} />
                      Enable Push Notifications
                    </>
                  )}
                </button>
                {notificationStatus === "denied" && (
                  <p className="text-[10px] text-rose-400 mt-2">
                    Permission denied. Please check your browser's site settings to reset.
                  </p>
                )}
                <button 
                  onClick={() => setShowNotificationsModal(false)}
                  className="w-full py-3 rounded-xl text-slate-400 hover:text-white transition-colors text-sm font-medium"
                >
                  {notificationStatus === "granted" ? "Close" : "Maybe Later"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy & Security Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div 
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-panel w-full max-w-md p-6 rounded-3xl border border-teal-500/30 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="text-teal-400" />
                  Privacy & Security
                </h3>
                <button 
                  onClick={() => setShowPrivacyModal(false)}
                  className="w-8 h-8 rounded-full glass-panel flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-4">
                  <div className="mt-1">
                    <CheckCircle2 size={20} className="text-teal-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-teal-100">End-to-End Encrypted</h4>
                    <p className="text-xs text-slate-400 mt-1">Your medical data is encrypted and can only be accessed by you.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <button className="w-full p-4 rounded-xl glass-panel-elevated hover:bg-slate-800 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Key size={18} className="text-slate-400 group-hover:text-teal-400 transition-colors" />
                      <span className="font-medium">Change Password</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-500" />
                  </button>
                  
                  <button className="w-full p-4 rounded-xl glass-panel-elevated hover:bg-slate-800 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Lock size={18} className="text-slate-400 group-hover:text-teal-400 transition-colors" />
                      <span className="font-medium">Two-Factor Authentication</span>
                    </div>
                    <span className="text-[10px] bg-slate-700 text-slate-400 px-2 py-1 rounded-full uppercase tracking-tighter">Recommended</span>
                  </button>

                  <button className="w-full p-4 rounded-xl glass-panel-elevated hover:bg-slate-800 transition-all flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <EyeOff size={18} className="text-slate-400 group-hover:text-teal-400 transition-colors" />
                      <span className="font-medium">Data Privacy Settings</span>
                    </div>
                    <ChevronRight size={18} className="text-slate-500" />
                  </button>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-700/50">
                  <p className="text-[10px] text-slate-500 text-center uppercase tracking-[0.2em] font-bold">
                    Protected by Prescripto Shield Engine
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
