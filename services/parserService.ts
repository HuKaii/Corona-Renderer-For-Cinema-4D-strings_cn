import { StringEntry, FileDocument } from '../types';
import JSZip from 'jszip';

// C4D String Format Regex: KEY "Value";
// 捕获组 1: 前缀(含Key)
// 捕获组 2: 引号内的内容
// 捕获组 3: 后缀(分号及注释)
const C4D_STR_REGEX = /^(\s*[A-Z0-9_]+\s+)"(.*)"(\s*;\s*.*)$/;

// 解码 Unicode 转义序列 (例如 \u4e2d -> 中)
export const decodeUnicode = (str: string): string => {
  try {
    return str.replace(/\\u([\dA-F]{4})/gi, (_match, grp) => {
      return String.fromCharCode(parseInt(grp, 16));
    });
  } catch (e) {
    return str;
  }
};

export const parseStrFile = (content: string): StringEntry[] => {
  const lines = content.split(/\r?\n/);
  return lines.map((line, index) => {
    const match = line.match(C4D_STR_REGEX);
    
    if (match) {
      const prefix = match[1]; // Key usually resides here
      const rawValue = match[2];
      
      // 提取纯 Key 用于显示 (去除前导空格)
      const key = prefix.trim(); 

      // 尝试解码 Value (如果包含 \uXXXX)
      const decodedValue = decodeUnicode(rawValue);
      
      // 判断是否已经是中文或者包含 Unicode 转义
      // 如果解码后的值与原始值不同(说明有转义)，或者解码后包含中文，则认为是已翻译内容
      const isAlreadyTranslated = rawValue !== decodedValue || /[\u4e00-\u9fa5]/.test(decodedValue);

      return {
        id: `line-${index}-${Date.now()}-${Math.random()}`,
        originalLine: line,
        key: key,
        value: rawValue, // 原始值保留在 Source 列 (即使它是 \uXXXX，保留原始样貌)
        translatedValue: isAlreadyTranslated ? decodedValue : '', // 如果判定为已翻译，填充到翻译列
        unicodeValue: isAlreadyTranslated ? rawValue : '', // 保留原始转义作为 unicodeValue
        status: isAlreadyTranslated ? 'done' : 'pending',
        isCommentOrEmpty: false,
        isSelected: false // 默认为 false，由 UI 层决定是否全选或智能选择
      };
    } else {
      return {
        id: `line-${index}-${Date.now()}-${Math.random()}`,
        originalLine: line,
        key: '',
        value: '',
        translatedValue: '',
        unicodeValue: '',
        status: 'done', // 不需要翻译
        isCommentOrEmpty: true,
        isSelected: false
      };
    }
  });
};

// 将字符串转换为 Unicode 转义序列 (\uXXXX)
export const toUnicodeEscape = (str: string): string => {
  return str.split('').map(char => {
    const code = char.charCodeAt(0);
    // 只转换非 ASCII 字符
    if (code > 127) {
      return '\\u' + code.toString(16).padStart(4, '0');
    }
    return char;
  }).join('');
};

// 重新生成文件内容
export const generateFileContent = (entries: StringEntry[]): string => {
  return entries.map(entry => {
    if (entry.isCommentOrEmpty) {
      return entry.originalLine;
    }
    
    // 使用 regex 重新组装以保持原始缩进和格式
    const match = entry.originalLine.match(C4D_STR_REGEX);
    if (match) {
      const prefix = match[1];
      const suffix = match[3];
      // 优先使用 unicodeValue，如果没有则回退到 value (英文)
      const content = entry.unicodeValue || entry.value; 
      return `${prefix}"${content}"${suffix}`;
    }
    return entry.originalLine;
  }).join('\n');
};

export const downloadFile = (filename: string, content: string) => {
  const element = document.createElement('a');
  const file = new Blob([content], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

export const generateZip = async (files: FileDocument[]): Promise<void> => {
  const zip = new JSZip();
  
  files.forEach(file => {
    const content = generateFileContent(file.entries);
    // 简单的路径处理：如果是文件夹上传，path 可能包含路径；否则仅文件名
    const originalPath = file.path || file.name;
    
    let newPath = originalPath;
    if (newPath.match(/strings_en/i)) {
        newPath = newPath.replace(/strings_en[-_A-Za-z]*/i, 'strings_cn');
    } else {
        newPath = newPath.replace(/(\.[\w\d]+)$/i, '$1');
    }
    
    zip.file(newPath, content);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  const element = document.createElement('a');
  element.href = URL.createObjectURL(blob);
  element.download = "corona_c4d_translated.zip";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};
