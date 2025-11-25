import React, { useState } from 'react';
import { Palette, Wand2, Download, Loader2, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { ImagineState } from '../types';
import { generateImage } from '../services/gemini';

const ModuleImagine: React.FC = () => {
  const [state, setState] = useState<ImagineState>({
    prompt: '',
    generatedImageUrl: null,
    isLoading: false,
  });
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!state.prompt.trim() || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true, generatedImageUrl: null }));
    setError(null);

    try {
      const imageUrl = await generateImage(state.prompt);
      setState(prev => ({ ...prev, generatedImageUrl: imageUrl }));
    } catch (err: any) {
      // Basic error handling to show user something went wrong
      setError(err.message || "Failed to generate image. It might be due to safety filters or high demand.");
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 max-w-5xl mx-auto">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3 mb-3">
          <Palette className="w-8 h-8 text-pink-500" />
          Imagine
        </h2>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          Turn your words into high-quality visuals using Google's latest Imagen model. Describe what you want to see in detail.
        </p>

        <div className="relative max-w-3xl mx-auto">
          <textarea
            value={state.prompt}
            onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))}
            placeholder="A futuristic city with bioluminescent trees, cinematic lighting, hyper-realistic, 8k..."
            className="w-full h-32 bg-gray-950 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-600 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none resize-none transition-all"
          />
          <button
            onClick={handleGenerate}
            disabled={!state.prompt.trim() || state.isLoading}
            className="absolute bottom-4 right-4 px-6 py-2 bg-pink-600 hover:bg-pink-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-pink-900/20"
          >
            {state.isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate
              </>
            )}
          </button>
        </div>
         {error && (
            <div className="mt-4 p-3 bg-red-900/30 border border-red-800/50 text-red-200 rounded-lg flex items-center gap-2 text-sm max-w-3xl mx-auto text-left">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
      </div>

      {/* Output Area */}
      <div className="flex-1 min-h-[400px] bg-gray-900 rounded-2xl border border-gray-800 p-4 flex items-center justify-center relative overflow-hidden">
        {state.isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-24 h-24">
               <div className="absolute inset-0 rounded-full border-t-4 border-pink-500 animate-spin"></div>
               <div className="absolute inset-3 rounded-full border-t-4 border-indigo-500 animate-spin-slow"></div>
            </div>
            <p className="text-pink-300 animate-pulse">Dreaming up your image...</p>
          </div>
        ) : state.generatedImageUrl ? (
          <div className="relative w-full h-full flex items-center justify-center group">
            <img
              src={state.generatedImageUrl}
              alt="AI Generated"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <a
                href={state.generatedImageUrl}
                download={`imagine-${Date.now()}.jpg`}
                className="px-6 py-3 bg-white text-gray-900 rounded-full font-semibold flex items-center gap-2 hover:bg-gray-100 transform hover:scale-105 transition-all"
              >
                <Download className="w-5 h-5" />
                Download Image
              </a>
            </div>
          </div>
        ) : (
          <div className="text-gray-600 flex flex-col items-center">
            <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
            <p>Your imagination will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleImagine;