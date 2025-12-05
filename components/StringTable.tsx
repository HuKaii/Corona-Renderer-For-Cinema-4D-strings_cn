import React, { useRef } from 'react';
import { StringEntry } from '../types';
import { Loader2 } from 'lucide-react';

interface StringTableProps {
  entries: StringEntry[];
  onUpdateEntry: (id: string, newValue: string) => void;
  onToggleSelect: (ids: string[], selected: boolean) => void;
}

const StringTable: React.FC<StringTableProps> = ({ entries, onUpdateEntry, onToggleSelect }) => {
  // 只显示需要翻译的行
  const activeEntries = entries.filter(e => !e.isCommentOrEmpty);
  const lastClickedId = useRef<string | null>(null);

  // Check if all are selected
  const allSelected = activeEntries.length > 0 && activeEntries.every(e => e.isSelected);
  const someSelected = activeEntries.some(e => e.isSelected);

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, entry: StringEntry, index: number) => {
    const isChecked = e.target.checked;
    
    // Handle Shift+Click for range selection
    // @ts-ignore
    if (e.nativeEvent.shiftKey && lastClickedId.current) {
        const lastIndex = activeEntries.findIndex(item => item.id === lastClickedId.current);
        if (lastIndex !== -1) {
            const start = Math.min(lastIndex, index);
            const end = Math.max(lastIndex, index);
            const idsToToggle = activeEntries.slice(start, end + 1).map(item => item.id);
            onToggleSelect(idsToToggle, isChecked);
            lastClickedId.current = entry.id;
            return;
        }
    }

    lastClickedId.current = entry.id;
    onToggleSelect([entry.id], isChecked);
  };

  const handleHeaderCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const ids = activeEntries.map(entry => entry.id);
      onToggleSelect(ids, e.target.checked);
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-900 shadow-xl">
      <div className="flex-1 overflow-auto relative custom-scrollbar">
        <table className="min-w-full divide-y divide-gray-800 border-separate border-spacing-0">
          <thead className="bg-gray-950 sticky top-0 z-10 shadow-md">
            <tr>
              <th scope="col" className="px-4 py-3 text-left w-10 border-b border-gray-800 bg-gray-950">
                 <input 
                    type="checkbox" 
                    checked={allSelected}
                    ref={input => {
                        if (input) {
                            input.indeterminate = someSelected && !allSelected;
                        }
                    }}
                    onChange={handleHeaderCheckboxChange}
                    className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-corona-600 focus:ring-corona-500 focus:ring-offset-gray-900"
                 />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/4 border-b border-gray-800 bg-gray-950">
                ID (Key)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/4 border-b border-gray-800 bg-gray-950">
                原始 (来源)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/4 border-b border-gray-800 bg-gray-950">
                翻译 (CN)
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/4 border-b border-gray-800 bg-gray-950">
                Unicode 输出
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800 bg-gray-900/50">
            {activeEntries.length === 0 ? (
               <tr>
                 <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm ">
                   没有找到有效的字符串条目
                 </td>
               </tr>
            ) : (
              activeEntries.map((entry, index) => (
                <tr 
                    key={entry.id} 
                    className={`transition-colors ${entry.isSelected ? 'bg-corona-900/10 hover:bg-corona-900/20' : 'hover:bg-gray-800/40'}`}
                >
                  <td className="px-4 py-4">
                     <input 
                        type="checkbox" 
                        checked={entry.isSelected}
                        onChange={(e) => handleCheckboxChange(e, entry, index)}
                        className="w-4 h-4 rounded border-gray-700 bg-gray-800 text-corona-600 focus:ring-corona-500 focus:ring-offset-gray-900 cursor-pointer"
                     />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-corona-400">
                    {entry.key}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 break-words max-w-xs cursor-text select-text">
                    {entry.value}
                  </td>
                  <td className="px-6 py-4">
                    <div className="relative min-w-[300px]">
                      {entry.status === 'translating' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10 rounded">
                           <Loader2 className="w-4 h-4 animate-spin text-corona-500" />
                        </div>
                      )}
                      <input
                        type="text"
                        value={entry.translatedValue}
                        onChange={(e) => onUpdateEntry(entry.id, e.target.value)}
                        placeholder={entry.status === 'pending' ? '输入翻译...' : '输入翻译...'}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:ring-1 focus:ring-corona-500 focus:border-corona-500 outline-none transition-all placeholder-gray-600"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-emerald-400/80 select-all">
                     {entry.unicodeValue || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StringTable;
