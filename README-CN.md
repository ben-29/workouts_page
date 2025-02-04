# [打造个人户外运动主页](http://workouts.ben29.xyz)

# [这里是白银越野赛全部 21 位逝者的故事](https://github.com/yihong0618/running_page/issues/135)

R.I.P. 希望大家都能健康顺利的跑过终点，逝者安息。

# [打造个人跑步主页](https://yihong.run/running)

[English](README.md) | 简体中文 | [Wiki](https://wiki.mfydev.run/)

1. 支持多种运动类型，如骑行、徒步、游泳
1. 支持 APP 数据获取
   - **[咕咚](#codoon咕咚)** (因咕咚限制单个设备原因，无法自动化)
   - **[行者](#行者)**
1. 支持 [自驾(Google 路书)](#自驾google路书) , 把自驾路线也展示在地图上

## 一些个性化选项

### 自定义运动颜色

> 修改 `src/utils/const.ts` 文件中的样式：

```typescript
// styling: 关闭虚线：设置为 `false`
const USE_DASH_LINE = true;
// styling: 透明度：[0, 1]
const LINE_OPACITY = 0.4;
// styling: 开启隐私模式(不显示地图仅显示轨迹): 设置为 `true`
// 注意：此配置仅影响页面显示，数据保护请参考下方的 "隐私保护"
const PRIVACY_MODE = false;
// styling: 默认关灯: 设置为 `false`, 仅在隐私模式关闭时生效(`PRIVACY_MODE` = false)
const LIGHTS_ON = true;
// styling: 是否显示列 ELEVATION_GAIN
const SHOW_ELEVATION_GAIN = false;
```

> 隐私保护：设置下面环境变量：

- 参考这个 [commit](https://github.com/ben-29/workouts_page/commit/bfb6e9da4f72bdbdec669c42bdd10062558039cd)
---

### Codoon（咕咚）

> 因悦跑圈限制单个设备，无法自动化。

<details>
<summary>获取您的咕咚数据</summary>

```python
python3(python) scripts/codoon_sync.py ${your mobile or email} ${your password}
```

示例：

```python
python3(python) scripts/codoon_sync.py 13333xxxx xxxx
```

Codoon 导出 gpx

```python
python3(python) scripts/codoon_sync.py ${your mobile or email} ${your password} --with-gpx
```

示例：

```python
python3(python) scripts/codoon_sync.py 13333xxxx xxxx --with-gpx
```

> 因为登录 token 有过期时间限制，我增加了 refresh_token&user_id 登陆的方式，refresh_token 及 user_id 在您登陆过程中会在控制台打印出来

![image](https://user-images.githubusercontent.com/6956444/105690972-9efaab00-5f37-11eb-905c-65a198ad2300.png)

示例：

```python
python3(python) scripts/codoon_sync.py 54bxxxxxxx fefxxxxx-xxxx-xxxx --from-auth-token
```

</details>

### 行者

<details>
<summary>获取您的郁金香运动数据</summary>

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

### Garmin

<details>
<summary>获取您的 Garmin 数据</summary>

<br>

- 如果你只想同步跑步数据增加命令 --only-run

- 如果你想同步 `tcx` 格式，增加命令 --tcx

- 如果你想同步 `fit` 格式，增加命令 --fit

- 如果你使用 Garmin 作为数据源建议您将代码拉取到本地获取 Garmin 国际区的密钥，注意**Python 版本必须>=3.8**

#### 获取佳明国际区的密钥

在终端中输入以下命令

```bash
# 获取密钥
python3(python) run_page/get_garmin_secret.py ${your email} ${your password}
```

#### 执行佳明国际区同步脚本

```python
python3(python) scripts\kml2polyline.py
```

</details>

### Garmin_to_Strava

- @[yihong0618](https://github.com/yihong0618) 特别棒的项目 [running_page](https://github.com/yihong0618/running_page) 非常感谢
