interface Strings {
  appTitle: string
  // token / auth
  token: string
  tokenSectionHeader: string
  tokenFieldTitle: string
  tokenFooter: string
  createTokenLink: string
  save: string
  clear: string
  // repo list
  repositories: string
  searchRepos: string
  loadingRepos: string
  noRepos: string
  noToken: string
  setTokenFirst: string
  emptyRepoList: string
  addRepoHint: string
  removeRepo: string
  // add repo (search)
  addRepo: string
  searchReposToAdd: string
  searchPrompt: string
  searchAction: string
  noResults: string
  add: string
  // secrets
  secretsTitle: (repo: string) => string
  loadingSecrets: string
  noSecrets: string
  updatedAt: (date: string) => string
  newSecret: string
  editSecret: string
  addSecret: string
  delete: string
  deleteConfirm: (name: string) => string
  // editor
  secretName: string
  secretNamePlaceholder: string
  secretValue: string
  secretValuePlaceholder: string
  nameHint: string
  saving: string
  overwriteNote: string
  // shared secrets
  sharedSecrets: string
  newSharedSecret: string
  editSharedSecret: string
  noSharedSecrets: string
  sharedSecretsHint: string
  repoCount: (n: number) => string
  lastSynced: (date: string) => string
  neverSynced: string
  valueStoredNote: string
  targetRepos: string
  selectedCount: (n: number) => string
  syncNow: string
  syncResults: string
  done: string
  // generic
  cancel: string
  ok: string
  error: string
  retry: string
  success: string
}

const en: Strings = {
  appTitle: 'GitHub Secrets',
  token: 'Token',
  tokenSectionHeader: 'Personal access token',
  tokenFieldTitle: 'Token',
  tokenFooter:
    'Use a fine-grained personal access token with "Secrets" read and write permission on the target repositories.',
  createTokenLink: 'Create a token on GitHub',
  save: 'Save',
  clear: 'Clear',
  repositories: 'Repositories',
  searchRepos: 'Search repositories',
  loadingRepos: 'Loading repositories…',
  noRepos: 'No repositories found.',
  noToken: 'No token set',
  setTokenFirst: 'Set a personal access token to get started.',
  emptyRepoList: 'No repositories yet',
  addRepoHint: 'Search and add the repositories you want to manage.',
  removeRepo: 'Remove',
  addRepo: 'Add Repository',
  searchReposToAdd: 'Search',
  searchPrompt: 'owner/repo or keywords',
  searchAction: 'Search',
  noResults: 'No repositories found.',
  add: 'Add',
  secretsTitle: (repo) => repo,
  loadingSecrets: 'Loading secrets…',
  noSecrets: 'No secrets yet.',
  updatedAt: (date) => `Updated ${date}`,
  newSecret: 'New Secret',
  editSecret: 'Edit Secret',
  addSecret: 'Add Secret',
  delete: 'Delete',
  deleteConfirm: (name) => `Delete secret "${name}"? This cannot be undone.`,
  secretName: 'Name',
  secretNamePlaceholder: 'SECRET_NAME',
  secretValue: 'Value',
  secretValuePlaceholder: 'Secret value',
  nameHint: 'Uppercase letters, digits and underscores. Cannot start with a digit or GITHUB_.',
  saving: 'Saving…',
  overwriteNote: 'Secret values cannot be read back. Saving overwrites the existing value.',
  sharedSecrets: 'Shared Secrets',
  newSharedSecret: 'New Shared Secret',
  editSharedSecret: 'Edit Shared Secret',
  noSharedSecrets: 'No shared secrets yet',
  sharedSecretsHint:
    'Create a secret once, pick the repos, and sync it to all of them with one tap.',
  repoCount: (n) => `${n} repo${n === 1 ? '' : 's'}`,
  lastSynced: (date) => `Synced ${date}`,
  neverSynced: 'Not synced yet',
  valueStoredNote:
    'The value is stored on this device so you can re-sync without retyping it.',
  targetRepos: 'Target repositories',
  selectedCount: (n) => `${n} selected`,
  syncNow: 'Sync now',
  syncResults: 'Results',
  done: 'Done',
  cancel: 'Cancel',
  ok: 'OK',
  error: 'Error',
  retry: 'Retry',
  success: 'Success'
}

const zh: Strings = {
  appTitle: 'GitHub 密钥',
  token: '令牌',
  tokenSectionHeader: '个人访问令牌',
  tokenFieldTitle: '令牌',
  tokenFooter:
    '请使用对目标仓库拥有 “Secrets” 读写权限的细粒度个人访问令牌（fine-grained PAT）。',
  createTokenLink: '前往 GitHub 创建令牌',
  save: '保存',
  clear: '清除',
  repositories: '仓库',
  searchRepos: '搜索仓库',
  loadingRepos: '正在加载仓库…',
  noRepos: '没有找到仓库。',
  noToken: '尚未设置令牌',
  setTokenFirst: '请先设置个人访问令牌。',
  emptyRepoList: '还没有仓库',
  addRepoHint: '搜索并添加你想管理的仓库。',
  removeRepo: '移除',
  addRepo: '添加仓库',
  searchReposToAdd: '搜索',
  searchPrompt: 'owner/repo 或关键词',
  searchAction: '搜索',
  noResults: '未找到仓库。',
  add: '添加',
  secretsTitle: (repo) => repo,
  loadingSecrets: '正在加载密钥…',
  noSecrets: '暂无密钥。',
  updatedAt: (date) => `更新于 ${date}`,
  newSecret: '新建密钥',
  editSecret: '编辑密钥',
  addSecret: '添加密钥',
  delete: '删除',
  deleteConfirm: (name) => `确定删除密钥 “${name}” 吗？此操作无法撤销。`,
  secretName: '名称',
  secretNamePlaceholder: 'SECRET_NAME',
  secretValue: '值',
  secretValuePlaceholder: '密钥值',
  nameHint: '仅限大写字母、数字和下划线，不能以数字或 GITHUB_ 开头。',
  saving: '正在保存…',
  overwriteNote: '密钥值无法读取。保存将覆盖已有的值。',
  sharedSecrets: '共享密钥',
  newSharedSecret: '新建共享密钥',
  editSharedSecret: '编辑共享密钥',
  noSharedSecrets: '还没有共享密钥',
  sharedSecretsHint: '创建一个密钥并选择仓库，之后可一键同步到全部仓库。',
  repoCount: (n) => `${n} 个仓库`,
  lastSynced: (date) => `同步于 ${date}`,
  neverSynced: '尚未同步',
  valueStoredNote: '值会保存在本设备上，便于免重输一键重新同步。',
  targetRepos: '目标仓库',
  selectedCount: (n) => `已选 ${n} 个`,
  syncNow: '立即同步',
  syncResults: '结果',
  done: '完成',
  cancel: '取消',
  ok: '好',
  error: '错误',
  retry: '重试',
  success: '成功'
}

export const i18n: Strings = (() => {
  const locale = Device.systemLocale
  return locale.startsWith('zh') ? zh : en
})()
