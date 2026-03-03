import { Path, Script } from 'scripting'

const folderPath = Path.join(
  FileManager.appGroupDocumentsDirectory,
  Script.name
)
const DB_PATH = Path.join(folderPath, 'repos.db')

if (!FileManager.existsSync(folderPath)) {
  try {
    FileManager.createDirectory(folderPath)
  } catch (e) {
    console.error('Failed to create directory:', e)
  }
}

const db = SQLite.open(DB_PATH)

export interface Repo {
  id: number
  owner: string
  repo: string
  created_at: number
}

export interface RepoScript {
  id: number
  repo_id: number
  name: string
  color: string | null
  icon: string | null
}

export interface ScriptInfo {
  name: string
  color: string | null
  icon: string | null
}

export const DB = {
  async init() {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS repos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner TEXT NOT NULL,
        repo TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        UNIQUE(owner, repo)
      )
    `)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS repo_scripts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        color TEXT,
        icon TEXT,
        FOREIGN KEY (repo_id) REFERENCES repos(id) ON DELETE CASCADE,
        UNIQUE(repo_id, name)
      )
    `)
    // Migrate: add color and icon columns if they don't exist (for old databases)
    try {
      await db.execute('ALTER TABLE repo_scripts ADD COLUMN color TEXT')
    } catch {}
    try {
      await db.execute('ALTER TABLE repo_scripts ADD COLUMN icon TEXT')
    } catch {}
  },

  async getRepos(): Promise<Repo[]> {
    return await db.fetchAll<Repo>(
      'SELECT id, owner, repo, created_at FROM repos ORDER BY created_at DESC'
    )
  },

  async addRepo(owner: string, repo: string): Promise<number> {
    await db.execute(
      'INSERT OR IGNORE INTO repos (owner, repo, created_at) VALUES (?, ?, ?)',
      [owner, repo, Date.now()]
    )
    const row = await db.fetchOne<{ id: number }>(
      'SELECT id FROM repos WHERE owner = ? AND repo = ?',
      [owner, repo]
    )
    return row.id
  },

  async removeRepo(id: number) {
    await db.execute('DELETE FROM repo_scripts WHERE repo_id = ?', [id])
    await db.execute('DELETE FROM repos WHERE id = ?', [id])
  },

  async getScripts(repoId: number): Promise<RepoScript[]> {
    return (
      (await db.fetchAll<RepoScript>(
        'SELECT id, repo_id, name, color, icon FROM repo_scripts WHERE repo_id = ? ORDER BY name',
        [repoId]
      )) || []
    )
  },

  async saveScripts(repoId: number, scripts: ScriptInfo[]) {
    await db.execute('DELETE FROM repo_scripts WHERE repo_id = ?', [repoId])
    for (const script of scripts) {
      await db.execute(
        'INSERT INTO repo_scripts (repo_id, name, color, icon) VALUES (?, ?, ?, ?)',
        [repoId, script.name, script.color, script.icon]
      )
    }
  }
}

export const initPromise = DB.init()
