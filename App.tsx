
import React, { useState } from 'react';
import VideoUploader from './components/VideoUploader';
import AssessmentResults from './components/AssessmentResults';
import { analyzeVideoFrames } from './services/geminiService';
import { AppState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isAnalyzing: false,
    isGeneratingAudio: false,
    videoPreviewUrl: null,
    assessment: null,
    error: null,
    audioBlob: null,
    isLiveMode: false,
  });

  const getUserLocation = (): Promise<{latitude: number, longitude: number} | undefined> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) return resolve(undefined);
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve(undefined),
        { timeout: 8000 }
      );
    });
  };

  const handleProcessVideo = async (frames: string[], videoUrl: string) => {
    setState(prev => ({ ...prev, isAnalyzing: true, videoPreviewUrl: videoUrl, error: null }));
    
    try {
      const location = await getUserLocation();
      const assessment = await analyzeVideoFrames(frames, location);
      
      if (!assessment || (!assessment.isClear && !assessment.structuralDamages?.length)) {
        throw new Error("Visuals too unclear. Please film closer to the damage.");
      }

      setState(prev => ({ ...prev, assessment, isAnalyzing: false }));
    } catch (err: any) {
      console.error("Analysis Error:", err);
      const userFriendlyMsg = err.message?.includes("Specialist format") 
        ? "AI Specialist processing error. Please try a different video clip."
        : err.message || "Connection timed out. Please try again with a shorter video.";
        
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: userFriendlyMsg 
      }));
    }
  };

  const handleReset = () => {
    setState({
      isAnalyzing: false,
      isGeneratingAudio: false,
      videoPreviewUrl: null,
      assessment: null,
      error: null,
      audioBlob: null,
      isLiveMode: false,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 selection:bg-emerald-100">
      <nav className="bg-emerald-700 text-white py-4 px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={handleReset}>
            <div className="bg-white p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-md">
              <i className="fa-solid fa-house-chimney-crack text-emerald-700 text-xl"></i>
            </div>
            <h1 className="text-2xl font-black tracking-tight">INSAF<span className="text-emerald-300">CAM</span></h1>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-4 text-xs font-bold uppercase tracking-widest opacity-80">
                <span className="bg-emerald-800 px-3 py-1 rounded-full border border-emerald-600">UN-ID: PD-2024</span>
                <span className="bg-emerald-800 px-3 py-1 rounded-full border border-emerald-600 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span> V2.5-GROUNDED
                </span>
             </div>
             <button onClick={handleReset} className="bg-emerald-600 hover:bg-emerald-500 w-10 h-10 rounded-full flex items-center justify-center transition-all hover:rotate-180">
               <i className="fa-solid fa-rotate-left"></i>
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-12">
        {!state.assessment && !state.isAnalyzing && (
          <div className="text-center mb-12 animate-in fade-in duration-700">
            <h2 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Rebuilding Lives with<br/>
              <span className="text-emerald-600 underline decoration-emerald-200 decoration-8 underline-offset-8">AI Accuracy.</span>
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-xl leading-relaxed">
              Upload a video of flood damage to generate an <b>NDMA Claim Form</b>, 
              get verified market rates for repairs, and find the nearest relief camps instantly.
            </p>
          </div>
        )}

        {state.error && (
          <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 text-red-700 rounded-3xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 shadow-sm">
            <div className="bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-bolt"></i>
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">{state.error}</p>
              <p className="text-sm opacity-80 mt-1">Check camera quality and try a shorter, clearer video (5-10 seconds).</p>
            </div>
          </div>
        )}

        {!state.assessment ? (
          <VideoUploader onProcess={handleProcessVideo} isAnalyzing={state.isAnalyzing} />
        ) : (
          <AssessmentResults assessment={state.assessment} onReset={handleReset} />
        )}
      </main>

      <footer className="mt-32 border-t border-slate-200 py-16 text-center">
        <div className="flex justify-center items-center gap-8 mb-8 opacity-40 grayscale hover:grayscale-0 transition-all">
          <img src="https://www.un.org/sites/un2.un.org/files/un_logo_700.png" alt="UN" className="h-12" />
          <div className="h-8 w-px bg-slate-300"></div>
          <span className="font-black text-2xl italic tracking-tighter">NDMA-PK</span>
        </div>
        <p className="text-slate-400 text-sm font-medium tracking-wide uppercase">Engineering Resilient Futures • InsafCam 2024</p>
      </footer>
    </div>
  );
};

export default App;
