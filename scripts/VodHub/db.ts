import { Path, Script } from "scripting"
import { VideoDetail, VideoItem } from "./models"



const folderPath = Path.join(FileManager.appGroupDocumentsDirectory, Script.name)
const DB_PATH = Path.join(folderPath, "favorites.db")

// Ensure directory exists
if (!FileManager.existsSync(folderPath)) {
  try {
    FileManager.createDirectory(folderPath)
  } catch (e) {
    console.error("Failed to create directory:", e)
  }
}

const db = SQLite.open(DB_PATH)

export const DB = {
  async init() {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY,
        name TEXT,
        pic TEXT,
        remarks TEXT,
        score TEXT,
        type TEXT,
        detail_json TEXT,
        source_id INTEGER,
        created_at INTEGER
      )
    `)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS history (
        id INTEGER PRIMARY KEY,
        name TEXT,
        pic TEXT,
        remarks TEXT,
        score TEXT,
        type TEXT,
        detail_json TEXT,
        episode_index INTEGER,
        episode_name TEXT,
        progress INTEGER,
        source_id INTEGER,
        updated_at INTEGER
      )
    `)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL UNIQUE
      )
    `)
    // 插入默认数据源（如果不存在）
    const defaultUrl = "https://api.ukuapi.com/api.php/provide/vod/"
    const existing = await db.fetchOne("SELECT id FROM data_sources WHERE url = ?", [defaultUrl])
    if (!existing) {
      await db.execute("INSERT INTO data_sources (name, url) VALUES (?, ?)", ["优酷资源", defaultUrl])
    }
  },

  // 设置相关方法
  async getSetting(key: string): Promise<string | null> {
    const result = await db.fetchOne<{ value: string }>("SELECT value FROM settings WHERE key = ?", [key])
    return result ? result.value : null
  },

  async setSetting(key: string, value: string) {
    await db.execute(`
      INSERT OR REPLACE INTO settings (key, value)
      VALUES (?, ?)
    `, [key, value])
  },

  // 视频播放速度设置
  async getPlaybackRate(): Promise<number> {
    const rate = await this.getSetting('playback_rate')
    return rate ? parseFloat(rate) : 1.0
  },

  async setPlaybackRate(rate: number) {
    await this.setSetting('playback_rate', rate.toString())
  },

  // 数据源管理 - 使用 data_sources 表
  async getDataSources(): Promise<{ id: number; name: string; url: string }[]> {
    return await db.fetchAll("SELECT id, name, url FROM data_sources ORDER BY id")
  },

  async addDataSource(name: string, url: string): Promise<boolean> {
    try {
      await  db.execute("INSERT INTO data_sources (name, url) VALUES (?, ?)", [name, url])
      return true
    } catch (e) {
      console.error("Failed to add data source:", e)
      return false
    }
  },

  async deleteDataSource(id: number) {
    await db.execute("DELETE FROM data_sources WHERE id = ?", [id])
  },

  async getCurrentDataSourceUrl(): Promise<string> {
    const url = await this.getSetting('current_data_source_url')
    return url || "https://api.ukuapi.com/api.php/provide/vod/"
  },

  async setCurrentDataSourceUrl(url: string) {
    await this.setSetting('current_data_source_url', url)
  },

  // 获取当前数据源 ID
  async getCurrentDataSourceId(): Promise<number | null> {
    const currentUrl = await this.getCurrentDataSourceUrl()
    const sources = await this.getDataSources()
    const source = sources.find(s => s.url === currentUrl)
    return source?.id ?? null
  },

  // 根据 ID 获取数据源 URL
  async getDataSourceUrlById(id: number): Promise<string | null> {
    const result = await db.fetchOne<{ url: string }>("SELECT url FROM data_sources WHERE id = ?", [id])
    return result?.url ?? null
  },

  async addFavorite(video: VideoDetail, sourceId: number | null) {
    await db.execute(`
      INSERT OR REPLACE INTO favorites (id, name, pic, remarks, score, type, detail_json, source_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      video.id,
      video.name,
      video.pic,
      video.remarks,
      video.score,
      video.type,
      JSON.stringify(video),
      sourceId,
      Date.now()
    ])
  },

  async removeFavorite(id: number) {
    await  db.execute("DELETE FROM favorites WHERE id = ?", [id])
  },

  async isFavorited(id: number): Promise<boolean> {
    const result = await db.fetchOne("SELECT id FROM favorites WHERE id = ?", [id])
    return !!result
  },

  async getFavorites() {
    const rows = await db.fetchAll<any>("SELECT * FROM favorites ORDER BY created_at DESC")
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      pic: row.pic,
      remarks: row.remarks,
      score: row.score,
      type: row.type,
      source_id: row.source_id
    }))
  },

  async addHistory(video: VideoDetail, episodeIndex: number, episodeName: string, progress: number, sourceId: number | null) {
    await db.execute(`
      INSERT OR REPLACE INTO history (id, name, pic, remarks, score, type, detail_json, episode_index, episode_name, progress, source_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      video.id,
      video.name,
      video.pic,
      video.remarks,
      video.score,
      video.type,
      JSON.stringify(video),
      episodeIndex,
      episodeName,
      progress || 0,
      sourceId,
      Date.now()
    ])
  },

  async getHistory() {
    const rows = await db.fetchAll<any>("SELECT * FROM history ORDER BY updated_at DESC")
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      pic: row.pic,
      remarks: row.remarks,
      score: row.score,
      type: row.type,
      episode_index: row.episode_index,
      episode_name: row.episode_name,
      progress: row.progress,
      source_id: row.source_id
    }))
  },

  async getHistoryOne(id: number) {
    return await db.fetchOne<any>("SELECT * FROM history WHERE id = ?", [id])
  },

  async removeHistory(id: number) {
    await  db.execute("DELETE FROM history WHERE id = ?", [id])
  }
}

// Initialize on load
DB.init()
