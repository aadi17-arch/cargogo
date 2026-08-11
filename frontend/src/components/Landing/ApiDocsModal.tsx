import { useState } from 'react';
import { X, Check, Copy } from 'lucide-react';

interface ApiDocsModalProps {
  onClose: () => void;
}

export default function ApiDocsModal({ onClose }: ApiDocsModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText('cg_live_9f2a41d8e92c4b8b8f2d');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-xl text-white shadow-2xl space-y-4">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors bg-transparent border-0 cursor-pointer"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 text-xs font-black text-[#09121F] bg-white rounded">API</span>
          <h3 className="text-lg font-bold">CargoGo Developer Hub</h3>
        </div>
        <p className="text-xs text-slate-300">
          Integrate instant cargo quotes and live tracking in your platform. Use the API token below to get started.
        </p>
        <div className="space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400">Sandbox API Key</label>
          <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-md">
            <code className="text-xs text-indigo-300 select-all overflow-x-auto whitespace-nowrap flex-1">
              cg_live_9f2a41d8e92c4b8b8f2d
            </code>
            <button 
              onClick={handleCopyApiKey}
              className="p-1 hover:bg-slate-850 rounded transition-colors text-slate-400 hover:text-white bg-transparent border-0 cursor-pointer"
              title="Copy API Key"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-400">Sample request</span>
          <pre className="p-3 bg-slate-950 rounded-md text-slate-300 text-[10px] overflow-x-auto font-mono">
{`curl -X POST https://api.cargogo.com/v1/quotes \\
  -H "Authorization: Bearer cg_live_9f2a41d8e92c4b8b8f2d" \\
  -H "Content-Type: application/json" \\
  -d '{
    "weightKg": 150,
    "distanceKm": 45,
    "vehicle": "PICKUP_TRUCK"
  }'`}
          </pre>
        </div>
      </div>
    </div>
  );
}
