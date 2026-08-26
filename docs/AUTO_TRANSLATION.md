# 自动翻译与云服务器部署说明

## 工作方式

后台保存中文产品、工程案例或文章后，会为英语、俄语和阿拉伯语建立持久化任务。中文保存不等待翻译接口；服务异常或未配置时，任务保留在数据库中，不影响内容发布。

任务状态：`waiting_config`（等待配置）、`pending`（待处理）、`processing`（处理中）、`success`（成功）、`failed`（失败）。后台对应管理页面可查看汇总状态并补译缺失内容。

“补译缺失内容”不会重复翻译来源未变化且已经成功的译文。它只处理尚无译文、上次失败或中文来源已经变化的语言任务；人工校对并锁定的译文不会被覆盖。若确需重做某一条，可在对应内容上使用单条重试。

## 翻译服务配置

### 当前虚拟机：离线 Argos

当前部署使用只监听 `127.0.0.1:5000` 的 Argos 服务，不产生API费用：

```env
TRANSLATION_PROVIDER=argos
TRANSLATION_API_URL=http://127.0.0.1:5000
```

服务由 systemd 管理：`sudo systemctl status argos-translator`。中译俄和中译阿通过英语中转，适合自动生成初稿，正式发布前仍建议人工抽查专业术语。

管理后台的产品、案例和内容编辑窗口均可切换英语、俄语和阿拉伯语。人工修订后勾选“锁定该语言的人工译文”，后续中文更新和自动补译不会覆盖该译文。

### 云服务器：OpenAI兼容接口

后端也支持 OpenAI Chat Completions 兼容接口，可连接云端服务或本地模型网关：

```env
TRANSLATION_API_URL=https://example.com/v1
TRANSLATION_API_KEY=replace-with-server-side-secret
TRANSLATION_MODEL=your-model-name
TRANSLATION_TIMEOUT_MS=45000
TRANSLATION_POLL_MS=5000
```

密钥只能保存在 `backend/.env` 或云服务器密钥管理中，不得写入前端代码或提交到 Git。

修改配置后执行：

```bash
pm2 restart jingyang-backend --update-env
```

随后进入产品、案例或内容管理页面，点击“补译缺失内容”。以后新增和修改中文内容会自动创建翻译任务。

## 云服务器迁移

迁移时执行 `database/migrate_all.sql` 或 `database/migrate_translation_jobs.sql`，复制后端环境变量，再启动 PM2。翻译任务和译文都保存在 PostgreSQL 中，不依赖当前虚拟机文件，因此可随数据库迁移。

生产环境建议只允许后端访问翻译接口，设置调用额度和超时，并定期备份翻译表及 `translation_jobs` 表。
