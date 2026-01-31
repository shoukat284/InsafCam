
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
  });

  const handleProcessVideo = async (frames: string[], videoUrl: string) => {
    setState(prev => ({ ...prev, isAnalyzing: true, videoPreviewUrl: videoUrl, error: null }));
    
    try {
      const assessment = await analyzeVideoFrames(frames);
      setState(prev => ({ ...prev, assessment, isAnalyzing: false }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: "Failed to analyze video. Please check your internet connection and try again." 
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
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Navbar */}
      <nav className="bg-emerald-700 text-white py-4 px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-lg">
              <i className="fa-solid fa-camera-retro text-emerald-700 text-xl"></i>
            </div>
            <h1 className="text-2xl font-black tracking-tight">INSAF<span className="text-emerald-300">CAM</span></h1>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-semibold opacity-90">
            <span className="flex items-center gap-1"><i className="fa-solid fa-circle-check"></i> UN Expert Mode</span>
            <span className="flex items-center gap-1"><i className="fa-solid fa-language"></i> Urdu / English</span>
          </div>
          <button onClick={handleReset} className="text-xs bg-emerald-600 hover:bg-emerald-500 px-3 py-1 rounded-md transition-colors">
            Reset
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 mt-12">
        {/* Intro Header */}
        {!state.assessment && !state.isAnalyzing && (
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Flood Damage Assistance</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              Empowering communities with AI-driven disaster assessments. 
              Upload a video of your damaged home to generate an official NDMA claim form 
              and a voiced summary in your local language.
            </p>
          </div>
        )}

        {state.error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg flex items-center gap-3">
            <i className="fa-solid fa-circle-exclamation text-xl"></i>
            <p>{state.error}</p>
          </div>
        )}

        {!state.assessment ? (
          <VideoUploader onProcess={handleProcessVideo} isAnalyzing={state.isAnalyzing} />
        ) : (
          <AssessmentResults assessment={state.assessment} onReset={handleReset} />
        )}
      </main>

      {/* Footer Info */}
      <footer className="mt-20 border-t border-slate-200 py-10 text-center text-slate-400 text-sm">
        <div className="flex justify-center gap-6 mb-4">
          <i className="fa-brands fa-un"></i>
          <span>Pakistan Disaster Response Initiative</span>
        </div>
        <p>&copy; 2024 InsafCam - UN Disaster Assessment System</p>
      </footer>
    </div>
  );
};

export default App;
