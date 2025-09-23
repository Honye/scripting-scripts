import { fetch, Path } from 'scripting'
import { downloadFile, getFileTree } from './apis/github'

/**
 * @param repo owner/repo
 * @param path script.json file path
 * @param name script name
 */
export async function download(repo: string, branch: string, path: string, name: string) {
  console.log('Start downloading...')
  const folder = path.replace(/script\.json$/, '')
  // To locate the folder more accurately, we first get the root tree sha of the branch
  const branchUrl = `https://api.github.com/repos/${repo}/branches/${branch}`
  const branchRes = await fetch(branchUrl, {
    headers: { Accept: 'application/vnd.github+json' }
  })
  const branchData = await branchRes.json()
  if (!branchRes.ok) {
    console.error('Failed to get branch info:', branchData.message)
    return
  }
  const rootTreeSha = branchData.commit.commit.tree.sha

  const filesToDownload = await getFileTree(repo, rootTreeSha, folder)

  if (!filesToDownload) {
      console.log('Failed to get file list, script terminated.')
      return
  }

  console.log(`Found ${filesToDownload.length} files, preparing to download...`)

  for (const file of filesToDownload) {
      // Build the local save path, while removing the FOLDER_PATH prefix
      const relativePath = file.path.replace(new RegExp(`^${folder}`), '').replace(/^\//, '')
      const localPath = Path.join(
        Path.join(FileManager.scriptsDirectory, name)
        , relativePath
      )

      await downloadFile(repo, file.path, localPath)
  }

  console.log('All download tasks completed!')
}
