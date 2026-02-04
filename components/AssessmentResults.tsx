
import React, { useState, useEffect } from 'react';
import { AssessmentResult } from '../types';
import { generateSpeech } from '../services/geminiService';

interface Props {
  assessment: AssessmentResult;
  onReset: () => void;
}

const AssessmentResults: React.FC<Props> = ({ assessment, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [showPrintHint, setShowPrintHint] = useState(false);

  const handlePlayAudio = async () => {
    try {
      setAudioLoading(true);
      const base64 = await generateSpeech(assessment.urduSummaryScript);
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const decode = (base64: string) => {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        return bytes;
      };

      const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
        for (let channel = 0; channel < numChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
        return buffer;
      };

      const raw = decode(base64);
      const buffer = await decodeAudioData(raw, audioContext, 24000, 1);
      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.onended = () => setIsPlaying(false);
      setIsPlaying(true);
      source.start();
    } catch (err) {
      console.error("Audio playback error:", err);
    } finally {
      setAudioLoading(false);
    }
  };

  const handlePrint = () => {
    // 1. Set document title so the saved PDF has a professional filename
    const originalTitle = document.title;
    document.title = `NDMA_Claim_${assessment.propertyId || 'Report'}`;
    
    // 2. Show a brief hint to the user
    setShowPrintHint(true);
    
    // 3. Trigger print
    window.print();
    
    // 4. Cleanup
    setTimeout(() => {
      document.title = originalTitle;
      setShowPrintHint(false);
    }, 2000);
  };

  const getSafetyColor = (score: number) => {
    if (score < 40) return 'text-red-600 bg-red-100';
    if (score < 70) return 'text-amber-600 bg-amber-100';
    return 'text-emerald-600 bg-emerald-100';
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Visual Safety Gauge */}
      <div className={`safety-gauge p-6 rounded-3xl flex items-center justify-between border-2 shadow-sm ${getSafetyColor(assessment.safetyScore)} border-current opacity-90 no-print`}>
        <div className="flex items-center gap-4">
          <i className={`fa-solid text-4xl ${assessment.safetyScore < 40 ? 'fa-person-falling-burst' : assessment.safetyScore < 70 ? 'fa-triangle-exclamation' : 'fa-house-shield'}`}></i>
          <div>
            <h3 className="font-bold text-lg">Safety Status (حفاظتی صورتحال)</h3>
            <p className="text-sm font-medium uppercase tracking-wider">{assessment.safetyScore < 40 ? 'DANGER: DO NOT ENTER' : assessment.safetyScore < 70 ? 'CAUTION: RESTRICTED ACCESS' : 'SAFE FOR ENTRY'}</p>
          </div>
        </div>
        <div className="text-3xl font-black">{assessment.safetyScore}%</div>
      </div>

      {/* Primary Audio Summary Card */}
      <section className="audio-summary-card bg-white p-8 rounded-3xl shadow-xl border-t-8 border-emerald-600 flex flex-col md:flex-row items-center gap-6 no-print">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3 text-emerald-700 font-bold text-xl">
            <i className="fa-solid fa-microphone-lines animate-pulse"></i>
            <span>Voice Summary (سماجی خلاصہ)</span>
          </div>
          <div className="space-y-4">
            <p className="urdu-font text-3xl leading-relaxed text-slate-800 text-right dir-rtl">
              {assessment.urduSummaryScript}
            </p>
            {assessment.pashtoSummaryScript && (
              <p className="urdu-font text-2xl leading-relaxed text-slate-600 text-right dir-rtl border-t border-slate-100 pt-4">
                {assessment.pashtoSummaryScript}
              </p>
            )}
          </div>
        </div>
        <button 
          onClick={handlePlayAudio}
          className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-red-500 scale-110 shadow-red-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'} text-white shadow-2xl flex-shrink-0 group`}
          title="Play Audio Summary"
        >
          {audioLoading ? <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : 
           isPlaying ? <i className="fa-solid fa-square text-3xl"></i> : <i className="fa-solid fa-play text-4xl ml-1"></i>}
        </button>
      </section>

      {/* Official Claim Details - The "Generated Form" */}
      <section className="print-container bg-white p-10 rounded-3xl shadow-lg border border-slate-200 relative">
        <div className="absolute top-10 right-10 opacity-[0.03] pointer-events-none no-print">
          <i className="fa-solid fa-file-contract text-[15rem]"></i>
        </div>

        <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">NDMA Compensation Claim</h1>
            <p className="text-sm text-slate-500 font-bold flex items-center gap-2">
              Document ID: <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{assessment.propertyId}</span>
            </p>
            <p className="text-xs text-slate-400 font-medium">Verified by InsafCam AI • Disaster Response Framework</p>
          </div>
          <div className="text-right">
             <div className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Islamic Republic of Pakistan</div>
             <div className="font-black text-xl italic tracking-tighter text-slate-800 leading-none">NDMA-PDMA</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-10">
           <div>
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">I. Structural Damage Assessment</h3>
              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-4 text-xs font-bold uppercase text-slate-600">Location</th>
                      <th className="p-4 text-xs font-bold uppercase text-slate-600">Observation</th>
                      <th className="p-4 text-xs font-bold uppercase text-slate-600 text-center">Severity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assessment.structuralDamages.map((dmg, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-800">{dmg.location}</td>
                        <td className="p-4 text-slate-600 text-sm">{dmg.description}</td>
                        <td className="p-4 text-center">
                           <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${
                             dmg.severity === 'Critical' ? 'bg-red-50 text-red-700 border-red-200' : 
                             dmg.severity === 'Severe' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                             'bg-slate-50 text-slate-600 border-slate-200'
                           }`}>
                             {dmg.severity}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-10">
              <div>
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">II. Recommended Grant (Materials)</h3>
                 <div className="space-y-0.5">
                    {assessment.requiredMaterials.map((mat, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 border-b border-slate-100 text-sm group hover:bg-emerald-50 transition-colors rounded-lg">
                        <span className="font-semibold text-slate-700">{mat.item}</span>
                        <div className="text-right">
                           <div className="font-black text-slate-900">{mat.quantity} {mat.unit}</div>
                           <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter">{mat.estimatedPricePKR || 'Market Rate'}</div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-center">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                   <i className="fa-solid fa-user-gear"></i> Expert Technical Note
                 </h3>
                 <p className="text-sm text-slate-600 leading-relaxed italic border-l-4 border-emerald-500 pl-4 py-1">
                   "{assessment.formalTechnicalNotes}"
                 </p>
              </div>
           </div>
        </div>

        {/* Signature Area */}
        <div className="mt-20 pt-10 border-t border-slate-200 flex justify-between items-end">
           <div className="text-center">
              <div className="w-48 border-b-2 border-slate-900 mb-2"></div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Applicant Signature</p>
           </div>
           <div className="text-right space-y-2">
              <div className="flex items-center justify-end gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                 <i className="fa-solid fa-shield-check text-xs"></i>
                 <span className="text-[10px] font-black uppercase tracking-widest">InsafCam Verified Output</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold tracking-tight">Timestamp: {new Date().toLocaleString('en-PK')}</p>
           </div>
        </div>
      </section>

      {/* Grounding & Help Section */}
      <section className="bg-white p-8 rounded-3xl shadow-lg border border-blue-100 no-print">
        <h2 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-3">
          <div className="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
            <i className="fa-solid fa-map-location-dot"></i>
          </div>
          Submit Claim: Nearby Relief Points
        </h2>
        <div className="grid gap-4">
          {assessment.nearbyReliefCenters?.map((link, idx) => (
            <a key={idx} href={link.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-2xl border border-blue-100 transition-all group">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-200">
                  <i className="fa-solid fa-building-flag text-blue-600"></i>
                </div>
                <div>
                  <span className="font-bold text-blue-800 block">{link.title}</span>
                  <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Open for submissions</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform">
                <i className="fa-solid fa-arrow-up-right-from-square text-blue-300"></i>
              </div>
            </a>
          ))}
          {(!assessment.nearbyReliefCenters || assessment.nearbyReliefCenters.length === 0) && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-sm text-slate-500 italic">No relief centers identified via live search. Please take this printed form to your local Union Council office.</p>
            </div>
          )}
        </div>
      </section>

      {/* Form Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 no-print relative">
        <button 
          onClick={handlePrint} 
          className="flex-[2] bg-slate-900 text-white py-6 rounded-[2rem] font-black flex items-center justify-center gap-3 shadow-2xl hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-emerald-500 opacity-0 group-active:opacity-20 transition-opacity"></div>
          <i className="fa-solid fa-file-pdf text-xl"></i>
          Download / Print Official Claim
        </button>
        <button 
          onClick={onReset} 
          className="flex-1 bg-white border-2 border-slate-200 text-slate-600 py-6 rounded-[2rem] font-bold hover:bg-slate-50 transition-all"
        >
          Start New Scan
        </button>

        {showPrintHint && (
          <div className="absolute -top-16 left-0 right-0 text-center animate-bounce">
            <div className="bg-emerald-600 text-white px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-xl border-2 border-white">
              <i className="fa-solid fa-circle-info"></i>
              <span className="text-sm font-bold">Select "Save as PDF" in the destination dropdown</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center no-print">
        <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black">
          InsafCam System • Digital Justice Module v2.5
        </p>
      </div>
    </div>
  );
};

export default AssessmentResults;
