"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Camera, Image as ImageIcon, UploadCloud, ArrowLeft, Loader2, X, Pill, AlertCircle, CheckCircle2, Info } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function ScannerPage() {
  const router = useRouter();
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    if (!api.isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera stream when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access the camera. Please check permissions.");
    }
  };

  const compressImage = (dataUrl: string, maxWidth: number = 1080): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth * height) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.8 quality
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = dataUrl;
    });
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageDataUrl = canvas.toDataURL("image/jpeg");
        stopCamera();
        
        compressImage(imageDataUrl).then((compressedUrl) => {
          setCapturedImage(compressedUrl);
          performAnalysis(compressedUrl);
        });
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        compressImage(imageDataUrl).then((compressedUrl) => {
          setCapturedImage(compressedUrl);
          performAnalysis(compressedUrl);
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const performAnalysis = async (imageSrc: string) => {
    setIsScanning(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append("file", blob, "prescription.jpg");

      const data: any = await api.post("/prescriptions/scan", formData, { isFormData: true });
      
      try {
        const parsedSummary = JSON.parse(data.ai_summary);
        setResult(parsedSummary);
      } catch (parseError) {
        setError("Could not parse analysis results. Please try again.");
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "Could not connect to the analysis server.");
    } finally {
      setIsScanning(false);
    }
  };

  const resetScanner = () => {
    setResult(null);
    setCapturedImage(null);
    stopCamera();
  };

  return (
    <div className="flex flex-col h-full min-h-[90vh]">
      <header className="flex items-center gap-4 py-4 mb-4">
        <Link href="/" onClick={stopCamera} className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-slate-800 transition-colors z-10">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Prescription Scanner</h1>
      </header>

      {/* Hidden file input for gallery */}
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* Hidden canvas for capturing video frame */}
      <canvas ref={canvasRef} className="hidden" />

      {!result && !error ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col gap-6"
        >
          <div className="flex-1 glass-panel border-dashed border-2 border-slate-600 rounded-3xl flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
            
            {isScanning ? (
              <div className="flex flex-col items-center gap-4 text-blue-400 z-10">
                <Loader2 size={48} className="animate-spin" />
                <p className="font-medium animate-pulse text-lg">AI Extracting Data...</p>
                
                <motion.div 
                  className="absolute top-0 left-0 w-full h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)] z-20"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
                
                {capturedImage && (
                  <img src={capturedImage} alt="Captured" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-sm scale-110" />
                )}
              </div>
            ) : isCameraActive ? (
              <div className="absolute inset-0 w-full h-full bg-black flex flex-col">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="flex-1 w-full object-cover"
                />
                <div className="absolute top-6 left-6 right-6 flex justify-center">
                  <div className="px-4 py-1.5 bg-blue-500/20 backdrop-blur-md rounded-full border border-blue-500/30 text-xs font-bold uppercase tracking-widest text-blue-400">
                    Align Prescription Clearly
                  </div>
                </div>
                <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-8 px-6">
                  <button onClick={stopCamera} className="p-3 bg-slate-800/80 rounded-full text-white backdrop-blur-md border border-slate-700">
                    <X size={24} />
                  </button>
                  <button 
                    onClick={capturePhoto} 
                    className="w-18 h-18 rounded-full border-4 border-white bg-blue-500/30 backdrop-blur-md flex items-center justify-center relative group"
                  >
                    <div className="w-14 h-14 bg-white rounded-full group-active:scale-90 transition-transform"></div>
                  </button>
                  <div className="w-[48px]"></div> 
                </div>
              </div>
            ) : (
              <div className="p-4 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 mb-4 border border-blue-500/20">
                  <Camera size={48} />
                </div>
                <h2 className="text-2xl font-bold mb-2 tracking-tight">Prescription Scanner</h2>
                <p className="text-slate-400 max-w-[260px] text-sm leading-relaxed">
                  Capture or upload your prescription to instantly identify medicines and dosages.
                </p>
              </div>
            )}
          </div>

          {!isCameraActive && !isScanning && (
            <div className="grid grid-cols-2 gap-4 mt-auto">
              <button 
                onClick={startCamera}
                className="glass-button py-4 flex flex-col items-center gap-2 rounded-2xl group"
              >
                <Camera size={24} className="group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-sm">Use Camera</span>
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="glass-panel py-4 flex flex-col items-center gap-2 rounded-2xl hover:bg-slate-800/80 transition-all border-slate-700 hover:border-purple-500/30 group"
              >
                <ImageIcon size={24} className="text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-sm text-slate-300">Upload Image</span>
              </button>
            </div>
          )}
        </motion.div>
      ) : error ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-6"
        >
          <div className="w-20 h-20 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 border border-rose-500/20">
            <AlertCircle size={40} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Scan Failed</h2>
            <p className="text-slate-400 text-sm max-w-[250px]">{error}</p>
          </div>
          <button 
            onClick={resetScanner}
            className="glass-button px-8 py-3 rounded-full font-bold"
          >
            Try Again
          </button>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col gap-6 pb-10"
        >
          <div className="flex flex-col gap-4">
            <div className="glass-panel p-5 border-l-4 border-l-blue-500 overflow-hidden relative">
               <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-12 -mt-12" />
               <h3 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Analysis Summary</h3>
               <p className="text-slate-200 leading-relaxed italic">
                 "{result.summary}"
               </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-1">
              {(result.doctor_name || result.patient_name || result.hospital_name || result.date || result.diagnosis) && (
                 <>
                   {result.doctor_name && result.doctor_name !== "null" && (
                     <div className="glass-panel p-3 border border-slate-700/50 rounded-xl">
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter mb-1">Doctor</p>
                       <p className="text-sm text-slate-200 font-medium truncate">{result.doctor_name}</p>
                     </div>
                   )}
                   {result.patient_name && result.patient_name !== "null" && (
                     <div className="glass-panel p-3 border border-slate-700/50 rounded-xl">
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter mb-1">Patient</p>
                       <p className="text-sm text-slate-200 font-medium truncate">{result.patient_name}</p>
                     </div>
                   )}
                   {result.hospital_name && result.hospital_name !== "null" && (
                     <div className="glass-panel p-3 border border-slate-700/50 rounded-xl col-span-2">
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter mb-1">Hospital / Clinic</p>
                       <p className="text-sm text-slate-200 font-medium truncate">{result.hospital_name}</p>
                     </div>
                   )}
                   {result.date && result.date !== "null" && (
                     <div className="glass-panel p-3 border border-slate-700/50 rounded-xl">
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter mb-1">Date</p>
                       <p className="text-sm text-slate-200 font-medium truncate">{result.date}</p>
                     </div>
                   )}
                   {result.diagnosis && result.diagnosis !== "null" && (
                     <div className="glass-panel p-3 border border-slate-700/50 rounded-xl">
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter mb-1">Diagnosis</p>
                       <p className="text-sm text-slate-200 font-medium truncate">{result.diagnosis}</p>
                     </div>
                   )}
                 </>
              )}
            </div>

            <h3 className="text-lg font-bold mt-2 flex items-center gap-2">
               <Pill size={20} className="text-purple-400" />
               Identified Medicines
            </h3>

            <div className="flex flex-col gap-3">
              {result.medicines.map((med: any, idx: number) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={idx} 
                  className="glass-panel p-4 flex flex-col gap-3 border border-slate-700/50 hover:border-blue-500/30 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 border border-blue-500/10">
                        <Pill size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-100">{med.name}</h4>
                        <p className="text-xs text-slate-400">{med.dosage}</p>
                      </div>
                    </div>
                    {med.verified && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/10 rounded-full border border-blue-500/20">
                        <CheckCircle2 size={10} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-400 uppercase">Verified</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Timing</p>
                       <p className="text-xs text-slate-300 font-medium">{med.timing}</p>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                       <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Duration</p>
                       <p className="text-xs text-slate-300 font-medium">{med.duration || "As prescribed"}</p>
                    </div>
                  </div>

                  {med.instructions && med.instructions !== "null" && med.instructions !== "None" && (
                    <div className="mt-1 p-2 bg-blue-500/5 rounded-lg border border-blue-500/10">
                       <p className="text-[10px] text-blue-400 uppercase font-bold tracking-tighter mb-0.5">Instructions</p>
                       <p className="text-xs text-slate-300 font-medium">{med.instructions}</p>
                    </div>
                  )}

                  {med.verified && med.warnings && (
                    <div className="mt-2 flex items-start gap-2 p-2 bg-orange-500/5 rounded-lg border border-orange-500/10">
                       <Info size={14} className="text-orange-400 shrink-0 mt-0.5" />
                       <p className="text-[10px] text-orange-200/70 leading-tight line-clamp-2">
                         {med.warnings}
                       </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
               <div className="flex items-center gap-2 mb-2 text-rose-400">
                 <AlertCircle size={16} />
                 <span className="text-xs font-bold uppercase tracking-wider">Medical Disclaimer</span>
               </div>
               <p className="text-[11px] text-slate-400 leading-relaxed">
                 {result.disclaimer}
               </p>
            </div>
          </div>
          
          <div className="flex gap-4 mt-auto">
            <button 
              onClick={resetScanner}
              className="glass-panel py-3 flex-1 text-center hover:bg-slate-800 transition-colors font-bold text-sm"
            >
              Scan Another
            </button>
            <Link 
              href="/medicines"
              className="glass-button py-3 flex-1 text-center font-bold text-sm"
            >
              View Library
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
}
