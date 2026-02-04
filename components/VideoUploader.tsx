
import React, { useRef, useState } from 'react';

interface Props {
  onProcess: (frames: string[], videoUrl: string) => void;
  isAnalyzing: boolean;
}

const VideoUploader: React.FC<Props> = ({ onProcess, isAnalyzing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loadingMsg, setLoadingMsg] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.src = videoUrl;
    video.load();

    setLoadingMsg("Optimizing video data...");

    video.onloadedmetadata = async () => {
      const frames: string[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const duration = video.duration;
      // Capture 5 key frames for a balanced payload
      const capturePoints = [0.2, 0.4, 0.6, 0.8, 0.95];

      for (const point of capturePoints) {
        video.currentTime = duration * point;
        await new Promise((r) => {
          const onSeek = () => {
            // Downscale slightly for faster API transmission
            const scale = Math.min(1, 1080 / Math.max(video.videoWidth, video.videoHeight));
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
            ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
            frames.push(canvas.toDataURL('image/jpeg', 0.65));
            video.removeEventListener('seeked', onSeek);
            r(true);
          };
          video.addEventListener('seeked', onSeek);
        });
      }

      setLoadingMsg("");
      onProcess(frames, videoUrl);
    };
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-10 bg-white rounded-[2.5rem] shadow-2xl border-4 border-dashed border-emerald-100 flex flex-col items-center justify-center text-center">
      <div className="mb-6 bg-emerald-50 p-8 rounded-full">
        <i className="fa-solid fa-camera-viewfinder text-6xl text-emerald-600"></i>
      </div>
      <h2 className="text-3xl font-black text-slate-800 mb-3">Structural Scan</h2>
      <p className="text-slate-500 mb-10 px-6 text-lg">
        Please upload a video showing the damage. Hold the camera steady and get close to cracks or water lines.
      </p>

      {isAnalyzing ? (
        <div className="flex flex-col items-center py-4">
          <div className="relative">
            <div className="w-20 h-20 border-8 border-emerald-100 rounded-full"></div>
            <div className="w-20 h-20 border-8 border-emerald-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-emerald-700 font-bold mt-6 text-xl animate-pulse">{loadingMsg || "Assessing Damage..."}</p>
          <p className="text-slate-400 text-sm mt-2">Consulting UN structural databases...</p>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-6 px-14 rounded-3xl transition-all transform hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-4 text-xl"
        >
          <i className="fa-solid fa-video"></i>
          Start Analysis
        </button>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
      />
      
      <div className="mt-12 grid grid-cols-2 gap-8">
        <div className="flex flex-col items-center gap-2 opacity-50">
          <i className="fa-solid fa-cloud-bolt text-slate-400 text-2xl"></i>
          <span className="text-[10px] font-bold uppercase tracking-widest">Cloud Verified</span>
        </div>
        <div className="flex flex-col items-center gap-2 opacity-50">
          <i className="fa-solid fa-lock text-slate-400 text-2xl"></i>
          <span className="text-[10px] font-bold uppercase tracking-widest">Data Secure</span>
        </div>
      </div>
    </div>
  );
};

export default VideoUploader;
