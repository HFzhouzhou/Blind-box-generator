# 温柔盲盒生成器 / Blind Box Generator

“温柔盲盒生成器”是一个面向代码表白大赛的网页版互动作品。它把“感谢、鼓励、陪伴、祝福、喜欢、想念”等心意做成可点击的数字盲盒：用户选择收件人、心意关键词、表达语气和文案长度后，点击“开启盲盒”，页面会展示开盒动画，并生成一段温柔文案和一句代码式情话。

项目主题对应“程序予温柔”：让代码不只完成计算，也能承载情绪、传递善意、表达心意。

## 主要功能

- 选择盲盒对象：给自己、给朋友、给老师、给家人、给暗恋的人、给劳动者。
- 选择心意关键词：鼓励、感谢、陪伴、勇气、喜欢、祝福、想念。
- 选择表达语气：真诚、校园、诗意、程序员。
- 输入一段想放进盲盒的小细节，让生成内容更贴近真实心意。
- 点击“开启盲盒”后展示礼盒开启动画、粒子效果和生成结果。
- 支持复制生成结果，方便粘贴到作品说明或分享给他人。
- 支持 DeepSeek API 智能生成。
- 没有配置 API key 时，会自动使用本地模板兜底，保证比赛现场可运行、可演示。

## 技术架构

```text
浏览器页面
  ├─ index.html：桌面端入口，并负责判断手机设备后跳转到 mobile.html
  ├─ styles.css：桌面端视觉样式和盲盒动画
  ├─ app.js：桌面端状态、按钮交互、生成结果渲染
  ├─ mobile.html：独立手机端页面
  ├─ mobile.css：手机端苹果风简约视觉和开盒仪式动画
  └─ mobile.js：手机端状态、开盒流程、生成结果渲染

Node.js 服务
  └─ server.js
      ├─ 提供静态网页文件
      ├─ 提供 /api/health 检查接口
      ├─ 提供 /api/generate 生成接口
      ├─ 有 DEEPSEEK_API_KEY 时请求 DeepSeek
      └─ 没有 DEEPSEEK_API_KEY 时使用本地模板
```

## 环境要求

- Node.js 18 或更高版本
- 可选：DeepSeek API Key
- 可选：Playwright 浏览器，用于截图验证桌面端和手机端页面

依赖安装命令已写在 `requirements.txt` 中。由于这是 Node.js 项目，实际依赖由 `package.json` 和 `package-lock.json` 管理，不使用 Python 的 `pip install -r requirements.txt`。

手机访问网站根路径 `/` 时，会自动跳转到独立的手机版页面 `mobile.html`。如果想在手机上强制看桌面版，可以访问：

```text
http://127.0.0.1:8787/?view=desktop
```

## 本地运行

```bash
git clone git@github.com:HFzhouzhou/Blind-box-generator.git
cd Blind-box-generator
npm install
npm start
```

浏览器打开：

```text
http://127.0.0.1:8787
```

也可以使用 npm 脚本：

```bash
npm start
```

如果要安装用于截图验证的 Playwright 浏览器：

```bash
npm run install:browsers
```

安装后可以用 Playwright 检查手机端页面，例如：

```bash
npx playwright screenshot -b chromium --viewport-size=390,844 --wait-for-timeout=800 http://127.0.0.1:8787/mobile.html mobile-preview.png
```

## 配置 DeepSeek API

DeepSeek 生成文案的 prompt 已经在 `server.js` 里调好，位置是 `requestDeepSeek()` 函数中的 `systemPrompt` 和 `userPrompt`。正常使用时不需要改 `server.js`，只需要配置 `.env` 里的 API Key。

### 第一步：复制配置文件

在项目根目录执行：

```bash
cp .env.example .env
```

执行后会多出一个 `.env` 文件。真正填写 API Key 的地方就在这个 `.env` 文件里。

### 第二步：填写 API Key

打开 `.env` 文件，找到这一行：

```text
DEEPSEEK_API_KEY=sk-your-key-here
```

把等号 `=` 后面的 `sk-your-key-here` 替换成你的 DeepSeek API Key，例如：

```text
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

注意：只改这一行等号后面的内容，不要加空格，不要加引号，不要把 `.env` 上传到 GitHub。

`.env` 完整示例：

```text
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
PORT=8787
HOST=127.0.0.1
```

字段说明：

- `DEEPSEEK_API_KEY`：你的 DeepSeek API Key，必须填写。
- `DEEPSEEK_BASE_URL`：DeepSeek 官方 OpenAI 兼容接口地址，保持 `https://api.deepseek.com` 即可。
- `DEEPSEEK_MODEL`：默认使用 `deepseek-v4-flash`，想用更强模型可以改成 `deepseek-v4-pro`。
- `PORT`：本地服务端口，默认 `8787`。
- `HOST`：本机演示保持 `127.0.0.1`；如果要让同一局域网其他设备访问，可改成 `0.0.0.0`。

### 第三步：重启服务

```bash
node server.js
```

页面右上角会显示当前模式：

- `DeepSeek 已接入`：说明正在使用 DeepSeek 生成文案。
- `本地模板模式`：说明没有配置 API key，程序使用内置模板生成。

DeepSeek API 参考：

- https://api-docs.deepseek.com/zh-cn/
- https://api-docs.deepseek.com/zh-cn/guides/json_mode/

### 如何确认 API 是否配置成功

启动服务后打开页面：

```text
http://127.0.0.1:8787
```

看页面右上角状态：

- 显示 `DeepSeek 已接入`：配置成功，正在使用 DeepSeek 生成。
- 显示 `本地模板模式`：没有读到 API Key，请检查 `.env` 文件是否存在，以及 `DEEPSEEK_API_KEY=` 后面是否已经替换为真实 key。

也可以访问健康检查接口：

```text
http://127.0.0.1:8787/api/health
```

如果返回内容里包含：

```json
{"deepseekConfigured":true}
```

就说明 API Key 已被服务读取。

## 部署方式

### 方式一：本机演示

适合比赛现场或课堂展示：

```bash
npm install
npm start
```

打开：

```text
http://127.0.0.1:8787
```

如果需要让同一局域网内的手机访问，推荐用局域网模式启动：

```bash
npm run start:lan
```

然后在手机浏览器访问运行电脑的局域网 IP 和端口，例如：

```text
http://192.168.x.x:8787
```

如果是当前这台电脑，局域网 IP 通常可以通过系统 Wi-Fi 详情查看，也可以在 macOS 终端执行：

```bash
ifconfig en0
```

找到 `inet` 后面的地址，例如 `10.250.124.181`，手机就访问：

```text
http://10.250.124.181:8787
```

也可以不使用 `start:lan`，手动在 `.env` 中改成：

```text
HOST=0.0.0.0
```

注意：

- 手机和电脑必须在同一个 Wi-Fi 或同一个热点网络下。
- 手机不能访问 `127.0.0.1:8787`，因为手机上的 `127.0.0.1` 指的是手机自己。
- 如果仍然打不开，检查 macOS 防火墙是否拦截了 Node.js 的传入连接。
- 一些校园网会开启客户端隔离，同一 Wi-Fi 下设备也不能互访；这种情况可以让电脑连手机热点再试。

### 方式二：Node.js 服务器部署

适合部署到云服务器：

```bash
git clone git@github.com:HFzhouzhou/Blind-box-generator.git
cd Blind-box-generator
npm install
cp .env.example .env
```

填好 `.env` 后运行：

```bash
npm start
```

长期运行可以使用 `pm2`：

```bash
pm2 start server.js --name blind-box-generator
pm2 save
```

部署服务器上如果只运行网站，不做截图验证，可以不执行 `npm run install:browsers`。

### 方式三：反向代理

如果使用 Nginx，可以把域名代理到本项目端口：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 文件说明

```text
.
├── index.html      # 单页网页入口
├── styles.css      # 页面样式和动画
├── app.js          # 前端交互逻辑
├── mobile.html     # 独立手机端页面
├── mobile.css      # 手机端样式和仪式感动画
├── mobile.js       # 手机端交互逻辑
├── package.json    # npm 依赖和运行脚本
├── package-lock.json # 锁定依赖版本
├── requirements.txt # 依赖安装命令说明
├── server.js       # Node.js 静态服务与 DeepSeek 代理
├── .env.example    # 环境变量示例
├── TODO.md         # 开发计划与作品框架
└── README.md       # 项目说明
```

## 常见问题

### 1. 不配置 DeepSeek API Key 能不能运行？

可以。程序会自动使用本地模板生成文案，适合离线演示和比赛现场兜底。

### 2. 为什么不直接在前端请求 DeepSeek？

因为 API Key 不能暴露在浏览器代码里。项目通过 `server.js` 作为后端代理请求 DeepSeek，可以更安全地保存 key。

### 3. 可以直接部署到 GitHub Pages 吗？

不建议直接部署到 GitHub Pages。这个项目需要 `/api/generate` 后端接口来保护 API Key，并提供生成服务。推荐部署到支持 Node.js 的服务器。

## 比赛提交建议

- 作品名称：温柔盲盒生成器
- 作品寓意：用程序把感谢、鼓励、陪伴、祝福等情绪装进盲盒，让代码成为传递温暖的语言。
- 作品截图：选择参数后的生成页面、开盒动画过程、不同对象的生成结果。
- 演示视频：展示“选择参数 → 开启盲盒 → 生成文案 → 复制结果”的完整流程。
- 源代码：提交本仓库全部文件，但不要提交 `.env`。
