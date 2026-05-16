提供对 GitHub REST API 的已认证访问能力。

使用前提：

* 需要在 `Settings → GitHub` 中配置 Personal Access Token
* 每个脚本或 Skill 拥有独立的权限授权状态（按能力划分）
* 首次调用某个能力时会触发授权请求
* Token 存储在 iCloud 同步的 Keychain 中，JS 层不可访问

限制说明：

* 在 Extension 环境（Widget / Keyboard / Notification）中无法弹出授权 UI
* 若未在主 App 中完成授权，在这些环境调用 API 会失败

---

## 权限模型

### Permission

表示脚本或 Skill 可申请的权限：

```ts
type Permission =
  | "read_profile"
  | "read_repos"
  | "read_contents"
  | "write_contents"
  | "read_issues"
  | "write_issues"
  | "read_pull_requests"
  | "write_pull_requests"
  | "read_actions"
  | "write_actions"
  | "search_repositories"
  | "search_issues"
  | "search_code"
```

---

### 权限状态

```ts
"allowed" | "denied" | "unset"
```

* `allowed`：已授权
* `denied`：已拒绝
* `unset`：未请求

---

## 可用性检测

### Availability

```ts
type Availability = {
  available: boolean
  proRequired: boolean
  tokenConfigured: boolean
}
```

---

### isAvailable()

```ts
const ok = GitHub.isAvailable()

if (!ok) {
  console.log("GitHub API 不可用，请检查 token 配置")
}
```

说明：

* 判断 token 是否配置
* 不检查权限状态

---

### getAvailability()

```ts
const availability = await GitHub.getAvailability()

console.log(availability.available)
console.log(availability.tokenConfigured)
```

---

## 权限管理

### getPermissionStatus()

```ts
const status = await GitHub.getPermissionStatus({
  permission: "read_repos"
})

console.log(status) // allowed / denied / unset
```

---

### requestPermissions()

```ts
const granted = await GitHub.requestPermissions([
  "read_repos",
  "read_contents"
])

console.log("已授权权限:", granted)
```

说明：

* 批量请求权限
* 返回最终被允许的权限集合

---

## 通用类型

### SortDirection

```ts
type SortDirection = "asc" | "desc"
```

---

### ArchiveFormat

```ts
type ArchiveFormat = "zipball" | "tarball"
```

---

### CommitterIdentity

```ts
type CommitterIdentity = {
  name: string
  email: string
  date?: string
}
```

---

## 用户与仓库

### getViewer()

获取当前用户：

```ts
const user = await GitHub.getViewer()

console.log(user.login)
```

---

### getRepo()

```ts
const repo = await GitHub.getRepo({
  owner: "facebook",
  repo: "react"
})

console.log(repo.full_name)
```

---

### listRepos()

```ts
const repos = await GitHub.listRepos({
  sort: "updated",
  perPage: 10
})

repos.forEach(r => {
  console.log(r.full_name)
})
```

---

### listUserRepos()

```ts
const repos = await GitHub.listUserRepos({
  username: "torvalds",
  perPage: 5
})

console.log(repos.map(r => r.name))
```

---

## 分支与提交

### listBranches()

```ts
const branches = await GitHub.listBranches({
  owner: "apple",
  repo: "swift"
})

console.log(branches.map(b => b.name))
```

---

### listCommits()

```ts
const commits = await GitHub.listCommits({
  owner: "apple",
  repo: "swift",
  perPage: 5
})

commits.forEach(c => {
  console.log(c.sha)
})
```

---

### compareCommits()

```ts
const result = await GitHub.compareCommits({
  owner: "apple",
  repo: "swift",
  base: "main",
  head: "feature-branch"
})

console.log(result.status)
```

---

## 文件内容

### getContent()

```ts
const content = await GitHub.getContent({
  owner: "octocat",
  repo: "Hello-World",
  path: "README.md"
})

console.log(content)
```

---

### getTextContent()

```ts
const file = await GitHub.getTextContent({
  owner: "octocat",
  repo: "Hello-World",
  path: "README.md"
})

console.log(file.text)
```

---

### getRawContent()

```ts
const data = await GitHub.getRawContent({
  owner: "octocat",
  repo: "Hello-World",
  path: "image.png"
})

// 可用于写入文件或处理二进制
```

---

### putContent()

```ts
await GitHub.putContent({
  owner: "yourname",
  repo: "test-repo",
  path: "hello.txt",
  message: "add file",
  content: "Hello from Scripting"
})
```

更新文件：

```ts
const file = await GitHub.getContent({
  owner: "yourname",
  repo: "test-repo",
  path: "hello.txt"
})

await GitHub.putContent({
  owner: "yourname",
  repo: "test-repo",
  path: "hello.txt",
  message: "update file",
  content: "Updated content",
  sha: file.sha
})
```

---

### deleteContent()

```ts
await GitHub.deleteContent({
  owner: "yourname",
  repo: "test-repo",
  path: "hello.txt",
  message: "delete file",
  sha: "file_sha"
})
```

---

### downloadArchive()

```ts
const archive = await GitHub.downloadArchive({
  owner: "facebook",
  repo: "react"
})

// 返回压缩包 Data
```

---

## Issues

### listIssues()

```ts
const issues = await GitHub.listIssues({
  owner: "facebook",
  repo: "react",
  state: "open"
})

console.log(issues.length)
```

---

### createIssue()

```ts
const issue = await GitHub.createIssue({
  owner: "yourname",
  repo: "test-repo",
  title: "Bug report",
  body: "Something is wrong"
})

console.log(issue.number)
```

---

### createIssueComment()

```ts
await GitHub.createIssueComment({
  owner: "yourname",
  repo: "test-repo",
  issueNumber: 1,
  body: "Thanks for reporting"
})
```

---

## Pull Requests

### listPullRequests()

```ts
const prs = await GitHub.listPullRequests({
  owner: "facebook",
  repo: "react",
  state: "open"
})

console.log(prs.length)
```

---

### createPullRequest()

```ts
const pr = await GitHub.createPullRequest({
  owner: "yourname",
  repo: "test-repo",
  title: "Add feature",
  head: "feature-branch",
  base: "main",
  body: "Description"
})

console.log(pr.html_url)
```

---

## GitHub Actions

### listWorkflows()

```ts
const workflows = await GitHub.listWorkflows({
  owner: "yourname",
  repo: "test-repo"
})

console.log(workflows)
```

---

### dispatchWorkflow()

```ts
await GitHub.dispatchWorkflow({
  owner: "yourname",
  repo: "test-repo",
  workflow: "ci.yml",
  ref: "main",
  inputs: {
    env: "prod"
  }
})
```

---

## 搜索 API

### searchRepositories()

```ts
const result = await GitHub.searchRepositories({
  query: "react stars:>100000",
  sort: "stars"
})

console.log(result.items.length)
```

---

### searchIssues()

```ts
const result = await GitHub.searchIssues({
  query: "repo:facebook/react bug"
})

console.log(result.items.length)
```

---

### searchCode()

```ts
const result = await GitHub.searchCode({
  query: "fetch repo:facebook/react"
})

console.log(result.items.length)
```

---

## Releases

### getLatestRelease()

```ts
const release = await GitHub.getLatestRelease({
  owner: "facebook",
  repo: "react"
})

console.log(release.tag_name)
```

---

### downloadReleaseAsset()

```ts
const data = await GitHub.downloadReleaseAsset({
  owner: "owner",
  repo: "repo",
  assetId: 123456
})
```

---

## 使用建议

* 在脚本初始化阶段调用 `requestPermissions` 统一授权
* 使用 `getPermissionStatus` 避免重复请求
* 对大文件使用：

  * `getRawContent`
  * `getBlob`
