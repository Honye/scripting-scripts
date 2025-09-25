import { fetch, Path } from 'scripting'
import { Tree } from './types'
import { OAuth } from '../types'

const headers = {
  Accept: 'application/vnd.github+json'
}
Object.defineProperty(headers, 'Authorization', {
  get() {
    const oauth = Storage.get<OAuth>('oauth')
    return oauth?.accessToken ? `Bearer ${oauth.accessToken}` : undefined
  }
})

/** Get the tree SHA of a folder */
async function getFolderTreeSha(owner: string, repo: string, folderPath: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${folderPath}`
  try {
      const response = await fetch(url, { headers })
      const data = await response.json()

      if (response.status !== 200) {
        throw new Error(`Failed to get folder info: ${data.message}`)
      }

      // The contents API returns an array; we need to find the object representing the folder itself
      // Note: If folderPath is the root, return the sha directly
      if (Array.isArray(data)) {
        // In practice, we should get the latest commit SHA of the branch, then get the tree SHA of that commit
        // For simplicity, here we get the latest commit of the default branch
        const branchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/main`, { headers })
        const branchData = await branchResponse.json()
        return branchData.commit.commit.tree.sha
      } else if (data.type === 'dir') {
        return data.sha
      }
      return null
  } catch (error) {
      console.error(error)
      return null
  }
}

/** Use the Git Trees API to recursively get the file list */
export async function getFileTree(repo: string, treeSha: string, directory: string): Promise<Tree[] | null> {
  const url = `https://api.github.com/repos/${repo}/git/trees/${treeSha}?recursive=1`
  try {
    const response = await fetch(url, { headers })
    const data = await response.json()

    if (response.status !== 200) {
      throw new Error(`Failed to get file tree: ${data.message}`)
    }

    if (data.truncated) {
      console.log('Warning: File list is too long and has been truncated. Some files may not be downloaded.')
    }

    // Filter out files (blobs) under the specified directory
    return data.tree.filter((item: Tree) =>
      item.type === 'blob' && item.path.startsWith(directory)
    )

  } catch (error) {
    console.error(error)
    return null
  }
}

/** Download a single file */
export async function downloadFile(repo: string, filePath: string, destination: string) {
  // Use the Get Contents API to get the file's download_url
  const url = `https://api.github.com/repos/${repo}/contents/${filePath}`
  try {
    const response = await fetch(url, { headers })
    const data = await response.json()

    if (response.status !== 200 || !data.download_url) {
      console.error(`Failed to get download link: ${filePath} - ${data.message || 'No download_url'}`)
      return
    }

    const fileResponse = await fetch(data.download_url)
    if (!fileResponse.ok) {
      throw new Error(`Failed to download file: ${fileResponse.statusText}`)
    }

    const fileContent = await fileResponse.data()

    // Ensure the destination directory exists
    await FileManager.createDirectory(Path.dirname(destination), true)
    await FileManager.writeAsData(destination, fileContent)
    console.log(`Downloaded successfully: ${destination}`)

  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error)
  }
}
