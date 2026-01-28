import { Path } from "scripting"
import { VideoDetail, VideoItem } from "./models"



const folderPath = Path.join(FileManager.appGroupDocumentsDirectory, "影视大全")
const DB_PATH = Path.join(folderPath, "favorites.db")

// Ensure directory exists
if (!FileManager.existsSync(folderPath)) {
  try {
    FileManager.createDirectory(folderPath)
  } catch (e) {
    console.error("Failed to create directory:", e)
  }
}

const queue = SQLite.openQueue(DB_PATH)

export const DB = {
  init() {
    queue.write((db: any) => {
      db.execute(`
        CREATE TABLE IF NOT EXISTS favorites (
          id INTEGER PRIMARY KEY,
          name TEXT,
          pic TEXT,
          remarks TEXT,
          score TEXT,
          type TEXT,
          detail_json TEXT,
          created_at INTEGER
        )
      `)
    })
  },

  addFavorite(video: VideoDetail) {
    queue.write((db: any) => {
      db.execute(`
        INSERT OR REPLACE INTO favorites (id, name, pic, remarks, score, type, detail_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        video.id,
        video.name,
        video.pic,
        video.remarks,
        video.score,
        video.type,
        JSON.stringify(video),
        Date.now()
      ])
    })
  },

  removeFavorite(id: number) {
    queue.write((db: any) => {
      db.execute("DELETE FROM favorites WHERE id = ?", [id])
    })
  },

  isFavorited(id: number): boolean {
    return queue.read((db: any) => {
      const result = db.fetchOne("SELECT id FROM favorites WHERE id = ?", [id])
      return !!result
    })
  },

  getFavorites(): VideoItem[] {
    return queue.read((db: any) => {
      const rows = db.fetchAll("SELECT * FROM favorites ORDER BY created_at DESC") as any[]
      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        pic: row.pic,
        remarks: row.remarks,
        score: row.score,
        type: row.type
      }))
    })
  }
}

// Initialize on load
DB.init()
