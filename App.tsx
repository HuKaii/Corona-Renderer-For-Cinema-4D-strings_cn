import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Header from './components/Header';
import UploadArea from './components/UploadArea';
import StringTable from './components/StringTable';
import FileList from './components/FileList';
import SettingsModal from './components/SettingsModal';
import { parseStrFile, toUnicodeEscape, generateZip, downloadFile, generateFileContent } from './services/parserService';
import { translateBatch } from './services/geminiService';
import { translateBatchOpenAI } from './services/openaiService';
import { FileDocument, AISettings } from './types';
import { Play, Download, RefreshCw, Trash2, Package, FileText, CheckSquare, Square, Wand2 } from 'lucide-react';

const DEFAULT_SETTINGS: AISettings = {
  provider: 'gemini',
  apiKey: process.env.API_KEY || '',
  baseUrl: 'https://api.deepseek.com',
  modelName: 'gemini-2.5-flash',
  concurrency: 5,
  batchSize: 14
};

function App() {
  const [files, setFiles] = useState<FileDocument[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [globalProgress, setGlobalProgress] = useState({ current: 0, total: 0 });
  
  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem('corona_localizer_settings');
    if (!saved) return DEFAULT_SETTINGS;
    try {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        concurrency: typeof parsed.concurrency === 'number' && parsed.concurrency > 0 ? parsed.concurrency : DEFAULT_SETTINGS.concurrency,
        batchSize: typeof parsed.batchSize === 'number' && parsed.batchSize > 0 ? parsed.batchSize : DEFAULT_SETTINGS.batchSize,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Save settings to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('corona_localizer_settings', JSON.stringify(aiSettings));
  }, [aiSettings]);

  // 计算选中的文件 (Active for editing)
  const activeFile = useMemo(() => 
    files.find(f => f.id === selectedFileId), 
    [files, selectedFileId]
  );

  // 全局统计
  const globalStats = useMemo(() => {
    return files.reduce((acc, curr) => ({
      total: acc.total + curr.stats.total,
      translated: acc.translated + curr.stats.translated,
      chars: acc.chars + curr.stats.chars,
    }), { total: 0, translated: 0, chars: 0 });
  }, [files]);

  // 处理文件上传 (支持多文件)
  const handleFilesLoaded = useCallback(async (uploadedFiles: File[]) => {
    const newFiles: FileDocument[] = [];
    
    for (const file of uploadedFiles) {
      // 简单过滤
      if (!file.name.match(/\.(str|txt|res)$/i)) continue;

      const content = await file.text();
      const parsedEntries = parseStrFile(content);
      
      const activeEntries = parsedEntries.filter(e => !e.isCommentOrEmpty);
      
      // 默认进行一次智能选择：如果看起来像英文且没翻译，就选中
      // 如果已经从 parser 获得翻译 (isAlreadyTranslated)，则不勾选
      const entriesWithAutoSelection = parsedEntries.map(e => {
        if (e.isCommentOrEmpty || e.status === 'done') return e;
        const isEnglish = !/[\u4e00-\u9fa5]/.test(e.value);
        return { ...e, isSelected: isEnglish && e.value.trim().length > 0 };
      });

      const translatedCount = entriesWithAutoSelection.filter(e => e.translatedValue.length > 0).length;

      newFiles.push({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        path: (file.webkitRelativePath || file.name), // 尝试获取相对路径
        entries: entriesWithAutoSelection,
        stats: {
          total: activeEntries.length,
          translated: translatedCount,
          chars: activeEntries.reduce((acc, curr) => acc + curr.value.length, 0)
        },
        status: 'idle',
        isChecked: false
      });
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      // 如果之前没有选中文件，默认选中第一个新上传的
      if (!selectedFileId) {
        setSelectedFileId(newFiles[0].id);
      }
    }
  }, [selectedFileId]);

  // 侧边栏文件勾选逻辑
  const handleToggleFileCheck = useCallback((fileId: string, checked: boolean) => {
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, isChecked: checked } : f));
  }, []);

  // 条目勾选逻辑
  const handleToggleSelect = useCallback((ids: string[], isSelected: boolean) => {
    if (!selectedFileId) return;

    setFiles(prev => prev.map(f => {
      if (f.id === selectedFileId) {
        const newEntries = f.entries.map(e => {
          if (ids.includes(e.id)) {
            return { ...e, isSelected };
          }
          return e;
        });
        return { ...f, entries: newEntries };
      }
      return f;
    }));
  }, [selectedFileId]);

  // 智能选择逻辑
  const handleSmartSelect = useCallback(() => {
    if (!selectedFileId) return;
    setFiles(prev => prev.map(f => {
       if (f.id === selectedFileId) {
         const newEntries = f.entries.map(e => {
            if (e.isCommentOrEmpty) return e;
            // 规则：没有中文，且已翻译内容为空
            const hasChinese = /[\u4e00-\u9fa5]/.test(e.value);
            const isSelected = !hasChinese && !e.translatedValue && e.value.trim().length > 0;
            return { ...e, isSelected };
         });
         return { ...f, entries: newEntries };
       }
       return f;
    }));
  }, [selectedFileId]);

  // 全选/全不选
  const handleSelectAll = useCallback((select: boolean) => {
    if (!selectedFileId) return;
    setFiles(prev => prev.map(f => {
       if (f.id === selectedFileId) {
         const newEntries = f.entries.map(e => {
            if (e.isCommentOrEmpty) return e;
            return { ...e, isSelected: select };
         });
         return { ...f, entries: newEntries };
       }
       return f;
    }));
  }, [selectedFileId]);

  // 批量翻译逻辑 (处理所有文件中的已选项目)
  const handleStartSelectedTranslation = useCallback(async () => {
    if (!aiSettings.apiKey) {
      setIsSettingsOpen(true);
      alert("请先配置 API Key");
      return;
    }

    // 找出所有文件中有勾选项目的文件
    const filesToProcess = files.filter(f => f.entries.some(e => e.isSelected && !e.isCommentOrEmpty));
    
    if (filesToProcess.length === 0) {
        alert("请先勾选需要翻译的条目。");
        return;
    }

    setIsProcessing(true);
    
    // 计算总任务量用于进度条 (只计算勾选的)
    let totalItems = 0;
    filesToProcess.forEach(f => {
       totalItems += f.entries.filter(e => e.isSelected && !e.isCommentOrEmpty).length;
    });
    setGlobalProgress({ current: 0, total: totalItems });

    let processedCount = 0;

    for (const fileDoc of filesToProcess) {
      setFiles(prev => prev.map(f => f.id === fileDoc.id ? { ...f, status: 'processing' } : f));

      // 找出被勾选的条目
      const targetEntries = fileDoc.entries.filter(e => e.isSelected && !e.isCommentOrEmpty);

      const batchSize = Math.max(1, aiSettings.batchSize || DEFAULT_SETTINGS.batchSize);
      const concurrency = Math.max(1, aiSettings.concurrency || DEFAULT_SETTINGS.concurrency);

      const batches: typeof targetEntries[] = [];
      for (let i = 0; i < targetEntries.length; i += batchSize) {
        batches.push(targetEntries.slice(i, i + batchSize));
      }

      let batchIndex = 0;

      const worker = async () => {
        while (true) {
          const currentIndex = batchIndex++;
          if (currentIndex >= batches.length) break;

          const batch = batches[currentIndex];
          const textsToTranslate = batch.map(e => ({ id: e.id, text: e.value }));

          try {
            // 更新 Entry 状态为 translating
            setFiles(prev => prev.map(f => {
              if (f.id === fileDoc.id) {
                 const newEntries = f.entries.map(e => batch.find(b => b.id === e.id) ? { ...e, status: 'translating' as const } : e);
                 return { ...f, entries: newEntries };
              }
              return f;
            }));

            let results: Map<string, string>;
            
            if (aiSettings.provider === 'openai') {
              results = await translateBatchOpenAI(textsToTranslate, aiSettings);
            } else {
              results = await translateBatch(textsToTranslate, aiSettings);
            }

            // 更新结果
            setFiles(prev => prev.map(f => {
              if (f.id === fileDoc.id) {
                 const newEntries = f.entries.map(e => {
                   if (results.has(e.id)) {
                     const trans = results.get(e.id)!;
                     return {
                       ...e,
                       translatedValue: trans,
                       unicodeValue: toUnicodeEscape(trans),
                       status: 'done' as const,
                       isSelected: false // 翻译完后自动取消勾选
                     };
                   }
                   return e;
                 });
                 
                 const active = newEntries.filter(e => !e.isCommentOrEmpty);
                 const translated = active.filter(e => e.translatedValue.length > 0);
                 
                 return { 
                   ...f, 
                   entries: newEntries,
                   stats: { ...f.stats, translated: translated.length }
                 };
              }
              return f;
            }));

            processedCount += batch.length;
            setGlobalProgress(prev => ({ ...prev, current: processedCount }));

          } catch (err) {
            console.error(`Error translating file ${fileDoc.name}`, err);
            // 可以在这里处理错误状态显示，目前暂不处理
          }
        }
      };

      const workerCount = Math.min(concurrency, batches.length || 0);
      const workers = [];
      for (let i = 0; i < workerCount; i++) {
        workers.push(worker());
      }
      await Promise.all(workers);

      setFiles(prev => prev.map(f => f.id === fileDoc.id ? { ...f, status: 'completed' } : f));
    }

    setIsProcessing(false);
  }, [files, aiSettings]);

  // 手动更新单个条目
  const handleUpdateEntry = useCallback((entryId: string, newValue: string) => {
    if (!selectedFileId) return;

    setFiles(prev => prev.map(f => {
      if (f.id === selectedFileId) {
        const newEntries = f.entries.map(e => {
          if (e.id === entryId) {
            return {
              ...e,
              translatedValue: newValue,
              unicodeValue: toUnicodeEscape(newValue),
              status: 'done' as const
            };
          }
          return e;
        });
        
        const active = newEntries.filter(e => !e.isCommentOrEmpty);
        const translated = active.filter(e => e.translatedValue.length > 0);

        return {
          ...f,
          entries: newEntries,
          stats: { ...f.stats, translated: translated.length }
        };
      }
      return f;
    }));
  }, [selectedFileId]);

  // 导出逻辑 (支持导出勾选的文件，或者全部)
  const handleExport = useCallback(() => {
    if (files.length === 0) return;

    const checkedFiles = files.filter(f => f.isChecked);
    const filesToExport = checkedFiles.length > 0 ? checkedFiles : files;

    // 如果只有一个文件，直接下载 .str
    if (filesToExport.length === 1) {
      const file = filesToExport[0];
      const content = generateFileContent(file.entries);
      const newName = file.name.replace(/(\.[\w\d]+)$/i, '$1');
      downloadFile(newName, content);
    } else {
      // 多个文件，打包 ZIP
      generateZip(filesToExport);
    }
  }, [files]);

  // 删除逻辑 (支持删除勾选的文件)
  const handleDelete = useCallback(() => {
    const checkedFiles = files.filter(f => f.isChecked);
    
    if (checkedFiles.length > 0) {
        if (window.confirm(`确定要删除选中的 ${checkedFiles.length} 个文件吗？`)) {
            setFiles(prev => prev.filter(f => !f.isChecked));
            // 如果当前选中的文件被删除了，重置选中状态
            if (checkedFiles.some(f => f.id === selectedFileId)) {
                setSelectedFileId(null);
            }
        }
    } else if (files.length > 0) {
        if (window.confirm("确定要清空所有文件和进度吗？")) {
            setFiles([]);
            setSelectedFileId(null);
        }
    }
  }, [files, selectedFileId]);

  return (
    <div className="h-screen flex flex-col font-sans selection:bg-corona-500 selection:text-white overflow-hidden">
      <Header onOpenSettings={() => setIsSettingsOpen(true)} />
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={aiSettings}
        onSave={setAiSettings}
      />
      
      {files.length === 0 ? (
        <main className="flex-grow flex flex-col items-center justify-center p-4 overflow-auto">
             <div className="max-w-2xl w-full text-center space-y-6">
                 <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-500 tracking-tight">
                   C4D 插件本地化工作台
                 </h2>
                 <p className="text-gray-400 text-lg">
                   专为 Corona Renderer 及其他 Cinema 4D 插件设计。支持批量文件、文件夹上传，AI 智能翻译并自动进行 Unicode 转码。
                 </p>
                 <UploadArea onFilesLoaded={handleFilesLoaded} />
                 
                 <div className="mt-8 pt-4 border-t border-gray-800">
                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className="text-gray-500 hover:text-corona-500 text-sm flex items-center justify-center mx-auto transition-colors"
                    >
                      <Wand2 className="w-4 h-4 mr-2" />
                      配置 API 设置 (Gemini / DeepSeek / OpenAI)
                    </button>
                 </div>
             </div>
        </main>
      ) : (
        <div className="flex-grow flex overflow-hidden">
           {/* Sidebar */}
           <FileList 
              files={files} 
              selectedFileId={selectedFileId} 
              onSelectFile={setSelectedFileId} 
              onToggleFileCheck={handleToggleFileCheck}
           />

           {/* Main Content */}
           <main className="flex-1 flex flex-col bg-gray-950 min-w-0">
              
              {/* Main Toolbar */}
              <div className="bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between shrink-0 z-20 shadow-sm">
                 <div className="flex items-center space-x-6">
                    <div className="flex flex-col">
                       <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">全局进度</span>
                       <div className="flex items-baseline space-x-1">
                          <span className="text-xl font-bold text-white">{globalStats.translated}</span>
                          <span className="text-sm text-gray-500">/ {globalStats.total} 条字段</span>
                       </div>
                    </div>
                    {/* Global Progress Bar */}
                    {globalStats.total > 0 && (
                      <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-corona-600 to-corona-400 transition-all duration-300"
                          style={{ width: `${(globalStats.translated / globalStats.total) * 100}%` }}
                        />
                      </div>
                    )}
                 </div>

                 <div className="flex items-center space-x-3">
                    <button 
                      onClick={handleDelete}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                      title={files.some(f => f.isChecked) ? "删除选中文件" : "清空所有"}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>

                    <div className="h-6 w-px bg-gray-700 mx-2"></div>

                    <button
                      onClick={handleStartSelectedTranslation}
                      disabled={isProcessing}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                        isProcessing 
                          ? 'bg-gray-800 text-gray-400 cursor-wait' 
                          : 'bg-corona-600 hover:bg-corona-500 text-white shadow-lg shadow-corona-600/20'
                      }`}
                    >
                       {isProcessing ? (
                         <RefreshCw className="w-4 h-4 animate-spin" />
                       ) : (
                         <Play className="w-4 h-4 fill-current" />
                       )}
                       <span>
                         {isProcessing 
                           ? `翻译中 (${globalProgress.current}/${globalProgress.total})` 
                           : '翻译已选项目'}
                       </span>
                    </button>

                    <button
                      onClick={handleExport}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all border ${
                         files.length === 0
                         ? 'border-gray-700 text-gray-600 cursor-not-allowed'
                         : 'border-gray-600 hover:bg-gray-800 text-gray-200 hover:border-gray-500 hover:text-white'
                      }`}
                    >
                       {files.filter(f => f.isChecked).length > 1 || (!files.some(f => f.isChecked) && files.length > 1) ? <Package className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                       <span>{files.some(f => f.isChecked) ? '导出选中' : (files.length > 1 ? '全部打包' : '导出文件')}</span>
                    </button>
                 </div>
              </div>

              {/* Editor Area */}
              <div className="flex-1 bg-gray-950 p-6 relative flex flex-col overflow-hidden">
                 {activeFile ? (
                   <div className="animate-in fade-in duration-300 flex-1 flex flex-col h-full overflow-hidden">
                      {/* File Header & Selection Toolbar */}
                      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
                         <div className="flex items-center overflow-hidden">
                            <h3 className="text-lg font-medium text-white flex items-center whitespace-nowrap mr-3">
                               <FileText className="w-5 h-5 mr-2 text-corona-500" />
                               {activeFile.name}
                            </h3>
                            <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800 font-mono truncate max-w-[200px]" title={activeFile.path}>
                               {activeFile.path || activeFile.name}
                            </span>
                         </div>
                         
                         <div className="flex items-center space-x-2 text-xs">
                            <button 
                               onClick={() => handleSelectAll(true)}
                               className="flex items-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition-colors"
                            >
                               <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                               全选
                            </button>
                            <button 
                               onClick={() => handleSelectAll(false)}
                               className="flex items-center px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition-colors"
                            >
                               <Square className="w-3.5 h-3.5 mr-1.5" />
                               全不选
                            </button>
                            <button 
                               onClick={handleSmartSelect}
                               className="flex items-center px-3 py-1.5 bg-corona-900/30 hover:bg-corona-900/50 text-corona-400 border border-corona-900/50 rounded transition-colors"
                               title="勾选所有未翻译的英文条目"
                            >
                               <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                               智能选择 (未翻译)
                            </button>
                         </div>
                      </div>

                      <StringTable 
                        entries={activeFile.entries} 
                        onUpdateEntry={handleUpdateEntry}
                        onToggleSelect={handleToggleSelect}
                      />
                   </div>
                 ) : (
                   <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <FileText className="w-16 h-16 mb-4 opacity-20" />
                      <p>请在左侧选择一个文件开始编辑</p>
                   </div>
                 )}
              </div>
           </main>
        </div>
      )}
    </div>
  );
}

export default App;
