import { fetch } from 'scripting'

export namespace Weibo {
  export interface HotSearchItem {
    title: string
    icon: string
    pic_id: number
    scheme: string
  }
}

export async function fetchHotSearch(): Promise<Weibo.HotSearchItem[]> {
  const url = 'https://weibointl.api.weibo.cn/portal.php?ct=feed&a=search_topic'
  const { data } = await fetch(url).then((resp) => resp.json())
  return data
}
