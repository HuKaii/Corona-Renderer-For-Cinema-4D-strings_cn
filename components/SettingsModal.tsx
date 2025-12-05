import React, { useEffect, useState } from 'react';
import { AISettings, AIProvider } from '../types';
import { Settings, X, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AISettings;
  onSave: (settings: AISettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState<AISettings>(settings);

  // 当外部 settings 变化或打开时重置 form
  useEffect(() => {
    if (isOpen) {
        setFormData(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-2 text-white">
            <Settings className="w-5 h-5 text-corona-500" />
            <h2 className="text-lg font-semibold">API 设置</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">AI 供应商</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, provider: 'gemini', modelName: 'gemini-2.5-flash' })}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  formData.provider === 'gemini'
                    ? 'bg-corona-900/40 border-corona-500 text-corona-100'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                }`}
              >
                Google Gemini
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, provider: 'openai', baseUrl: 'https://api.deepseek.com', modelName: 'deepseek-chat' })}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  formData.provider === 'openai'
                    ? 'bg-blue-900/30 border-blue-500 text-blue-100'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
                }`}
              >
                OpenAI / DeepSeek
              </button>
            </div>
          </div>

          {/* Dynamic Fields */}
          <div className="space-y-4">
            
            {/* Base URL (Only for OpenAI) */}
            {formData.provider === 'openai' && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">API地址</label>
                <input
                  type="text"
                  value={formData.baseUrl}
                  onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://api.deepseek.com"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-corona-500 focus:border-corona-500 outline-none"
                />
                <p className="text-[10px] text-gray-500">例如: https://api.deepseek.com (无需 /v1/chat...)</p>
              </div>
            )}

            {/* API Key */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">
                API Key <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder={formData.provider === 'gemini' ? "AIzaSy..." : "sk-..."}
                required
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-corona-500 focus:border-corona-500 outline-none"
              />
            </div>

            {/* Model Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">模型名称</label>
              <input
                type="text"
                value={formData.modelName}
                onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                placeholder={formData.provider === 'gemini' ? "gemini-2.5-flash" : "deepseek-chat"}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-corona-500 focus:border-corona-500 outline-none"
              />
            </div>

            {/* Concurrency */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">并发请求数</label>
              <input
                type="number"
                min={1}
                max={500}
                value={formData.concurrency ?? 5}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setFormData({
                    ...formData,
                    concurrency: Number.isFinite(v) && v > 0 ? v : 1,
                  });
                }}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-corona-500 focus:border-corona-500 outline-none"
              />
              <p className="text-[10px] text-gray-500">控制同一时间发起的并行请求数量，例如 10 表示最多同时 10 个请求。</p>
            </div>

            {/* Batch Size */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">单请求条数</label>
              <input
                type="number"
                min={1}
                max={100}
                value={formData.batchSize ?? 14}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setFormData({
                    ...formData,
                    batchSize: Number.isFinite(v) && v > 0 ? v : 1,
                  });
                }}
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-corona-500 focus:border-corona-500 outline-none"
              />
              <p className="text-[10px] text-gray-500">单次请求中包含的待翻译条目数量，例如 14 表示一次请求处理 14 条。</p>
            </div>

          </div>

          <div className="pt-2">
             <button
               type="submit"
               className="w-full flex items-center justify-center space-x-2 bg-corona-600 hover:bg-corona-500 text-white font-medium py-2.5 rounded-lg transition-colors shadow-lg shadow-corona-900/20"
             >
               <Save className="w-4 h-4" />
               <span>保存配置</span>
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
