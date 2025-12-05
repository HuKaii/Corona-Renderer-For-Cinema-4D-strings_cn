import React from 'react';
import { FileDocument } from '../types';
import { FileText, CheckCircle2, Circle, Loader2, AlertCircle } from 'lucide-react';

interface FileListProps {
  files: FileDocument[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onToggleFileCheck: (id: string, checked: boolean) => void;
}

const FileList: React.FC<FileListProps> = ({ files, selectedFileId, onSelectFile, onToggleFileCheck }) => {
  return (
    <div className="w-64 flex-shrink-0 border-r border-gray-800 bg-gray-900/30 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          文件列表 ({files.length})
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {files.map((file) => {
          const isSelected = file.id === selectedFileId;
          const isDone = file.stats.translated === file.stats.total && file.stats.total > 0;
          
          return (
            <div 
              key={file.id}
              className={`group w-full flex items-center p-2 rounded-md text-sm transition-all ${
                isSelected 
                  ? 'bg-corona-900/20 border border-corona-900/50' 
                  : 'hover:bg-gray-800 border border-transparent'
              }`}
            >
              
              <button
                onClick={() => onSelectFile(file.id)}
                className="flex-1 flex items-center min-w-0 text-left"
              >
                  <div className={`mr-2 flex-shrink-0 ${isSelected ? 'text-corona-400' : 'text-gray-400'}`}>
                     {file.status === 'processing' ? (
                       <Loader2 className="w-4 h-4 animate-spin text-corona-500" />
                     ) : isDone ? (
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                     ) : (
                       <FileText className="w-4 h-4" />
                     )}
                  </div>
                  
                  <div className="flex-1 truncate">
                    <div className={`truncate font-medium ${isSelected ? 'text-corona-100' : 'text-gray-300'}`}>{file.name}</div>
                    <div className="text-[10px] text-gray-500 flex justify-between mt-0.5">
                       <span>{file.stats.translated}/{file.stats.total}</span>
                       {file.path && file.path !== file.name && <span className="truncate ml-2 opacity-50 max-w-[60px]">{file.path.split('/')[0]}</span>}
                    </div>
                  </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FileList;
