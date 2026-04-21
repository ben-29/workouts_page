import argparse
import asyncio
import os
import sys
from datetime import datetime

from garmin_sync import Garmin, restore_or_login
from strava_sync import run_strava_sync
from stravaweblib import DataFormat, WebClient
from utils import make_strava_client


async def upload_to_activities(
    garmin_client, strava_client, strava_web_client, format, use_fake_garmin_device
):
    last_activity = await garmin_client.get_activities(0, 1)
    if not last_activity:
        print("no garmin activity")
        filters = {}
    else:
        # is this startTimeGMT must have ?
        after_datetime_str = last_activity[0]["startTimeGMT"]
        after_datetime = datetime.strptime(after_datetime_str, "%Y-%m-%d %H:%M:%S")
        print("garmin last activity date: ", after_datetime)
        filters = {"after": after_datetime}
    strava_activities = list(strava_client.get_activities(**filters))
    files_list = []
    print("strava activities size: ", len(strava_activities))
    if not strava_activities:
        print("no strava activity")
        return files_list

    # strava rate limit
    for i in sorted(strava_activities, key=lambda i: int(i.id)):
        try:
            data = strava_web_client.get_activity_data(i.id, fmt=format)
            files_list.append(data)
        except Exception as ex:
            print("get strava data error: ", ex)
    await garmin_client.upload_activities_original_from_strava(
        files_list, use_fake_garmin_device
    )
    return files_list


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("strava_client_id", help="strava client id")
    parser.add_argument("strava_client_secret", help="strava client secret")
    parser.add_argument("strava_refresh_token", help="strava refresh token")
    parser.add_argument(
        "--garmin-username", dest="garmin_username", help="Garmin username (email)"
    )
    parser.add_argument(
        "--garmin-password", dest="garmin_password", help="Garmin password"
    )
    parser.add_argument("strava_email", nargs="?", help="email of strava")
    parser.add_argument("strava_password", nargs="?", help="password of strava")
    parser.add_argument("strava_jwt", nargs="?", help="jwt token of strava")
    parser.add_argument(
        "--session-cookie",
        dest="session_cookie",
        help="_strava4_session cookie value for strava web login",
    )
    parser.add_argument(
        "--is-cn",
        dest="is_cn",
        action="store_true",
        help="if garmin account is cn",
    )
    parser.add_argument(
        "--use_fake_garmin_device",
        action="store_true",
        default=False,
        help="whether to use a faked Garmin device",
    )
    options = parser.parse_args()
    strava_client = make_strava_client(
        options.strava_client_id,
        options.strava_client_secret,
        options.strava_refresh_token,
    )
    # Get auth credentials from command line args
    jwt = (
        options.strava_jwt
        if hasattr(options, "strava_jwt") and options.strava_jwt
        else ""
    )
    email = options.strava_email if hasattr(options, "strava_email") else ""
    password = options.strava_password if hasattr(options, "strava_password") else ""

    # STRAVA_JWT secret may contain either:
    # 1. A real JWT token (3 dot-separated parts)
    # 2. A _strava4_session cookie value (Strava's new session mechanism)
    # Detect by format and use appropriate login method.
    if jwt:
        parts = jwt.split('.')
        if len(parts) == 3:
            print("Using JWT for Strava web login (passwordless mode)")
            strava_web_client = WebClient(
                access_token=strava_client.access_token,
                jwt=jwt,
            )
        else:
            # Treat as _strava4_session cookie
            print("Using _strava4_session cookie for Strava web login (JWT secret contains session cookie)")
            import requests as _req
            from stravaweblib.webclient import BASE_URL, BeautifulSoup
            # Create a WebClient with dummy auth (required by library),
            # then replace cookies with the real _strava4_session session cookie
            strava_web_client = WebClient(
                access_token=strava_client.access_token,
                email="dummy@example.com",
                password="dummy_password_for_session_replacement",
            )
            # Replace the session with _strava4_session cookie
            strava_web_client._session = _req.Session()
            strava_web_client._session.headers.update({
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            })
            strava_web_client._session.cookies.set(
                '_strava4_session', jwt, domain='.strava.com', secure=True
            )
            # Verify by fetching athlete page to get athlete ID
            resp = strava_web_client._session.get(f"{BASE_URL}/athlete", allow_redirects=False)
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, 'html.parser')
                athlete_link = soup.find('a', href=lambda h: h and '/athletes/' in h)
                if athlete_link:
                    href = athlete_link.get('href', '')
                    athlete_id = href.split('/athletes/')[-1].split('?')[0]
                    strava_web_client._session.cookies.set(
                        'strava_remember_id', athlete_id, domain='.strava.com', secure=True
                    )
            strava_web_client._session.cookies.set(
                'strava_remember_token', jwt, domain='.strava.com', secure=True
            )
    elif email and password:
        print("Using email + password for Strava web login")
        strava_web_client = WebClient(
            access_token=strava_client.access_token,
            email=email,
            password=password,
        )
    else:
        raise ValueError(
            "Must provide either STRAVA_JWT or both STRAVA_EMAIL and STRAVA_PASSWORD"
        )

    garmin_auth_domain = "CN" if options.is_cn else "COM"

    # Priority: environment variables > command line args
    if garmin_auth_domain == "CN":
        garmin_username = os.getenv("GARMIN_CN_USERNAME") or options.garmin_username
        garmin_password = os.getenv("GARMIN_CN_PASSWORD") or options.garmin_password
    else:
        garmin_username = os.getenv("GARMIN_COM_USERNAME") or options.garmin_username
        garmin_password = os.getenv("GARMIN_COM_PASSWORD") or options.garmin_password

    if not garmin_username or not garmin_password:
        print(
            "Missing Garmin credentials: please provide --garmin-username/--garmin-password"
        )
        print(
            "Or set environment variables: GARMIN_COM_USERNAME/GARMIN_CN_USERNAME and GARMIN_COM_PASSWORD/GARMIN_CN_PASSWORD"
        )
        sys.exit(1)

    try:
        garmin_client = restore_or_login(
            garmin_username, garmin_password, garmin_auth_domain
        )
        garmin_wrapper = Garmin(garmin_client, garmin_auth_domain, False)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        future = asyncio.ensure_future(
            upload_to_activities(
                garmin_wrapper,
                strava_client,
                strava_web_client,
                DataFormat.ORIGINAL,
                options.use_fake_garmin_device,
            )
        )
        loop.run_until_complete(future)
    except Exception as err:
        print(err)

    # Run the strava sync
    run_strava_sync(
        options.strava_client_id,
        options.strava_client_secret,
        options.strava_refresh_token,
    )
