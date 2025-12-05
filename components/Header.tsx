import React from 'react';
import { Languages, Zap, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-10xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-corona-600 p-2 rounded-lg">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-100 tracking-tight">
                Corona <span className="text-corona-500">翻译工具</span>
              </h1>
              <p className="text-xs text-gray-400">适用于 Cinema 4D (.str)</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <a href="https://github.com/HuKaii/Corona-Renderer-For-Cinema-4D-str-Translation">Github</a>
              
            </div>
             <div className="flex items-center text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full border border-gray-700 hidden sm:flex">
                <Languages className="w-4 h-4 mr-2" />
                <span>En &rarr; Zh-CN (Unicode)</span>
             </div>
             
             <button 
               onClick={onOpenSettings}
               className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
               title="API 设置"
             >
                <Settings className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
