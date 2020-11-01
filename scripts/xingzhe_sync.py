import argparse
import logging
import os
import time
import datetime
import re
import sys
import traceback
import asyncio
import httpx
import aiofiles

from config import GPX_FOLDER, JSON_FILE, SQL_FILE, config
from utils import make_activities_file

logger = logging.getLogger(__name__)


XINGZHE_URL_DICT = {
    "BASE_URL": "https://www.imxingzhe.com/user/login",

    "ACTIVITY_LIST_URL": "https://www.imxingzhe.com/api/v4/user_month_info/?",
    "DOWNLOAD_GPX_URL": "https://www.imxingzhe.com/xing",
    "SSO_URL_ORIGIN": "https://www.imxingzhe.com/portal/",
}



class Xingzhe:
    def __init__(self, userId):
        self.req = httpx.AsyncClient(timeout=httpx.Timeout(60.0))
        self.URL_DICT = (XINGZHE_URL_DICT)
        self.activity_list_url = self.URL_DICT.get("ACTIVITY_LIST_URL")
        self.download_gpx_url = self.URL_DICT.get("DOWNLOAD_GPX_URL")
        self.userId = userId

        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36",
            "origin": self.URL_DICT.get("SSO_URL_ORIGIN"),
            "Cookie": "Hm_lvt_7b262f3838ed313bc65b9ec6316c79c4=1604145562; rd=srYg; csrftoken=EMuLFpJNL0YgEaaHbaSoHuDlhmzCaA2D; sessionid=hb1lcvewzl2vdrknh91x6wvby804z7zp; Hm_lpvt_7b262f3838ed313bc65b9ec6316c79c4=1604214872"
        }

    async def fetch_data(self, url, retrying=False):
        """
        Fetch and return data
        """
        try:
            response = await self.req.get(url, headers=self.headers)
            if response.status_code == 429:
                raise Exception("Too many requests")
            logger.debug(f"fetch_data got response code {response.status_code}")
            response.raise_for_status()
            json = response.json()
            print(json)
            if json != None \
                    and json['data'] != None\
                    and len(json['data']):
                return json['data']['wo_info']
            return []
        except Exception as err:
            if retrying:
                logger.debug(
                    "Exception occurred during data retrieval, relogin without effect: %s"
                    % err
                )
                raise Exception("Error connecting") from err
            else:
                logger.debug(
                    "Exception occurred during data retrieval - perhaps session expired - trying relogin: %s"
                    % err
                )
                await self.fetch_data(url, retrying=True)


    async def get_activities_by_month(self, year, month):
        """
        Fetch available activities
        """
        url = f"{self.activity_list_url}user_id={self.userId}&year={year}&month={month}"
        print(url)
        return await self.fetch_data(url)


    async def get_activities(self):
        """
        Fetch available activities
        """
        results = []
        startYear = 2014
        # nowDate = datetime.date.today()
        # nowDate = datetime.date(2017, 10, 1)
        nowDate = datetime.date(2014, 11, 1)
        while startYear < nowDate.year:
            for m in range(12):
                print(startYear)
                activities = await self.get_activities_by_month(year=startYear, month=m+1)
                if len(activities) == 0:
                    pass
                logger.info(f"{startYear} - {m}: {activities}")
                ids = list(map(lambda a: str(a.get("id", "")), activities))
                results = results + ids
                logger.debug(f"Activity IDs: {ids}")
            startYear = startYear +1
        for m in range(nowDate.month):
            activities = await self.get_activities_by_month(year=startYear, month=m+1)
            if len(activities) == 0:
                pass
            logger.info(f"{startYear} - {m}: {activities}")
            ids = list(map(lambda a: str(a.get("id", "")), activities))
            results = results + ids
            logger.debug(f"Activity IDs: {ids}")
        return results

    async def download_activity(self, activity_id):
        url = f"{self.download_gpx_url}/{activity_id}/gpx/"
        logger.info(f"Download activity from {url}")
        response = await self.req.get(url, headers=self.headers)
        response.raise_for_status()
        return response.read()


async def download_garmin_gpx(client, activity_id):
    try:
        gpx_data = await client.download_activity(activity_id)
        file_path = os.path.join(GPX_FOLDER, f"{activity_id}.gpx")
        async with aiofiles.open(file_path, "wb") as fb:
            await fb.write(gpx_data)
    except:
        print(f"Failed to download activity {activity_id}: ")
        traceback.print_exc()
        pass


async def get_activity_id_list(client):
    return await client.get_activities()


async def gather_with_concurrency(n, tasks):
    semaphore = asyncio.Semaphore(n)

    async def sem_task(task):
        async with semaphore:
            return await task

    return await asyncio.gather(*(sem_task(task) for task in tasks))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("userId", nargs="?", help="userId of xingzhe")
    options = parser.parse_args()
    userId = options.userId
    if userId == None:
        print("Missing argument nor valid configuration file")
        sys.exit(1)

    # make gpx dir
    if not os.path.exists(GPX_FOLDER):
        os.mkdir(GPX_FOLDER)

    async def download_new_activities():
        client = Xingzhe(userId)

        # because I don't find a para for after time, so I use garmin-id as filename
        # to find new run to generage
        downloaded_ids = [i.split(".")[0] for i in os.listdir(GPX_FOLDER) if not i.startswith(".")]
        activity_ids = await get_activity_id_list(client)
        print(activity_ids)
        to_generate_garmin_ids = list(set(activity_ids) - set(downloaded_ids))
        print(f"{len(to_generate_garmin_ids)} new activities to be downloaded")

        start_time = time.time()
        await gather_with_concurrency(
            10, [download_garmin_gpx(client, id) for id in to_generate_garmin_ids]
        )
        print(f"Download finished. Elapsed {time.time()-start_time} seconds")
        make_activities_file(SQL_FILE, GPX_FOLDER, JSON_FILE)

    loop = asyncio.get_event_loop()
    future = asyncio.ensure_future(download_new_activities())
    loop.run_until_complete(future)
