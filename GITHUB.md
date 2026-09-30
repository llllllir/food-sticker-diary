# GitHub 发布配置

仓库： https://github.com/llllllir/food-sticker-diary

- `main`：产品源代码。
- `.github/workflows/ci.yml`：类型、构建和本地服务语法检查。
- `.github/workflows/pages.yml`：Pages 静态构建与自动部署。
- 模型由 `npm run model:download` 获取，不进源代码仓库。
- SQLite、模型缓存、构建产物、凭证不会提交。
- 后续修改：检查成功后 commit 并 push main，Pages 自动更新。

Pages 使用浏览器 IndexedDB，与原有本地 SQLite 分开。导入/导出备份可迁移记录。不会把个人饮食照片打包到公开站点。
