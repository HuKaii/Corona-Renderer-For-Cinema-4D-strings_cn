import React, { useRef } from 'react';
import { Upload, FileCode, FolderInput } from 'lucide-react';

interface UploadAreaProps {
  onFilesLoaded: (files: File[]) => void;
}

const UploadArea: React.FC<UploadAreaProps> = ({ onFilesLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesLoaded(Array.from(e.target.files));
    }
    // Reset value to allow re-uploading same file if needed
    e.target.value = '';
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* 单/多文件上传 */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer relative border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 hover:border-corona-500/50 transition-all group p-8 flex flex-col items-center justify-center text-center h-64"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".str,.txt,.res"
            onChange={handleFiles}
            className="hidden"
          />
          <div className="bg-gray-900/50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
             <Upload className="h-8 w-8 text-gray-400 group-hover:text-corona-400 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-gray-200">
            上传文件
          </h3>
          <p className="mt-2 text-xs text-gray-500 max-w-[200px]">
            选择一个或多个 .str 文件。支持批量选择。
          </p>
        </div>

        {/* 文件夹上传 */}
        <div 
          onClick={() => folderInputRef.current?.click()}
          className="cursor-pointer relative border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/30 hover:bg-gray-800/50 hover:border-corona-500/50 transition-all group p-8 flex flex-col items-center justify-center text-center h-64"
        >
          <input
            ref={folderInputRef}
            type="file"
            // @ts-ignore - webkitdirectory is standard in modern browsers but not in React types
            webkitdirectory="" 
            directory="" 
            multiple
            onChange={handleFiles}
            className="hidden"
          />
          <div className="bg-gray-900/50 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
             <FolderInput className="h-8 w-8 text-gray-400 group-hover:text-blue-400 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-gray-200">
            上传文件夹
          </h3>
          <p className="mt-2 text-xs text-gray-500 max-w-[200px]">
            选择包含 .str 文件的文件夹。我们会自动过滤并保持结构。
          </p>
        </div>
      </div>
      
      <div className="mt-8 text-center">
         <div className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 border border-gray-800 text-xs font-mono text-gray-500">
            <FileCode className="w-4 h-4 mr-2 text-corona-600" />
            支持格式: strings_en-US.str, .txt, .res
         </div>
      </div>
    </div>
  );
};

export default UploadArea;