declare const fetch: any

import { VideoItem, VideoDetail, PaginatedResult, Category } from "./models"

const BASE_URL = "https://api.ukuapi.com/api.php/provide/vod/"

// Mapping from config.json
export const CATEGORIES: Category[] = [
  {
    name: "最新",
    hours: "24"
  },
  {
    name: "电影",
    subtabs: [
      { id: 6, name: "动作片" },
      { id: 7, name: "喜剧片" },
      { id: 8, name: "爱情片" },
      { id: 9, name: "科幻片" },
      { id: 10, name: "恐怖片" },
      { id: 11, name: "剧情片" },
      { id: 12, name: "战争片" },
      { id: 20, name: "动漫电影" },
      { id: 24, name: "记录片" },
      { id: 25, name: "伦理片" }
    ]
  },
  {
    name: "电视剧",
    subtabs: [
      { id: 13, name: "国产剧" },
      { id: 14, name: "港澳剧" },
      { id: 15, name: "日剧" },
      { id: 16, name: "欧美剧" },
      { id: 21, name: "台湾剧" },
      { id: 22, name: "韩剧" },
      { id: 23, name: "泰剧" }
    ]
  },
  { name: "综艺", id: 3 },
  { name: "动漫", id: 4 }
]

export const API = {
  async getList(typeId?: number | string, page: number = 1, hours?: string): Promise<PaginatedResult<VideoItem>> {
    let url = `${BASE_URL}?ac=detail&pg=${page}`
    if (typeId) {
      url += `&t=${typeId}`
    }
    if (hours) {
      url += `&h=${hours}`
    }

    try {
      const res = await fetch(url)
      const json = await res.json()

      const list = (json.list || []).map((item: any) => ({
        id: item.vod_id,
        name: item.vod_name,
        pic: item.vod_pic,
        remarks: item.vod_remarks,
        score: item.vod_douban_score || item.vod_score,
        type: item.type_name
      }))

      return {
        list,
        total: json.total || 0,
        page: parseInt(json.page) || page,
        pagecount: json.pagecount || 1
      }
    } catch (e) {
      console.error(e)
      return { list: [], total: 0, page: 1, pagecount: 1 }
    }
  },

  async getSearch(keyword: string, page: number = 1): Promise<PaginatedResult<VideoItem>> {
    const url = `${BASE_URL}?ac=detail&wd=${encodeURIComponent(keyword)}&pg=${page}`
    try {
      const res = await fetch(url)
      const json = await res.json()

       const list = (json.list || []).map((item: any) => ({
        id: item.vod_id,
        name: item.vod_name,
        pic: item.vod_pic,
        remarks: item.vod_remarks,
        score: item.vod_douban_score || item.vod_score,
        type: item.type_name
      }))

      return {
        list,
        total: json.total || 0,
        page: parseInt(json.page) || page,
        pagecount: json.pagecount || 1
      }
    } catch (e) {
      console.error(e)
      return { list: [], total: 0, page: 1, pagecount: 1 }
    }
  },

  async getDetail(id: number): Promise<VideoDetail | null> {
    const url = `${BASE_URL}?ac=detail&ids=${id}`
    try {
      const res = await fetch(url)
      const json = await res.json()
      const item = json.list?.[0]
      if (!item) return null

      // Parse playlist
      const playList = (item.vod_play_url || "").split("$$$").map((groupStr: string, index: number) => {
        const from = (item.vod_play_from || "").split("$$$")[index] || `Line ${index + 1}`
        const urls = groupStr.split("#").map((epStr: string) => {
          const [name, url] = epStr.split("$")
          return { name, url }
        }).filter(ep => ep.url && ep.url.endsWith(".m3u8"))
        return { name: from, urls }
      }).filter((group: any) => group.urls.length > 0)

      // Strip HTML
      const content = item.vod_content
            .replace(/<[^>]+>|\{.*\};?/g, "")
            .replace(/&(#160|nbsp);/gi, " ")
            .replace(/&(#63|quest);/gi, "?")
            .replace(/&(#33|excl);/gi, "!")
            .replace(/&(#34|quot);/gi, '"')
            .replace(/&(#39|apos);/gi, "'")
            .replace(/&(#38|amp);/gi, "&")
            .replace(/&(#60|at);/gi, "<")
            .replace(/&(#62|gt);/gi, ">")
            .replace(/(\x20|\t)+/g, " ")

      return {
        id: item.vod_id,
        name: item.vod_name,
        pic: item.vod_pic,
        remarks: item.vod_remarks,
        score: item.vod_douban_score || item.vod_score,
        type: item.type_name,
        director: item.vod_director,
        actor: item.vod_actor,
        year: item.vod_year,
        area: item.vod_area,
        lang: item.vod_lang,
        class: item.vod_class,
        content: content,
        playList
      }
    } catch (e) {
      console.error(e)
      return null
    }
  }
}
