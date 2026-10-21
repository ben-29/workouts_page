## note1: use v2.0 need change vercel setting from Gatsby to Vite

## note2: 2023.09.26 garmin need secret_string(and in Actions) get `python run_page/garmin_sync.py ${secret_string}` if cn `python run_page/garmin_sync.py ${secret_string} --is-cn`

## note3: 2024.08.19: Added `Elevation Gain` field

- For old data: To include `Elevation Gain` for past activities, perform a full reimport

# [打造个人户外运动主页](http://workouts.ben29.xyz)

![screenshot](https://user-images.githubusercontent.com/6956444/163125711-24d0ad99-490d-4c04-b89f-5b7fe776eb38.png)

简体中文 | [English](README.md)

本项目基于 [running_page](https://github.com/yihong0618/running_page/blob/master/README-CN.md) , 添加了支持多种运动类型。部署可参考原项目操作步骤

## 新增特性

1. 支持多种运动类型，如骑行、徒步、游泳
1. 支持 APP 数据获取
   - **[咕咚](#codoon咕咚)** (因咕咚限制单个设备原因，无法自动化)
   - **[行者](#行者)**
   - **[Google Health](#google-health)**
1. 支持 [自驾(Google 路书)](#自驾google路书) , 把自驾路线也展示在地图上

## 一些个性化选项

### 自定义运动颜色

- 修改骑行颜色: `src/utils/const.js` 里的 `RIDE_COLOR`

### 新增运动类型

- 修改 `scripts/config.py`, `TYPE_DICT` 增加类型映射关系, `MAPPING_TYPE` 里增加运动类型
- 修改 `src/utils/const.js`, 增加类型标题，并加入到 `RUN_TITLES`
- 修改 `src/utils/util.js` 里的 `colorFromType`, 增加 case 指定颜色; `titleForRun` 增加 case 指定类型标题
- 参考这个 [commit](https://github.com/ben-29/workouts_page/commit/f3a35884d626009d33e05adc76bbc8372498f317)
- 或 [留言](https://github.com/ben-29/workouts_page/issues/20)

---

### Codoon（咕咚）

<details>
<summary>获取您的咕咚数据</summary>

```python
python3(python) run_page/codoon_sync.py ${your mobile or email} ${your password}
```

示例：

```python
python3(python) run_page/codoon_sync.py 13333xxxx xxxx
```

> 注：我增加了 Codoon 可以导出 gpx 功能, 执行如下命令，导出的 gpx 会加入到 GPX_OUT 中，方便上传到其它软件

```python
python3(python) run_page/codoon_sync.py ${your mobile or email} ${your password} --with-gpx
```

示例：

```python
python3(python) run_page/codoon_sync.py 13333xxxx xxxx --with-gpx
```

> 注：因为登录 token 有过期时间限制，我增加了 refresh_token&user_id 登陆的方式， refresh_token 及 user_id 在您登陆过程中会在控制台打印出来

![image](https://user-images.githubusercontent.com/6956444/105690972-9efaab00-5f37-11eb-905c-65a198ad2300.png)

示例：

```python
python3(python) run_page/codoon_sync.py 54bxxxxxxx fefxxxxx-xxxx-xxxx --from-auth-token
```

</details>

### 行者

<details>
<summary>获取您的行者数据</summary>

```python
python3(python) scripts/xingzhe_sync.py ${your mobile or email} ${your password}
```

示例：

```python
python3(python) scripts/xingzhe_sync.py 13333xxxx xxxx
```

> 注：我增加了 行者 可以导出 gpx 功能, 执行如下命令，导出的 gpx 会加入到 GPX_OUT 中，方便上传到其它软件

```python
python3(python) scripts/xingzhe_sync.py ${your mobile or email} ${your password} --with-gpx
```

示例：

```python
python3(python) scripts/xingzhe_sync.py 13333xxxx xxxx --with-gpx
```

> 注：因为登录 token 有过期时间限制，我增加了 refresh_token&user_id 登陆的方式， refresh_token 及 user_id 在您登陆过程中会在控制台打印出来

![image](https://user-images.githubusercontent.com/6956444/106879771-87c97380-6716-11eb-9c28-fbf70e15e1c3.png)

示例：

```python
python3(python) scripts/xingzhe_sync.py w0xxx 185000 --from-auth-token
```

</details>

### Google Health

<details>
<summary>获取 Google Health 数据</summary>

<br>

Google Health API 是替代旧 Fitbit Web API 的 v4 Google API。本同步会从 `https://health.googleapis.com/v4/users/me/dataTypes/exercise/dataPoints` 读取 `exercise` 运动记录，再通过 `:exportExerciseTcx?alt=media` 导出 TCX，默认保存到 `TCX_OUT`，最后导入 `data.db` 与 `activities.json`。如果选择 GPX 输出，脚本会基于 v4 TCX 导出在本地转换 GPX，并保存到 `GPX_OUT`。

1. 创建 Google Cloud 项目，启用 Google Health API，并创建 OAuth 2.0 Web client。OAuth 应用还在 Testing 状态时，需要把自己的 Google 账号加入 test users。
   1. 前往 [Google Cloud Console](https://console.cloud.google.com/)，创建或选择一个项目。
   2. 启用 **Google Health API**：
      - 进入 **API和服务 → 库**
      - 搜索 **Google Health API** 并点击 **Enable（启用）**
   3. 创建 OAuth 2.0 凭据：
      - 进入 **API和服务 → 凭证 → 创建凭证 → OAuth 客户端 ID**
      - 应用类型选择 **桌面应用**
      - 记录您的 **Client ID** 和 **Client Secret**
   4. 配置 **OAuth 同意屏幕**（API和服务 → OAuth consent screen）：
      - 用户类型选择 **外部**
      - 将自己添加为 **测试用户（Test user）**
      - 添加以下**两个**授权范围（GPX 和 TCX 均需要）：
        - `https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly`
        - `https://www.googleapis.com/auth/googlehealth.location.readonly`

2. 将下面链接中的 `${client_id}` 替换为你的 Client ID 后在浏览器打开。`redirect_uri` 需要和 Google Cloud 中配置的一致。

   ```plaintext
   https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=http://localhost&response_type=code&access_type=offline&scope=https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly%20https://www.googleapis.com/auth/googlehealth.location.readonly&prompt=consent
   ```

3. 复制返回链接中的 `code`，用它换取 `refresh_token`：

   ```bash
   curl -L -X POST 'https://oauth2.googleapis.com/token' \
   -H 'Content-Type: application/x-www-form-urlencoded' \
   -d 'client_id=${client_id}&client_secret=${client_secret}&code=${code}&redirect_uri=http://localhost&grant_type=authorization_code'
   ```

4. 在项目根目录同步 Google Health 数据：

   ```bash
   python run_page/google_health_sync.py ${client_id} ${client_secret} ${refresh_token}
   ```

   如果只同步跑步：

   ```bash
   python run_page/google_health_sync.py ${client_id} ${client_secret} ${refresh_token} --only-run
   ```

   可选参数：
   - `--start-date YYYY-MM-DD`：同步该日期及之后开始的运动。如果不传，脚本会使用 `data.db` 中最新的 `start_date_local` 作为 Google Health `exercise.interval.civil_start_time` 的起始时间。
   - `--end-date YYYY-MM-DD`：同步该日期之前开始的运动。
   - `--all`：忽略本地数据库日期，向 Google Health 请求全部运动。
   - `--format gpx`：导出 GPX 文件到 `GPX_OUT`；默认是 `--format tcx`。

   GPX 示例：

   ```bash
   python run_page/google_health_sync.py ${client_id} ${client_secret} ${refresh_token} --format gpx
   ```

6. 如果使用 GitHub Actions，把 `GOOGLE_HEALTH_CLIENT_ID`、`GOOGLE_HEALTH_CLIENT_SECRET`、`GOOGLE_HEALTH_REFRESH_TOKEN` 添加到 GitHub Secrets，然后将 `RUN_TYPE` 设置为 `google_health`。
7. 配置 **OAuth 同意屏幕**（API和服务 → OAuth consent screen）：
   - 用户类型选择 **内部**， 否则需要发布应用

</details>

### 自驾(Google 路书)

<details>
<summary>导入谷歌地图的KML路书</summary>

1. 使用 [谷歌地图](https://www.google.com/maps/d/) ，创建地图(路线放到同一个图层)
2. 把图层导出为 KML 文件
3. 把 kml 文件重命名为 `import.kml`, 放到 `scripts`目录
4. 修改`scripts/kml2polyline.py`, 填入路线相关信息

```
# TODO modify here
# 路线名称
track.name = "2020-10 西藏 Road Trip"
# 开始/结束时间 年月日时分
track.start_time = datetime(2020, 9, 29, 10, 0)
track.end_time = datetime(2020, 10, 10, 18, 0)
# 总路程
distance = 4000  # KM
# 总天数
days = 12
# 平均每天自驾时长
hours_per_day = 6
```

5. 控制台执行以下脚本

```python
python3(python) scripts\kml2polyline.py
```

</details>

# 致谢

- @[yihong0618](https://github.com/yihong0618) 特别棒的项目 [running_page](https://github.com/yihong0618/running_page) 非常感谢
