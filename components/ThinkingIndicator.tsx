import React from 'react';
import { BrainCircuit } from 'lucide-react';

const ThinkingIndicator: React.FC = () => {
  return (
    <div className="flex items-center space-x-3 text-indigo-400 animate-pulse p-4 bg-indigo-950/30 rounded-lg border border-indigo-500/30">
      <BrainCircuit className="w-6 h-6 animate-spin-slow" />
      <span className="text-sm font-medium">AI is thinking deeply...</span>
    </div>
  );
};

export default ThinkingIndicator;