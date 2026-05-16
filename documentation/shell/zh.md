`Shell` 全局对象通过内置的 `ios_system` 运行时在 Scripting app 内执行 shell 命令。适合临时工具场景 —— 列文件、改文件、处理文本流、用 `curl` 拉 URL、用 `tar` 打包、跑 `python` 等。

> **可用命令仅限于 `ios_system` 自带的子集**,这**不是**完整的 POSIX shell。只有 `ios_system` 内置模块提供的命令可用:大致是基础的文件 / 文本 / 网络工具(`ls`、`cp`、`mv`、`rm`、`cat`、`echo`、`grep`、`sed`、`awk`、`cut`、`sort`、`uniq`、`head`、`tail`、`wc`、`find`、`xargs`、`tar`、`gzip`、`curl`、`scp`、`sftp`、`ssh`、`python`......),加上 shell 内建(`cd`、`pwd`、`env`、`export`、管道、重定向)。**未内置**的外部工具 —— `git`、`make`、`node`、`npm`、`brew`、`gcc` 等 —— 都不可用;也不能执行脚本随附的任意二进制(iOS 沙盒限制)。

`Shell.run` 与 `Python.run` 共享同一条串行队列:其中一个执行时,其他调用排队等待。这是有意设计的 —— `ios_system` 与内嵌 Python 解释器共享全局状态(env 变量、`sys.modules`、当前工作目录),不可并发执行。

---

## 方法

### `Shell.run(command, options?): Promise<ShellExecutionResult>`

执行一条 shell 命令。命令退出或触发 timeout 时返回。非零退出码以 resolve 形式回传(不会 reject);只有参数缺失会 reject。

```ts
function run(command: string, options?: ShellRunOptions): Promise<ShellExecutionResult>
```

#### `ShellRunOptions`

| 名称            | 类型                       | 必填 | 说明 |
| --------------- | -------------------------- | ---- | ---- |
| cwd             | string                     | 否   | 命令的工作目录。相对路径相对于 documents 目录解析;`~/` 展开为 documents 目录。 |
| timeout         | number                     | 否   | 最长执行时间(秒)。默认 `120`。超时后命令被杀,Promise 以 `timedOut: true` resolve。 |
| env             | Record<string, string>     | 否   | 仅在本次调用中注入的额外环境变量。命令结束后恢复原值。 |
| queryParameters | Record<string, string>     | 否   | 字符串键值对,序列化为 JSON 后通过 `SCRIPTING_QUERY_PARAMETERS` 环境变量传给子进程。等同于临时命令版的 `Script.queryParameters`。 |

#### `ShellExecutionResult`

| 名称      | 类型    | 说明 |
| --------- | ------- | ---- |
| output    | string  | 命令的 stdout + stderr 合并输出。底层 `ios_system` 把两者并到同一流,无法分离。 |
| exitCode  | number  | 进程退出码。`0` 表示成功。非零值以 resolve 返回(不抛异常),便于处理预期内的非零退出(例如 `grep` 没找到匹配)。 |
| timedOut  | boolean | 命令因超出 `options.timeout` 被杀时为 `true`。 |
| cancelled | boolean | 命令被宿主取消时为 `true`。 |

---

## 示例

### 基本命令

```ts
const r = await Shell.run("echo hi && pwd", { cwd: "/tmp" })
console.log(r.output)   // "hi\n/tmp\n"
console.log(r.exitCode) // 0
```

### 处理非零退出

```ts
const r = await Shell.run("grep -q needle haystack.txt")
if (r.exitCode === 0) {
  console.log("找到了")
} else if (r.exitCode === 1) {
  console.log("没找到")
} else {
  console.log("出错:", r.output)
}
```

### 通过 env 传参

```ts
const r = await Shell.run("echo $GREETING", {
  env: { GREETING: "hello world" },
})
console.log(r.output) // "hello world\n"
```

### 与 `Script.queryParameters` 共用同一约定

```ts
const r = await Shell.run('python -c "import os, json; print(json.loads(os.environ[\\"SCRIPTING_QUERY_PARAMETERS\\"]))"', {
  queryParameters: { name: "Alice", count: "3" },
})
console.log(r.output) // "{'name': 'Alice', 'count': '3'}\n"
```

### 检测超时

```ts
const r = await Shell.run("sleep 30", { timeout: 2 })
if (r.timedOut) {
  console.log("被超时杀掉")
}
```
