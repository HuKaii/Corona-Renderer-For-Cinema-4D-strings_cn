import { GoogleGenAI, Type } from "@google/genai";
import { AISettings } from "../types";

// 初始化 Gemini 客户端
const getClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("API Key 未设置。请在设置中配置 API Key。");
  }
  return new GoogleGenAI({ apiKey });
};

export const translateBatch = async (
  texts: { id: string; text: string }[],
  settings: AISettings
): Promise<Map<string, string>> => {
  if (texts.length === 0) return new Map();

  // 优先使用设置中的 Key，如果没有则尝试 fallback 到 env (虽然在纯前端 env 并不总是可靠，除非构建时注入)
  const apiKey = settings.apiKey || process.env.API_KEY || '';
  const modelName = settings.modelName || 'gemini-2.5-flash';

  const ai = getClient(apiKey);

  // 构建提示词
  const prompt = `
您是一位专业翻译，专精于 3D 计算机图形软件，特别是 Maxon Cinema 4D 和 Corona Renderer。

请将以下英文技术术语和用户界面字符串翻译成简体中文 (zh-CN)。以满足对软件插件的汉化。

规则：

1. 确保技术术语准确专业，符合Maxon Cinema 4D官方翻译逻辑（例如，“漫反射”、“焦散”、“GI”、“LUT”）。

2. 要求简洁，适合用户界面标签。

3. 如果存在变量占位符（例如，%s、%d），则无需翻译。

待翻译内容：
    ${JSON.stringify(texts.map(t => ({ id: t.id, text: t.text })))}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              translatedText: { type: Type.STRING }
            },
            required: ["id", "translatedText"]
          }
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from AI");

    const parsedResult = JSON.parse(resultText) as { id: string; translatedText: string }[];

    const resultMap = new Map<string, string>();
    parsedResult.forEach(item => {
      resultMap.set(item.id, item.translatedText);
    });

    return resultMap;

  } catch (error) {
    console.error("Gemini 翻译错误:", error);
    throw error;
  }
};
