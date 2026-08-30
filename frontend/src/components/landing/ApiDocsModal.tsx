import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import ContentModal from './ContentModal';

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
    <ContentModal
      isOpen={true}
      onClose={onClose}
      title="CargoGo Developer Hub"
      maxWidth="max-w-lg"
      badge={<span className="px-2 py-0.5 text-xs font-black text-[#09121F] bg-white rounded">API</span>}
      subtitle="Integrate instant cargo quotes and live tracking in your platform. Use the API token below to get started."
    >
      <div className="space-y-1">
        <label className="text-[10px] uppercase font-bold text-slate-400">Sandbox API Key</label>
        <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-md">
          <code className="text-xs text-indigo-300 select-all overflow-x-auto whitespace-nowrap flex-1">
            cg_live_9f2a41d8e92c4b8b8f2d
          </code>
          <button 
            onClick={handleCopyApiKey}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold text-slate-400">Quote Generation Endpoint</label>
        <pre className="p-3 text-[11px] font-mono bg-slate-950 border border-slate-800 text-slate-300 rounded-md overflow-x-auto leading-relaxed">
          {`POST https://api.cargogo.in/v1/quote
Authorization: Bearer cg_live_9f2a41d...
{
  "pickup": [19.0760, 72.8777],
  "dropoff": [19.2183, 72.9781],
  "weightKg": 450,
  "vehicleType": "MINI_TEMPO"
}`}
        </pre>
      </div>
      <div className="text-center pt-2">
        <a 
          href="https://github.com/aadi17-arch/cargogo" 
          target="_blank" 
          rel="noreferrer"
          className="text-xs text-indigo-400 hover:underline font-semibold"
        >
          View Full API Reference Documentation →
        </a>
      </div>
    </ContentModal>
  );
}
