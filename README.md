# 京阳温室企业官网

山东京阳温室科技有限公司官网源码。公司内部项目，仅授权人员使用；仓库应保持 Private，不授予公开再分发许可。

## 组成

| 目录 | 用途 |
| --- | --- |
| frontend | Next.js / React，多语言官网与管理后台 |
| backend | Express API、内容管理、询盘与计算器 |
| database | 数据库结构与迁移脚本，不包含生产数据 |
| infrastructure | 本地翻译等配套服务配置 |
| nginx | 反向代理配置模板 |
| docs | 功能、测试与管理文档 |

## 项目入口

- 正式开发目录：虚拟机 `/home/user/projects/website/jingyang-website`。
- 运行目录：`/var/www/jingyang-website`；不直接在运行目录改代码。
- 管理后台：`/manage888`；登录信息单独保管，仓库不提供默认密码。
- GitHub 为代码协作与备份入口，推送代码不会自动发布网站。

## 开发与版本管理

先阅读 [协作规范](CONTRIBUTING.md) 和 [项目管理说明](docs/PROJECT_MANAGEMENT.md)。

1. 配置 Node.js（现有虚拟机为20.20.2），分别在 frontend、backend 执行 `npm ci`。
2. 按各目录的 `.env.example` 创建本地配置；数据库、JWT、SMTP真实值不提交。
3. 前端 `npm run dev`，后端 `npm run dev`。端口与接口地址以配置为准，避免与现有服务冲突。
4. 前端发布前执行 `npm run build`；后端执行语法检查和受影响接口的回归验证。
5. 不要在现有数据库直接执行初始化、种子脚本或一键部署脚本。

## 功能与状态

包含产品、工程案例、新闻、询盘、温室计算器及中文/英文/俄文/阿拉伯文内容。

历史发布记录：[2026-08-26 QA修复](docs/RELEASE_QA_FIXES_20260826.md)。
版本状态：[VERSION_STATUS.md](VERSION_STATUS.md)。旧部署文档可能含过时目录和示例，执行前须核对实际部署配置。

## 备份边界

GitHub保存源码、必要静态素材、迁移脚本和文档。数据库、后台上传图片、运行环境配置要独立备份；只克隆仓库不足以恢复完整网站。详见 [备份与恢复](docs/BACKUP_AND_RECOVERY.md)。
