export interface StringEntry {
  id: string; // 唯一标识符，用于React列表key
  originalLine: string; // 原始完整行
  key: string; // 提取出的 Key (例如 IDS_MATERIAL)
  value: string; // 提取出的英文 Value
  translatedValue: string; // 翻译后的中文
  unicodeValue: string; // 转换后的 Unicode 转义字符
  status: 'pending' | 'translating' | 'done' | 'error';
  isCommentOrEmpty: boolean; // 标记是否为注释或空行
  isSelected: boolean; // 是否被勾选参与翻译
}

export interface TranslationStats {
  total: number;
  translated: number;
  chars: number;
}

export interface FileDocument {
  id: string;
  name: string; // 文件名
  path: string; // 相对路径 (用于文件夹上传)
  entries: StringEntry[];
  stats: TranslationStats;
  status: 'idle' | 'processing' | 'completed';
  isChecked: boolean; // 用于侧边栏文件选择
}

export type AIProvider = 'gemini' | 'openai';

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string; // 用于 OpenAI 兼容接口 (例如 https://api.deepseek.com)
  modelName: string; // 例如 gemini-2.5-flash 或 deepseek-chat
  concurrency: number; // 最大并发请求数
  batchSize: number; // 每个请求内包含的条目数
}
