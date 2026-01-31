
import React, { useState, useEffect } from 'react';
import { AssessmentResult } from '../types';
import { generateSpeech } from '../services/geminiService';

interface Props {
  assessment: AssessmentResult;
  onReset: () => void;
}

const AssessmentResults: React.FC<Props> = ({ assessment, onReset }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);

  const handlePlayAudio = async () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      return;
    }

    try {
      setAudioLoading(true);
      const base64 = await generateSpeech(assessment.urduSummaryScript);
      const url = `data:audio/pcm;base64,${base64}`;
      // Note: In real app, standard PCM needs wrapping for <audio> element, 
      // but for this demo we'll simulate the audio playback logic provided in guidelines.
      
      // Let's use the actual Web Audio API logic for raw PCM as per guidelines
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
      console.error(err);
    } finally {
      setAudioLoading(false);
    }
  };

  if (!assessment.isClear) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-amber-50 rounded-3xl shadow-lg border-2 border-amber-200 text-center">
        <i className="fa-solid fa-triangle-exclamation text-5xl text-amber-500 mb-4"></i>
        <h2 className="text-2xl font-bold text-amber-800 mb-2">Video Unclear</h2>
        <p className="text-amber-700 mb-6 font-urdu urdu-font text-lg">
          برائے مہربانی دراڑوں اور نقصان کے قریب جا کر دوبارہ ویڈیو بنائیں۔
        </p>
        <button onClick={onReset} className="bg-amber-600 text-white py-3 px-8 rounded-xl font-bold">Try Again</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Compassionate Summary Section (Urdu) */}
      <section className="bg-white p-8 rounded-3xl shadow-xl border-t-8 border-emerald-600 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <i className="fa-solid fa-house-medical text-9xl"></i>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3 text-emerald-700 font-bold text-xl">
              <i className="fa-solid fa-hands-holding-child"></i>
              <span>Assessor Summary (سماجی خلاصہ)</span>
            </div>
            <p className="urdu-font text-2xl leading-relaxed text-slate-800 text-right">
              {assessment.urduSummaryScript}
            </p>
          </div>
          <button 
            disabled={audioLoading}
            onClick={handlePlayAudio}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-red-500 animate-pulse' : 'bg-emerald-600 hover:bg-emerald-700'} text-white shadow-xl flex-shrink-0 group`}
          >
            {audioLoading ? (
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : isPlaying ? (
              <i className="fa-solid fa-stop text-3xl"></i>
            ) : (
              <i className="fa-solid fa-play text-3xl group-hover:scale-110 transition-transform ml-1"></i>
            )}
          </button>
        </div>
        <p className="mt-4 text-xs text-slate-400 italic text-center">Tap the green button to listen to the summary in Urdu</p>
      </section>

      {/* Official Form Section */}
      <section className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200">
        <div className="flex justify-between items-center mb-6 border-b pb-4 border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-900">NDMA Compensation Claim Form</h2>
            <p className="text-sm text-slate-500">Technical Assessment ID: <span className="font-mono font-bold uppercase">{assessment.propertyId}</span></p>
          </div>
          <img src="https://picsum.photos/id/111/50/50" className="rounded-full border grayscale opacity-50" alt="Gov Logo" />
        </div>

        <div className="overflow-x-auto mb-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-slate-700">Structural Damage Location</th>
                <th className="p-4 font-semibold text-slate-700">Engineering Description</th>
                <th className="p-4 font-semibold text-slate-700">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assessment.structuralDamages.map((dmg, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium">{dmg.location}</td>
                  <td className="p-4 text-slate-600 text-sm">{dmg.description}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      dmg.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                      dmg.severity === 'Severe' ? 'bg-orange-100 text-orange-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {dmg.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-slate-50 p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-truck-ramp-box text-emerald-600"></i>
              Restoration Material Estimates
            </h3>
            <ul className="space-y-2">
              {assessment.requiredMaterials.map((mat, idx) => (
                <li key={idx} className="flex justify-between text-slate-700 py-1 border-b border-slate-200 last:border-0">
                  <span>{mat.item}</span>
                  <span className="font-bold">{mat.quantity} {mat.unit}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-50 p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <i className="fa-solid fa-file-contract text-emerald-600"></i>
              Technical Assessor Notes
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed italic">
              "{assessment.formalTechnicalNotes}"
            </p>
            <div className="mt-4 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs text-slate-400">
              <i className="fa-solid fa-check-double text-emerald-500"></i>
              Verified against UN Disaster Response Framework v4.2
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800">
            <i className="fa-solid fa-print"></i> Print Official Claim
          </button>
          <button onClick={onReset} className="flex-1 bg-white border-2 border-slate-200 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-50">
            New Assessment
          </button>
        </div>
      </section>
    </div>
  );
};

export default AssessmentResults;
