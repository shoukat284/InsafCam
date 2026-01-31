
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

    setLoadingMsg("Preparing video for analysis...");

    video.onloadedmetadata = async () => {
      const frames: string[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const duration = video.duration;
      // Capture 6 frames across the video
      const capturePoints = [0.1, 0.3, 0.5, 0.7, 0.9, 0.95];

      for (const point of capturePoints) {
        video.currentTime = duration * point;
        await new Promise((r) => {
          const onSeek = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx?.drawImage(video, 0, 0);
            frames.push(canvas.toDataURL('image/jpeg', 0.7));
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
    <div className="w-full max-w-2xl mx-auto p-8 bg-white rounded-3xl shadow-xl border-4 border-dashed border-emerald-100 flex flex-col items-center justify-center text-center">
      <div className="mb-6 bg-emerald-50 p-6 rounded-full">
        <i className="fa-solid fa-cloud-arrow-up text-5xl text-emerald-600"></i>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Upload Damage Video</h2>
      <p className="text-slate-500 mb-8 px-4">
        Please upload a clear video of your home's structural damage. 
        Focus on cracks, fallen roofs, and water marks.
      </p>

      {isAnalyzing ? (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-emerald-700 font-medium">{loadingMsg || "Analyzing structure..."}</p>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-10 rounded-2xl transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-3"
        >
          <i className="fa-solid fa-file-video"></i>
          Select Video
        </button>
      )}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
      />
      
      <div className="mt-8 flex gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-1">
          <i className="fa-solid fa-shield-halved"></i> UN Standard
        </div>
        <div className="flex items-center gap-1">
          <i className="fa-solid fa-building-columns"></i> NDMA Approved
        </div>
      </div>
    </div>
  );
};

export default VideoUploader;
