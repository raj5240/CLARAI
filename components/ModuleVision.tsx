import React, { useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, X, Sparkles, Loader2 } from 'lucide-react';
import { VisionState } from '../types';
import { analyzeImage } from '../services/gemini';
import ReactMarkdown from 'react-markdown';

const ModuleVision: React.FC = () => {
  const [state, setState] = useState<VisionState>({
    image: null,
    imageBase64: null,
    prompt: '',
    response: null,
    isLoading: false,
  });

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setState(prev => ({
        ...prev,
        image: file,
        imageBase64: base64String,
        response: null // Clear previous response on new image
      }));
    };
    reader.readAsDataURL(file);
  }, []);

  const handleClearImage = () => {
    setState(prev => ({ ...prev, image: null, imageBase64: null, response: null }));
  };

  const handleAnalyze = async () => {
    if (!state.imageBase64 || state.isLoading) return;

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Extract pure base64 data from data URL
      const base64Data = state.imageBase64.split(',')[1];
      const mimeType = state.imageBase64.split(';')[0].split(':')[1];

      const responseText = await analyzeImage(base64Data, mimeType, state.prompt);
      setState(prev => ({ ...prev, response: responseText }));
    } catch (error) {
      setState(prev => ({ ...prev, response: "Error analyzing image. Please try again." }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Left: Input Side */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 flex-1 flex flex-col">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
            <ImageIcon className="w-6 h-6 text-emerald-400" />
            Vision Analyst
          </h2>

          {/* Image Upload Area */}
          <div className="flex-1 flex flex-col justify-center min-h-[300px] bg-gray-950 rounded-xl border-2 border-dashed border-gray-800 relative overflow-hidden transition-all hover:border-gray-700">
            {state.imageBase64 ? (
              <div className="relative w-full h-full flex items-center justify-center bg-black/50">
                <img
                  src={state.imageBase64}
                  alt="Uploaded preview"
                  className="max-h-full max-w-full object-contain p-4"
                />
                <button
                  onClick={handleClearImage}
                  className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-red-600/80 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-full cursor-pointer group">
                <div className="p-4 bg-gray-900 rounded-full mb-4 group-hover:bg-gray-800 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-300 font-medium">Click to upload an image</p>
                <p className="text-gray-500 text-sm mt-2">JPG, PNG, WebP supported</p>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            )}
          </div>

          {/* Prompt Input */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-400 mb-2">Ask about the image (optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={state.prompt}
                onChange={(e) => setState(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="e.g., What is unusual about this scene?"
                className="flex-1 bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              />
              <button
                onClick={handleAnalyze}
                disabled={!state.imageBase64 || state.isLoading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {state.isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                Analyze
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Output Side */}
      <div className="flex-1 bg-gray-900 rounded-2xl border border-gray-800 p-6 overflow-y-auto max-h-full">
        <h3 className="text-lg font-medium text-gray-300 mb-4">Analysis Results</h3>
        {state.response ? (
           <div className="prose prose-invert prose-emerald max-w-none">
            <ReactMarkdown>{state.response}</ReactMarkdown>
           </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 flex-col gap-3">
            <Sparkles className="w-12 h-12 opacity-20" />
            <p>Upload an image and ask a question to see AI insights here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModuleVision;