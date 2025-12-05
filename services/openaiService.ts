import { AISettings } from "../types";

export const translateBatchOpenAI = async (
  texts: { id: string; text: string }[],
  settings: AISettings
): Promise<Map<string, string>> => {
  if (texts.length === 0) return new Map();

  const { apiKey, baseUrl, modelName } = settings;

  // 构建提示词
  const prompt = `
    您是一位专业翻译，专精于 3D 计算机图形软件，特别是 Maxon Cinema 4D 和 Corona Renderer。

请将以下英文技术术语和用户界面字符串翻译成简体中文 (zh-CN)。以满足对软件插件的汉化。

规则：

1. 确保技术术语准确专业，符合Maxon Cinema 4D官方翻译逻辑（例如，“漫反射”、“焦散”、“GI”、“LUT”）。

2. 要求简洁，适合用户界面标签。

3. 如果存在变量占位符（例如，%s、%d），则无需翻译。

4. 仅返回有效的 JSON 数组。请勿输入 Markdown 代码块。

5. ‘Corona’不需要翻译，保持Corona。

6. 不要输入其它内容，直接输出结果。

待翻译内容：
    ${JSON.stringify(texts.map(t => ({ id: t.id, text: t.text })))}
    
    输出格式示例：
    [{"id": "...", "translatedText": "..."}]
  `;

  try {
    // 自动补全 /v1/chat/completions 如果用户只输入了域名
    let url = baseUrl;
    if (!url.endsWith('/chat/completions')) {
        // 处理结尾斜杠
        const base = url.endsWith('/') ? url.slice(0, -1) : url;
        // 如果没有 /v1，加上它 (Deepseek 等通常需要)
        // 但为了通用性，如果用户直接给了完整路径则不加，简单起见假设用户输入 base url
        url = `${base}/chat/completions`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: "你是一位能翻译JSON数据的得力助手。特别是 Maxon Cinema 4D 和 Corona Renderer等软件汉化翻译" },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        stream: false
      })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`OpenAI API Error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) throw new Error("AI提供商未作出回应");

    // 清理可能的 markdown 标记 (Deepseek 有时会返回 ```json ... ```)
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();

    const parsedResult = JSON.parse(cleanContent) as { id: string; translatedText: string }[];
    
    const resultMap = new Map<string, string>();
    parsedResult.forEach(item => {
      resultMap.set(item.id, item.translatedText);
    });

    return resultMap;

  } catch (error) {
    console.error("OpenAI 翻译错误:", error);
    throw error;
  }
};
