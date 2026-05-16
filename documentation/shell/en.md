The `Shell` global runs shell commands inside the Scripting app via the embedded `ios_system` runtime. Useful for ad-hoc tooling — listing and editing files, processing text streams, fetching URLs with `curl`, archiving with `tar`, running `python`, etc.

> **Available commands are limited to what `ios_system` ships.** This is *not* a full POSIX shell. Only commands provided by the bundled `ios_system` modules work: roughly the basic file / text / network utilities (`ls`, `cp`, `mv`, `rm`, `cat`, `echo`, `grep`, `sed`, `awk`, `cut`, `sort`, `uniq`, `head`, `tail`, `wc`, `find`, `xargs`, `tar`, `gzip`, `curl`, `scp`, `sftp`, `ssh`, `python`, ...) plus shell builtins (`cd`, `pwd`, `env`, `export`, pipes, redirects). External tools that are **not** bundled — `git`, `make`, `node`, `npm`, `brew`, `gcc`, etc. — are unavailable, and you cannot execute arbitrary binaries shipped with a script (iOS sandbox restriction).

`Shell.run` and `Python.run` share a single serial queue: while one is running, others wait. This is intentional — `ios_system` and the embedded Python interpreter share global state (env vars, `sys.modules`, current working directory) and cannot run concurrently.

---

## Methods

### `Shell.run(command, options?): Promise<ShellExecutionResult>`

Execute a shell command. Returns when the command exits or the timeout is reached. Non-zero exit codes resolve normally; only argument validation errors reject the promise.

```ts
function run(command: string, options?: ShellRunOptions): Promise<ShellExecutionResult>
```

#### `ShellRunOptions`

| Name            | Type                       | Required | Description |
| --------------- | -------------------------- | -------- | ----------- |
| cwd             | string                     | No       | Working directory for the command. Relative paths are resolved against the documents directory; `~/` is expanded to the documents directory. |
| timeout         | number                     | No       | Maximum execution time in seconds. Defaults to `120`. When exceeded, the command is killed and the promise resolves with `timedOut: true`. |
| env             | Record<string, string>     | No       | Extra environment variables injected for this invocation only. Restored to their previous values after the command finishes. |
| queryParameters | Record<string, string>     | No       | String key/value pairs serialized as JSON and exposed to the subprocess via the `SCRIPTING_QUERY_PARAMETERS` environment variable. Mirrors `Script.queryParameters` for ad-hoc commands. |

#### `ShellExecutionResult`

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| output    | string  | Combined stdout + stderr produced by the command. The underlying `ios_system` pipes both into a single stream, so they cannot be separated. |
| exitCode  | number  | Process exit code. `0` means success. Non-zero values are surfaced as resolved promises (no rejection), so the caller can handle expected non-zero exits (e.g. `grep` finding no matches). |
| timedOut  | boolean | `true` when the command was killed because it exceeded `options.timeout`. |
| cancelled | boolean | `true` when the command was cancelled by the host. |

---

## Examples

### Basic command

```ts
const r = await Shell.run("echo hi && pwd", { cwd: "/tmp" })
console.log(r.output)   // "hi\n/tmp\n"
console.log(r.exitCode) // 0
```

### Handling non-zero exits

```ts
const r = await Shell.run("grep -q needle haystack.txt")
if (r.exitCode === 0) {
  console.log("found")
} else if (r.exitCode === 1) {
  console.log("not found")
} else {
  console.log("error:", r.output)
}
```

### Passing parameters via env

```ts
const r = await Shell.run("echo $GREETING", {
  env: { GREETING: "hello world" },
})
console.log(r.output) // "hello world\n"
```

### Sharing parameters with `Script.queryParameters`

```ts
const r = await Shell.run('python -c "import os, json; print(json.loads(os.environ[\\"SCRIPTING_QUERY_PARAMETERS\\"]))"', {
  queryParameters: { name: "Alice", count: "3" },
})
console.log(r.output) // "{'name': 'Alice', 'count': '3'}\n"
```

### Detecting a timeout

```ts
const r = await Shell.run("sleep 30", { timeout: 2 })
if (r.timedOut) {
  console.log("killed by timeout")
}
```
