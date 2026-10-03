# 食日记 · Food Sticker Diary

拍一张，剪一剪，把好吃的贴进日历。

## 功能

- 相机拍摄或上传图片，浏览器内自动去除背景。
- 白边食物贴纸、旋转角度、拖动换日期、备注和删除。
- 月历、可搜索和排序的收藏册、真实记录生成的纪念章。
- 三种纸张配色与每日拍摄灵感。
- Pages 版支持 JSON 备份导入/导出，导入不覆盖同 ID 记录。

## GitHub Pages

Pages 版没有服务器或账号：照片和记录只保存在当前浏览器的 IndexedDB，不会上传 GitHub，不会自动同步到其他设备。清理浏览器数据前请导出备份。首次抠图会下载约 100–112 MB 的模型与运行时资源，后续优先使用浏览器缓存。

支持 WebGPU 和 shader-f16 的设备优先使用显卡抠图，失败时在独立的新引擎中自动回退 CPU。连续制作贴纸复用已初始化的 ISNet fp16 模型，避免重复下载和初始化；取消处理或离开页面会释放引擎。首次加载速度受网络影响，实际推理速度取决于设备。

GitHub Actions 在 main 更新后自动检查、下载经过 SHA-256 校验的模型、构建并发布。模型只进入发布产物，不提交进 Git 历史。

```sh
npm ci
npm run model:download
npm run pages:build
npx vite preview --config vite.local.config.ts --mode pages
```

项目路径为 `/food-sticker-diary/`。无隔离响应头的环境使用单线程 WASM，不需要额外代理服务器。

## localhost 版

Node.js 24。该版本保留 SQLite 本地服务：

```sh
npm ci
npm run model:download
npm run local:build
npm run local
```

打开 http://localhost:3000 。数据保存在 `.local-data/food-stickers.sqlite`；模型在 `.local-models/`。备份 SQLite 时先停止服务，再复制整个 `.local-data` 文件夹。

localhost 与 Pages 的存储相互独立。既有 SQLite 记录不会自动公开或同步。

## 图片处理

支持 JPG、PNG、WebP、AVIF，单张最大 25 MB。单份食物与简洁背景效果更好。自动抠图可能保留餐盘等相邻物体，识别结果过弱时可重试或换照片。

抠图引擎：IMG.LY background-removal 1.7.0 / ISNet fp16 / ONNX Runtime。该依赖采用 AGPL-3.0，原始许可证见 public/background-removal-LICENSE.md；源代码及构建依赖在本仓库中可用。

## 验证

类型检查、生产构建、真实食物抠图与透明度验证、保存刷新、拖动/编辑/删除、备份恢复、手机布局。相机使用模拟设备验证拍摄及取消流程。

