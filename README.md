# [Create a personal workouts home page](http://workouts.ben29.xyz)

    ```bash
      python run_page/db_updater.py
    ```
    - For old data: To include `Elevation Gain` for past activities, perform a full reimport. 
    - To show the 'Elevation Gain' column, modify `SHOW_ELEVATION_GAIN` in `src/utils/const.ts`
    - note: `Elevation Gain` may be inaccurate. You can use Strava's "Correct Elevation" or Garmin's "Elev Corrections" feature for more precise data. 

<p align="center">
  <img width="150" src="https://raw.githubusercontent.com/shaonianche/gallery/master/running_page/running_page_logo.png" />
</p>

<h3 align="center">
  <a href="https://yihong.run"> Create a personal running home page </a>
</h3>

<p align="center">
  <a href="https://github.com/yihong0618/running_page/actions"><img src="https://github.com/yihong0618/running_page/actions/workflows/run_data_sync.yml/badge.svg" alt="Github Action"></a>
  <a href="https://t.me/running_page"><img src="https://badgen.net/badge/icon/join?icon=telegram&amp;label=usergroup" alt="Chat on telegram"></a>
</p>

1. support multi sports types, like Ride/Hike/Swim/Rowing
1. support new apps
   - **[Codoon（咕咚）](#codoon咕咚)** (Couldn't automate for its limitation from the server side)
   - **[Xingzhe（行者）](#xingzhe行者)**
1. support [RoadTrip(GoogleMaps)](#roadtripgooglemaps), show Road Trip on maps

## Custom your page

### Change Sports Color

```typescript
siteMetadata: {
  siteTitle: 'Running Page', #website title
  siteUrl: 'https://yihong.run', #website url
  logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTtc69JxHNcmN1ETpMUX4dozAgAN6iPjWalQ&usqp=CAU', #logo img
  description: 'Personal site and blog',
  navLinks: [
    {
      name: 'Blog', #navigation name
      url: 'https://yihong.run/running', #navigation url
    },
    {
      name: 'About',
      url: 'https://github.com/yihong0618/running_page/blob/master/README-CN.md',
    },
  ],
},
```

- Modifying styling in `src/utils/const.ts`

```typescript
// styling: set to `false` if you want to disable dash-line route
const USE_DASH_LINE = true;
// styling: route line opacity: [0, 1]
const LINE_OPACITY = 0.4;
// styling: set to `true` if you want to display only the routes without showing the map
// Note: This config only affects the page display; please refer to "privacy protection" below for data protection
const PRIVACY_MODE = false;
// styling: set to `false` if you want to make light off as default, only effect when `PRIVACY_MODE` = false
const LIGHTS_ON = true;
// set to `true` if you want to show the 'Elevation Gain' column
const SHOW_ELEVATION_GAIN = true;
```

- To use Google Analytics, you need to modify the configuration in the `src/utils/const.ts` file.

---

### Codoon（咕咚）

<details>
<summary>Make your <code>GPX</code> data</summary>

```python
python3(python) scripts/codoon_sync.py ${your mobile or email} ${your password}
```

example：

```python
python3(python) scripts/codoon_sync.py 13333xxxx xxxx
```

only-run：

![image](https://user-images.githubusercontent.com/6956444/105690972-9efaab00-5f37-11eb-905c-65a198ad2300.png)

example：

```python
python3(python) scripts/codoon_sync.py 54bxxxxxxx fefxxxxx-xxxx-xxxx --from-auth-token
```

</details>

### Garmin-CN(China)

<details>
<summary>Get your <code>Garmin-CN</code> data</summary>

```python
python3(python) scripts/xingzhe_sync.py ${your mobile or email} ${your password}
```

![get_garmin_cn_secret](docs/get_garmin_cn_secret.jpg)

#### Execute Garmin CN Sync Script

Copy the Secret output in the terminal,If you are using Github, please configure **GARMIN_SECRET_STRING_CN** in Github Action.
![get_garmin_secret](docs/add_garmin_secret_cn_string.jpg)

example：

```python
python3(python) scripts/xingzhe_sync.py 13333xxxx xxxx
```

only-run：

```bash
python3(python) run_page/garmin_sync.py xxxxxxxxxxxxxx(secret_string)  --is-cn --only-run
```

</details>

### Garmin-CN to Garmin

<details>
<summary> Sync your <code>Garmin-CN</code> data to <code>Garmin</code></summary>

<br>

- If you only want to sync `type running` add args --only-run
**The Python version must be >=3.10**

#### Get Garmin CN Secret

Enter the following command in the terminal

```bash
# to get secret_string
python3(python) run_page/get_garmin_secret.py ${your email} ${your password} --is-cn
```

#### Get Garmin Secret

Enter the following command in the terminal

```bash
# to get secret_string
python3(python) run_page/get_garmin_secret.py ${your email} ${your password}
```

#### Sync Garmin CN to Garmin

Enter the following command in the terminal

```bash
# to sync garmin-cn to garmin-global
python3(python) run_page/garmin_sync_cn_global.py ${garmin_cn_secret_string} ${garmin_secret_string}
```

</details>

### Nike Run Club New

<details>
<summary>Get your <code>Nike Run Club</code> data</summary>

<br>

> Please note:Due to the discontinuation of Nike Run Club in mainland China, you can only log in through a VPN. Before starting, please ensure that you are using a global non-mainland China proxy, allowing you to access `nike.com` instead of `nike.com.cn`, as shown in the following image.

![nike.com](https://github.com/user-attachments/assets/8ce6ae8f-4bc6-4522-85ec-3e5b7590e96d)
<br>

1. Sign in/Sign up [NikeRunClub](https://www.nike.com/) account
   ![login](https://github.com/user-attachments/assets/659341fb-4abf-491e-bda7-bfca968921b3)
2. after successful login,openF12->Application->localstorage-> copy the content of "access_token" from the value of key`https://www.nike.com`.
3. Execute in the root directory , you should be able to see the image below, and then you can log into your account on the mobile as usual:

```bash
python3(python) run_page/nike_sync.py ${access_token}
```
![tg_image_166091873](https://github.com/user-attachments/assets/9d4851d6-849a-4bb7-8ffe-5358fa7328b2)

if you want to automate the submission of NRC data, you can refer to [issue692](https://github.com/yihong0618/running_page/issues/692#issuecomment-2218849713).

If you've previously synced activities and want to continue syncing new ones, with `--continue-sync` args

```bash
python3(python) run_page/nike_sync.py ${access_token} --continue-sync
```

</details>

![image](https://user-images.githubusercontent.com/6956444/106879771-87c97380-6716-11eb-9c28-fbf70e15e1c3.png)

example：

```python
python3(python) scripts/xingzhe_sync.py w0xxx 185000 --from-auth-token
```

![example img](https://raw.githubusercontent.com/shaonianche/gallery/master/running_page/nike_sync_%20example.png)

</details>

### Strava

<details>
<summary> Get your <code>Strava</code> data </summary>

<br>

1. Sign in/Sign up [Strava](https://www.strava.com/) account
2. Open after successful Signin [Strava Developers](http://developers.strava.com) -> [Create & Manage Your App](https://strava.com/settings/api)
3. Create `My API Application`: Enter the following information

<br>

![My API Application](https://raw.githubusercontent.com/shaonianche/gallery/master/running_page/strava_settings_api.png)

Created successfully:

<br>

![](https://raw.githubusercontent.com/shaonianche/gallery/master/running_page/created_successfully_1.png)

4. Use the link below to request all permissions: Replace `${your_id}` in the link with `My API Application` Client ID

```
https://www.strava.com/oauth/authorize?client_id=${your_id}&response_type=code&redirect_uri=http://localhost/exchange_token&approval_prompt=force&scope=read_all,profile:read_all,activity:read_all,profile:write,activity:write
```

5. Execute in Console

```python
python3(python) scripts\kml2polyline.py
```

</details>

# Special thanks

- @[yihong0618](https://github.com/yihong0618) for Awesome [running_page](https://github.com/yihong0618/running_page), Great Thanks
