# Workouts Page

![CI](https://github.com/ben-29/workouts_page/workflows/CI/badge.svg)
[![Deploy to GitHub Pages](https://github.com/ben-29/workouts_page/workflows/Publish%20GitHub%20Pages/badge.svg)](https://ben-29.github.io/workouts_page/)

[简体中文](README-CN.md) | [English](README.md)

基于 [running_page](https://github.com/yihong0618/running_page) 的多运动类型支持版本。

## 功能特性

- 支持多种运动类型：跑步、骑行、游泳、徒步、划船等
- 支持多个数据源：Strava、Nike、Garmin、Keep、Coros 等
- 支持从 Strava 同步数据到 Garmin（或反向）
- 自动生成 GitHub 贡献图风格的 SVG

---

## 目录

- [快速开始](#快速开始)
- [数据源配置](#数据源配置)
- [GitHub Actions 自动同步](#github-actions-自动同步)
- [本地运行](#本地运行)
- [自定义配置](#自定义配置)

---

## 快速开始

### 1. Fork 本仓库

点击右上角 **Fork** 按钮创建你自己的副本。

### 2. 配置 GitHub Secrets

在仓库 Settings → Secrets and variables → Actions 中添加以下密钥：

#### 通用配置

| Secret 名称 | 说明 | 必需 |
|-------------|------|------|
| `STRAVA_CLIENT_ID` | Strava 应用 Client ID | Strava 相关同步必填 |
| `STRAVA_CLIENT_SECRET` | Strava 应用 Client Secret | Strava 相关同步必填 |
| `STRAVA_CLIENT_REFRESH_TOKEN` | Strava 刷新令牌 | Strava 相关同步必填 |

#### Garmin（仅在使用 Garmin 功能时需要）

| Secret 名称 | 说明 |
|-------------|------|
| `GARMIN_COM_USERNAME` | Garmin 国际版用户名（邮箱） |
| `GARMIN_COM_PASSWORD` | Garmin 国际版密码 |
| `GARMIN_CN_USERNAME` | Garmin 中国版用户名（邮箱） |
| `GARMIN_CN_PASSWORD` | Garmin 中国版密码 |

#### Strava Web 登录（用于从 Strava 下载活动数据到 Garmin）

| Secret 名称 | 说明 |
|-------------|------|
| `STRAVA_JWT` | Strava JWT 令牌或 `_strava4_session` cookie 值 |

### 3. 创建 Strava 应用

1. 访问 [Strava Developers](https://www.strava.com/settings/api)
2. 创建应用，填写：
   - Application Name: 任意
   - Category: 数据分析
   - Website: `https://github.com/你的用户名/workouts_page`
   - Authorization Callback Domain: `github.com`
3. 获取 `Client ID`、`Client Secret`
4. 在 Strava API 页面点击 "Authorize" 获取 `Refresh Token`

---

## 数据源配置

编辑 `.github/workflows/run_data_sync.yml` 中的环境变量：

```yaml
env:
  RUN_TYPE: strava  # 数据源类型
  ATHLETE: 你的名字  # 显示在页面上
  TITLE: 你的名字's Workouts  # 页面标题
```

### 支持的 RUN_TYPE

| 类型 | 说明 | 必需 Secrets |
|------|------|--------------|
| `strava` | 从 Strava 同步数据 | STRAVA_* |
| `garmin` | 从 Garmin 国际版同步 | GARMIN_COM_* |
| `garmin_cn` | 从 Garmin 中国版同步 | GARMIN_CN_* |
| `keep` | 从 Keep 同步 | KEEP_MOBILE, KEEP_PASSWORD |
| `coros` | 从 Coros 同步 | COROS_ACCOUNT, COROS_PASSWORD |
| `nike` | 从 Nike 同步 | NIKE_REFRESH_TOKEN |
| `strava_to_garmin` | 从 Strava 下载并上传到 Garmin | STRAVA_*, GARMIN_*, STRAVA_JWT |
| `garmin_to_strava` | 从 Garmin 上传到 Strava | STRAVA_*, GARMIN_* |

---

## GitHub Actions 自动同步

### 工作流程

1. **Run Data Sync** - 定时自动同步数据（每 6 小时）或手动触发
2. **CI** - 验证代码更改
3. **Publish GitHub Pages** - 构建并发布网站

### 手动触发同步

1. 进入仓库 **Actions** 页面
2. 选择 **Run Data Sync** workflow
3. 点击 **Run workflow** → 选择 master 分支

---

## 本地运行

### 1. 安装依赖

```bash
pip install -r requirements.txt

# 单独安装 stravalib 2.0+ 和 stravaweblib
pip install 'stravalib>=2.0.0'
pip install stravaweblib --no-deps
```

### 2. 配置环境变量

```bash
export STRAVA_CLIENT_ID="你的Client ID"
export STRAVA_CLIENT_SECRET="你的Client Secret"
export STRAVA_CLIENT_REFRESH_TOKEN="你的Refresh Token"
```

### 3. 运行同步

```bash
# 同步 Strava 数据
python run_page/strava_sync.py $STRAVA_CLIENT_ID $STRAVA_CLIENT_SECRET $STRAVA_CLIENT_REFRESH_TOKEN

# 同步 Garmin 数据
python run_page/garmin_sync.py

# 从 Strava 下载并上传到 Garmin
python run_page/strava_to_garmin_sync.py $STRAVA_CLIENT_ID $STRAVA_CLIENT_SECRET $STRAVA_CLIENT_REFRESH_TOKEN "" "" $STRAVA_JWT
```

### 4. 本地预览

```bash
pnpm install
pnpm run dev
```

---

## 依赖说明

### 核心库

| 库名 | 版本 | 用途 |
|------|------|------|
| `stravalib` | >=2.0.0 | Strava OAuth API 访问 |
| `stravaweblib` | - | Strava Web 会话（用于下载活动原始文件） |
| `garminconnect` | - | Garmin Connect API 访问（国际版） |
| `garth` | - | Garmin 中国版 API 访问 |
| `sqlalchemy` | - | 数据库 ORM |
| `arrow` | - | 时间处理 |
| `geopy` | - | 地理位置 |

### 认证机制

#### Strava 认证（stravalib）
- 使用 OAuth 2.0 的 Client ID/Secret/Refresh Token
- 仅用于读取活动列表和元数据

#### Strava Web 登录（stravaweblib）
- 使用 JWT 令牌或 `_strava4_session` cookie
- 用于下载活动的原始文件（TCX/FIT）

#### Garmin 认证
- **国际版 (COM)**: 使用 `garminconnect` 库，需要用户名/密码
- **中国版 (CN)**: 使用 `garth` 库，需要用户名/密码

---

## 自定义配置

### 修改页面标题和名称

编辑 `.github/workflows/run_data_sync.yml`：

```yaml
env:
  ATHLETE: 你的名字
  TITLE: 你的名字's Workouts
```

### 修改最小距离筛选

```yaml
MIN_GRID_DISTANCE: 10  # 网格图中显示的最小距离（公里）
```

### 启用月度生命图

```yaml
GENERATE_MONTH_OF_LIFE: true  # 生成月度生命图
BIRTHDAY_MONTH: 1986-12       # 格式：YYYY-MM
```

---

## 常见问题

### Q: Strava 同步成功但网站显示空数据？

确保 `SAVE_DATA_IN_GITHUB_CACHE` 设置为 `false`，让数据推送到仓库。

### Q: Garmin 登录失败 (429 Rate Limited)？

Garmin 对频繁登录有限制。建议：
1. 减少同步频率
2. 等待几分钟后再试
3. 使用已保存的会话 token

### Q: 如何仅同步跑步数据？

添加 `--only-run` 参数：
```bash
python run_page/strava_sync.py ... --only-run
```

---

## 参考

- [running_page](https://github.com/yihong0618/running_page) - 原始项目
- [stravalib](https://github.com/stravalib/stravalib) - Strava Python 客户端
- [garminconnect](https://github.com/cyberjunky/python-garminconnect) - Garmin Connect 客户端
- [garth](https://github.com/matin/garth) - Garmin 中国 API 客户端
