<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Corona C4D String Localizer

基于 React + Vite 的轻量级本地化工作台，用于批量处理 Maxon Cinema 4D / Corona Renderer 等插件的 `.str` 文本资源文件。

支持从英文界面字符串到简体中文 (zh-CN) 的 AI 翻译，同时自动生成 Unicode 转义（`\u4e2d` 这种形式），方便直接回写到 C4D 插件语言包中。

> 适合场景：给 Corona / 其它 C4D 插件做汉化，批量校对、统一词汇风格，导出可直接使用的中文版本语言文件。

---

## 功能特性

- **批量文件 / 文件夹上传**  
  支持选择多个 `.str` / `.txt` / `.res` 文件，或整 个文件夹上传，自动递归筛选语言文件并保留原有目录结构。

- **自动解析 C4D 字符串格式**  
  内置 C4D 字符串格式解析：`KEY "Value"; // comment`  
  自动区分 **有效字符串** 与 **注释 / 空行**，只对真正需要翻译的条目进行处理。

- **智能识别已翻译内容**  
  支持识别原始值中的 `\uXXXX` Unicode 转义以及中文字符：
  - 已包含中文或 Unicode 的条目会被视为已翻译，显示在“翻译 (CN)”列；
  - 其原始 `\uXXXX` 内容会出现在 “Unicode 输出” 列，便于保留原始转义形式。

- **AI 批量翻译**  
  支持两类供应商：
  - **Google Gemini**（通过 `@google/genai` SDK 调用）；
  - **OpenAI 兼容接口**（例如 DeepSeek，使用 `deepseek-reasoner` 模型，汉化完整内容花费约2元左右）。

  提示词针对 **Cinema 4D / Corona Renderer** 专门优化，强调：
  - 专业 CG / 渲染领域术语（如“漫反射”“焦散”“GI”“LUT”等）；
  - 保留占位符 `%s`、`%d` 等；
  - “Corona” 固定不翻译。

- **智能勾选与批量操作**  
  - 自动检测“未翻译的英文字符串”，一键“智能选择”；
  - 支持全选 / 全不选；
  - 支持按住 `Shift` 批量勾选一段连续条目；
  - 实时统计已翻译条目数量和总数，全局进度直观可见。

- **Unicode 自动转码**  
  输入中文翻译后自动生成 `\uXXXX` 形式的 Unicode 串，用于写回 `.str` 文件。

---

## 技术栈

- **框架**：React 19 + Vite 6
- **语言**：TypeScript
- **UI**：Tailwind 风格类 + `lucide-react` 图标库
- **AI 调用**：
  - `@google/genai`（Gemini）
  - 浏览器 `fetch` 调用 OpenAI / DeepSeek 兼容接口
- **打包导出**：`jszip`

---

## 本地运行

### 1. 环境准备

- 已安装 **Node.js**（建议 18+）
- 推荐使用 **pnpm**，也可以使用 npm / yarn

### 2. 安装依赖

在项目根目录执行：

```bash
pnpm install
# 或
npm install
```

### 3. 启动开发环境

```bash
pnpm dev
# 或
npm run dev
```

启动后，Vite 会在终端输出本地访问地址，例如：

- `http://localhost:3000/`

用浏览器打开即可使用。

> 注意：这是纯前端项目，AI 调用会在浏览器中直接请求 Gemini / DeepSeek / OpenAI 接口，请确保本机网络能访问相关服务。

---

## AI 设置说明

点击右上角“齿轮”图标或首页“配置 API 设置 (Gemini / DeepSeek / OpenAI)”按钮，会弹出 **API 设置** 弹窗，对以下参数进行配置：

- **AI 供应商 (provider)**
  - `Google Gemini`
  - `OpenAI / DeepSeek`（任意兼容 OpenAI Chat Completions 协议的服务）

- **API 地址 (Base URL，OpenAI 模式下可见)**
  - 例如：`https://api.deepseek.com`
  - 程序会自动补全为：`https://api.deepseek.com/chat/completions`

- **API Key**（必填）
  - Gemini：通常以 `AIza...` 开头；
  - DeepSeek / OpenAI：通常以 `sk-` 开头；
  - 会被保存在浏览器 `localStorage` 中，仅在本机使用。

- **模型名称 (modelName)**
  - Gemini 默认：`gemini-2.5-flash`
  - DeepSeek 示例：`deepseek-chat、deepseek-reasoner`
  - 你也可以填自己的模型 ID。

- **并发请求数 (concurrency)**
  - 同时并行的请求数量，例如 `5` / `10`；
  - 数值越大整体时间越短，但更容易触发限流（Rate Limit）。

- **单请求条数 (batchSize)**
  - 单次请求中包含的字符串条目数，如 `14`；
  - 需要在“整体速度 / 单次请求负载 / Token 限制”之间权衡。

所有设置会自动保存到 `localStorage`，下次打开页面会自动恢复，无需重复填写。

---

## 使用教程

### 1. 上传语言文件

- **方式一：上传文件**
  - 点击首页左侧“上传文件”卡片；
  - 选择一个或多个 `.str` / `.txt` / `.res` 文件；
  - 适用于零散文件翻译。

- **方式二：上传文件夹**
  - 点击“上传文件夹”卡片；
  - 选择包含多语言文件的根目录；
  - 程序会自动递归读取文件，筛选出 `.str` 文件，并保留相对路径（用于导出时还原结构）。

上传成功后：

- 左侧侧边栏会显示文件列表；
- 中间主区域为空时会提示“请在左侧选择一个文件开始编辑”。

### 2. 浏览并选择待翻译条目

在左侧点击某个文件后：

- 右侧表格会显示：
  - `ID (Key)`：字符串 Key，例如 `IDS_MATERIAL`；
  - `原始 (来源)`：英文原文（或原始 `\uXXXX` 串）；
  - `翻译 (CN)`：当前中文翻译（可手动编辑）；
  - `Unicode 输出`：对应的 `\uXXXX` 形式字符串。

上方工具栏提供：

- **全选**：勾选当前文件所有可翻译条目；
- **全不选**：清除所有勾选；
- **智能选择 (未翻译)**：自动选中“未翻译的英文条目”：
  - 没有中文；
  - `translatedValue` 为空；
  - 行本身不是注释或空行。

勾选时支持：

- 单行勾选 / 取消勾选；
- 按住 `Shift` 选择范围，快速选中一段连续行。

### 3. 配置 AI 设置

在开始翻译前，请先：

1. 打开设置弹窗；
2. 选择供应商（Gemini 或 OpenAI/DeepSeek）；
3. 填写 Base URL（OpenAI 模式需要）；
4. 填写 API Key 和模型名称；
5. 根据网络和限流情况调整并发和 batchSize。

若未配置 API Key，点击“翻译已选项目”时会自动弹出设置窗口并提示。

### 4. 启动批量翻译

当你已经在一个或多个文件中勾选了待翻译条目后：

1. 在顶部工具栏点击 **“翻译已选项目”**；
2. 应用会：
   - 找出所有至少含有一个“已勾选且非注释”的文件；
   - 按 `batchSize` 切分为多个批次；
   - 按 `concurrency` 控制并行请求数；
   - 调用 Gemini 或 OpenAI/DeepSeek 接口进行翻译；
   - 将返回结果写入每条记录的 `translatedValue` / `unicodeValue` 中，并标记为 `done`；
   - 自动取消勾选已翻译条目。

主界面顶部会显示全局进度：

- 当前已翻译条目数 / 总条目数；
- 进度条实时更新。

### 5. 手动校对与修改

翻译完成后，你可以：

- 直接在“翻译 (CN)”列里编辑文本；
- 工具会自动根据最新中文生成新的 Unicode 串并更新“Unicode 输出”。

### 6. 导出结果

顶部工具栏中的 **导出** 按钮行为：

- 如果只存在一个文件：
  - 直接下载一个 `.str` 文件。

- 如果有多个文件：
  - 若侧边栏中勾选了一部分文件：仅导出选中的这些文件；
  - 如果没有任何勾选：导出全部文件；
  - 结果会打包为 `corona_c4d_translated.zip`，保留原始相对路径。

### 7. 删除与重置

- 选中文件后点击垃圾桶图标：
  - 如果有勾选的文件：只删除选中的文件（有确认提示）；
  - 如果没有勾选但列表非空：会询问是否清空全部文件和进度。

---

## 注意事项

- **API Key 安全**
  - 所有密钥仅保存在本机浏览器 `localStorage`；
  - 不会上传到任何后端服务，但请注意不要在公共电脑上长期保存；
  - 建议使用受限权限的密钥，并定期轮换。

- **限流与费用**
  - 高并发、大批量翻译会消耗更多 Token，并更容易触发限流；
  - 请根据个人账户配额合理设置 `concurrency` 与 `batchSize`。

- **翻译质量**
  - 尽管提示词针对 C4D/Corona 做了专门优化，仍建议人工抽查重要界面；
  - 如有固定术语表，可先在模型系统提示（system prompt）或自定义模型里固化。

- **浏览器兼容性**
  - 推荐使用最新版 Chrome / Edge；
  - 因为使用了 `File` / `Blob` / `fetch` 等现代 API，旧浏览器可能存在兼容问题。

---

## 开发与自定义

- 所有解析逻辑位于 `services/parserService.ts`：
  - C4D `.str` 解析规则；
  - Unicode 转义编解码；
  - 导出文件和 ZIP 打包逻辑。

- AI 相关逻辑：
  - `services/geminiService.ts` —— 使用 `@google/genai` 调用 Gemini；
  - `services/openaiService.ts` —— 调用 OpenAI / DeepSeek 兼容接口。

你可以根据自己使用的引擎或插件，调整：

- 提示词中提到的软件名称和翻译风格；
- 导出文件的命名规则（例如改为 `_zh-CN` 等）；
- 解析正则以适配不同格式的语言文件。

---

## 许可

