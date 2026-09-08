# 登录鉴权接入

## 当前实现与范围

前端已接入真实账号接口，使用 Better Auth 管理密码哈希与可撤销会话。独立 Node.js 服务连接 MySQL；Vinext 页面通过同源接口代理请求，不直接连接数据库。

```text
浏览器 → 网站同源 /api/auth/* → Node.js 账号服务 → MySQL
                         /api/account/session ↗
服务端 /admin → 校验会话 → 核对本地站长 ID → 返回后台
```

- 支持邮箱密码注册、登录、退出及七天保持登录；昵称 2–24 字、注册密码 12–128 位。
- 密码只以哈希保存；会话令牌只通过 HttpOnly、SameSite=Lax Cookie 传递。HTTPS 环境额外启用 Secure。
- 退出会撤销数据库会话。管理员判断只使用已验证会话中的不可变用户 ID，与服务端配置精确匹配。
- 站长邮箱不能通过公开注册入口认领；普通账号不能自己指定管理员角色。所有管理类鉴权 HTTP 接口均不对外开放。
- 表单请求检查来源、请求方式和大小；登录、注册限流记录存入数据库。
- 配置缺失或账号服务不可达时，不展示受保护的后台，也不会回退为演示登录。

文章、相册、留言等内容仍是浏览器 localStorage 数据。本次接入不包含内容跨设备同步、内容服务端写入、邮件验证、验证码或密码找回；普通账号的邮箱未验证，不作为已核实的身份使用。

## 本机配置

要求 Node.js 24+、MySQL 8，以及提前创建的空数据库或允许新增鉴权表的现有数据库。不在源码中提供数据库账号或默认站长密码。

1. 参考仓库根目录的 `.env.auth.example`，创建只存在于本机的 `.env.auth`。如果文件已存在，请只补充缺失项，不要覆盖已有密钥。
2. 填写 `MYSQL_HOST`、`MYSQL_PORT`、`MYSQL_DATABASE`、`MYSQL_USER`、`MYSQL_PASSWORD`。账号应有该数据库所需的建表、索引和读写权限；仅迁移时使用结构变更权限。
3. 本地网站使用 `AUTH_SITE_URL=http://localhost:3000`，账号服务默认端口 `3001`。网站实际端口发生变化时，两端来源配置必须一致。
4. 为 `AUTH_SECRET` 和 `AUTH_PROXY_SECRET` 分别生成独立的至少 32 字符随机密钥。不要复用数据库密码或站长密码。
5. 填写 `AUTH_ADMIN_EMAIL` 和初始化使用的 `AUTH_ADMIN_PASSWORD`（12–128 位）。初始化后清空后者，登录密码的哈希保存在数据库中。
6. 参考 `.dev.vars.example` 创建本地 `.dev.vars`；设置 `AUTH_BACKEND_URL=http://127.0.0.1:3001`，其中 `AUTH_PROXY_SECRET` 必须与 `.env.auth` 一致。

密码中包含 `#`、空格等字符时，应按环境文件格式使用引号。不要把私人值写入 `.example` 模板，也不要用 `NEXT_PUBLIC_` 等公开前缀暴露服务端配置。

## 初始化与启动

在项目根目录依次运行：

```bash
npm install
npm run auth:migrate
npm run auth:admin
```

迁移仅处理 `pvl_auth_` 前缀的账号、密码账户、会话、验证及限流表，并拒绝检测出的不安全结构变更。不会迁移或清空现有文章等内容。

站长初始化通过本地进程调用完成，将不可变 ID 保存到被忽略的 `.auth-admin.json`，不接受访客 HTTP 请求。已有普通账号不会因邮箱相同被自动提权。初始化成功后清空本地 `AUTH_ADMIN_PASSWORD`，并妥善保留 `.auth-admin.json` 和两个服务密钥。

在两个终端分别运行：

```bash
# 终端一：只监听 127.0.0.1 的账号服务
npm run auth:dev

# 终端二：网站
npm run dev
```

打开网站打印的本地地址，在 `/login` 使用已初始化的站长账号登录，然后访问 `/admin`。修改本地配置后应重启相应服务。

### 初始化中断恢复

如果账号已写入数据库，但初始化中断或本地身份文件未能写入，在确认配置和账号归属后使用：

```bash
npm run auth:admin -- --recover
```

已有完整站长账号必须提供匹配的现有密码；不会覆盖密码。对于初始化仅写入站长用户、尚无任何密码账户或会话的中断状态，该显式本地命令可以补全密码账户。普通账号、封禁账号和其他异常状态不允许自动恢复。已有本地身份文件不会被覆盖。

## 私人配置与 Git

以下文件仅保存在本机，均被 `.gitignore` 忽略：

- `.env.auth`：数据库连接、服务密钥及站长初始化信息。
- `.dev.vars`：本地 Worker 后端连接与共享密钥。
- `.auth-admin.json`：本地站长身份 ID。
- SQL / dump 数据库导出、生成的构建文件与运行目录。

GitHub 只接收通用配置模板、代码与测试。提交前可用 `git check-ignore .env.auth .dev.vars .auth-admin.json` 和 `git diff --cached --stat` 确认忽略与暂存范围；切勿使用 `git add -f` 添加这些文件。

## 验证与发布边界

```bash
npm run test:auth
npm run lint
npm run build
```

自动化集成测试使用隔离的内存 SQLite，运行真实 Better Auth、Node HTTP 服务和代理，覆盖密码哈希、注册、登录、退出、过期会话、站长身份、初始化恢复、来源检查和限流。该测试不会访问私人 MySQL，也不能替代真实 MySQL 连接、迁移、重启持久化和页面链路验收。

当前真实 MySQL 联调需要先补齐本地连接凭据和站长初始密码。未完成前，不宣称数据库已接通。

当前线上站点仍是此前的可视化版本。本机 MySQL 和仅监听回环地址的账号服务不能被 Sites 云端直接访问。上线鉴权前，需要选择可由网站服务端访问的生产账号后端，并通过部署环境的私密配置提供 `AUTH_BACKEND_URL` 和 `AUTH_PROXY_SECRET`；生产 `AUTH_SITE_URL` 使用正式 HTTPS 来源。不要向公网开放 MySQL 端口来替代后端部署。

生产后端与 MySQL 联调完成后，还需验证 HTTPS Cookie、页面权限与服务重启后的会话，然后再发布网站。提交代码到 GitHub 不等于已经更新线上鉴权。
