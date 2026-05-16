Provides authenticated access to the GitHub REST API.

Prerequisites:

* A Personal Access Token must be configured in `Settings → GitHub`
* Each script or skill maintains its own permission state per capability
* The first call to a capability may trigger an authorization prompt
* Tokens are securely stored in the iCloud-synced Keychain and are not accessible from JavaScript

Limitations:

* Extension environments (Widget / Keyboard / Notification) cannot present authorization UI
* If permissions have not been granted in the main app, calls in those environments will fail

---

## Permission Model

### Permission

Defines the capabilities a script or skill can request:

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

### Permission Status

```ts
"allowed" | "denied" | "unset"
```

* `allowed`: granted
* `denied`: rejected
* `unset`: not requested yet

---

## Availability

### Availability Type

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
  console.log("GitHub API is not available. Check token configuration.")
}
```

Notes:

* Checks whether a token is configured
* Does NOT check permission state

---

### getAvailability()

```ts
const availability = await GitHub.getAvailability()

console.log(availability.available)
console.log(availability.tokenConfigured)
```

---

## Permission Management

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

console.log("Granted:", granted)
```

Notes:

* Requests permissions in batch
* Returns the final set of allowed permissions

---

## Common Types

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

## User & Repository

### getViewer()

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

## Branches & Commits

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

## File Contents

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

// binary data
```

---

### putContent()

Create file:

```ts
await GitHub.putContent({
  owner: "yourname",
  repo: "test-repo",
  path: "hello.txt",
  message: "add file",
  content: "Hello from Scripting"
})
```

Update file:

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

## Search APIs

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

## Best Practices

* Call `requestPermissions` at startup to avoid fragmented prompts
* Use `getPermissionStatus` to prevent redundant requests
* Use:

  * `getRawContent`
  * `getBlob`
    for large or binary files