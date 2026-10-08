# 官网版本状态

## 2026-10-08：私有GitHub管理基线

- 迁移源码基线：b663876，原18次提交完整保留。
- 历史QA功能提交：d91bc0a，详情见docs/RELEASE_QA_FIXES_20260826.md。
- 本次新增项目管理文档、Issue/PR模板、忽略规则和轻量自动检查。
- 本次没有修改网站业务逻辑，没有重新部署网站，不将历史验证结果作为本次重新验证结果。
- 唯一正式开发目录：/home/user/projects/website/jingyang-website。
- 运行目录：/var/www/jingyang-website。

发布前必须明确记录代码SHA、验证结果、配置与数据库变更，以及回滚路径。
