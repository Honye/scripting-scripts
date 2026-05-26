`SSHClient` 类用于连接远程 SSH 服务器，支持执行命令、打开 TTY/PTY 会话、使用 SFTP 进行文件传输，以及通过跳板主机进行多级 SSH 跳转。该类是建立和管理 SSH 会话的核心接口。

---

## 静态方法

### `SSHClient.connect(options): Promise<SSHClient>`

建立与远程 SSH 服务器的连接。

#### 参数：

* `options`（对象）：

  * `host`（字符串）：
    服务器的主机名或 IP 地址。

  * `port?`（数字）：
    连接端口，默认是 `22`。

  * `authenticationMethod`（`SSHAuthenticationMethod`）：
    SSH 身份验证方式，例如密码或私钥。

  * `trustedHostKeys?`（字符串数组）：
    可选的受信任服务器公钥列表。如果提供，客户端将验证服务器公钥。

  * `reconnect?`（`"never" | "once" | "always"`）：
    可选的重连策略，默认是 `"never"`。

#### 返回值：

* 成功连接时返回 `Promise<SSHClient>` 实例。

#### 示例：

```ts
const ssh = await SSHClient.connect({
  host: "192.168.0.10",
  authenticationMethod: SSHAuthenticationMethod.passwordBased("root", "password")
})
```

---

## 属性

### `onDisconnect: (() => void) | null`

SSH 连接断开时触发的回调函数。

#### 示例：

```ts
ssh.onDisconnect = () => {
  console.log("SSH 已断开")
}
```

---

## 实例方法

### `executeCommand(command: string, options?): Promise<string | Data>`

在远程服务器上执行命令，并返回结果。

#### 参数：

* `command`（字符串）：
  要执行的命令。

* `options?`（对象）：

  * `maxResponseSize?`（数字）：
    最大响应字节数。

  * `includeStderr?`（布尔）：
    是否包含标准错误输出，默认为 `false`。

  * `inShell?`（布尔）：
    是否在 shell 中执行命令（如 `sh -c`），默认是 `false`。

  * `encoding?`（`"utf8" | "ascii" | "binary"`）：
    输出编码方式，默认为 `"utf8"`。
    - `"utf8"` 与 `"ascii"`：以 lossy 方式解码——非法字节会被替换为 `U+FFFD`，返回 `string`。
    - `"binary"`：不做任何解码，直接返回原始字节 `Data`。适合命令输出可能包含二进制或终端控制字符的场景（例如 `softwareupdate -l`，或带 `\r` 进度条/ANSI 转义的命令）。拿到字节后可自行处理（剥除控制字符、用其他编码解码等）。

#### 返回值：

* 返回一个 `Promise`，当 `encoding` 为 `"utf8"`（默认）或 `"ascii"` 时为 `string`；当 `encoding` 为 `"binary"` 时为 `Data`。

#### 示例：

```ts
// 默认 utf8 解码
const result = await ssh.executeCommand("uname -a")

// binary 模式：保留原始字节,便于手动清洗控制字符
const raw = await ssh.executeCommand("softwareupdate -l", { encoding: "binary" })
// raw 是 Data —— 清洗后再解码
const clean = raw.toDecodedString()
```

---

### `executeCommandStream(command, onOutput, options?): Promise<void>`

以流的形式逐行执行命令并获取输出。

#### 参数：

* `command`（字符串）：
  要执行的命令。

* `onOutput`（函数）：
  每一行输出都会调用该回调函数 `(data: Data, isStderr: boolean) => boolean`。返回 `false` 可提前终止输出接收。

* `options?`（对象）：

  * `inShell?`（布尔）：
    是否在 shell 中执行。

#### 返回值：

* 返回一个 `Promise`，命令执行完毕后 resolve。

#### 示例：

```ts
const output = Data.fromIntArray([])
await ssh.executeCommandStream("ping -c 4 google.com", (data, isStderr) => {
  output.append(data)
  return true
})
console.log(output.toDecodedString()())
```

---

### `withPTY(options): Promise<TTYStdinWriter>`

打开一个 PTY（伪终端）会话，支持交互式终端程序（如 `top`、`vim`）。

#### 参数：

* `options`（对象）：

  * `wantReply?`（布尔）：
    是否等待服务器回应，默认 `true`。

  * `term?`（字符串）：
    终端类型，默认是 `"xterm"`。

  * `terminalCharacterWidth?`（数字）：
    字符宽度，默认 `80`。

  * `terminalRowHeight?`（数字）：
    字符行数，默认 `24`。

  * `terminalPixelWidth?`（数字）：
    像素宽度，默认 `0`。

  * `terminalPixelHeight?`（数字）：
    像素高度，默认 `0`。

  * `onOutput`（函数）：
    每一行输出的回调 `(data: Data, isStderr: boolean) => boolean`。

  * `onError?`（函数）：
    出错时的回调 `(error: string) => void`。

#### 返回值：

* 一个 `Promise<TTYStdinWriter>`，可用于写入输入和调整终端大小。

#### 示例：

```ts
let output: Data | undefined
let timerId: number | undefined
const writer = await ssh.withPTY({
  onOutput: (data, isStderr) => {
    if (output == null) {
      output = data
    } else {
      output.append(data)
    }
    clearTimeout(timerId)
    timerId = setTimeout(() => {
      console.log(output.toDecodedString()())
      output = undefined
    }, 500)
    return true
  }
})
await writer.write("top\n")
```

---

### `withTTY(options): Promise<TTYStdinWriter>`

打开一个简化的 TTY 会话（不包含终端尺寸设置）。

#### 参数：

* `options`（对象）：

  * `onOutput`（函数）：
    每一行输出的回调 `(data: Data, isStderr: boolean) => boolean`。

  * `onError?`（函数）：
    出错时的回调 `(error: string) => void`。

#### 返回值：

* 一个 `Promise<TTYStdinWriter>` 实例。

---

### `openSFTP(): Promise<SFTPClient>`

打开一个 SFTP 会话，用于远程文件读写、目录管理等操作。

#### 返回值：

* 一个 `Promise<SFTPClient>` 实例。

#### 示例：

```ts
const sftp = await ssh.openSFTP()
await sftp.writeFile("/tmp/test.txt", "Hello world")
```

---

### `jump(options): Promise<SSHClient>`

从当前连接跳转（跳板）至另一个远程 SSH 主机。

#### 参数：

* `options`（对象）：

  * `host`（字符串）：
    目标主机地址。

  * `port?`（数字）：
    端口，默认为 `22`。

  * `authenticationMethod`（`SSHAuthenticationMethod`）：
    跳转主机的身份验证方式。

  * `trustedHostKeys?`（字符串数组）：
    可选的受信任主机公钥。

#### 返回值：

* 一个新的 `SSHClient` 实例，表示跳转后的连接。

#### 示例：

```ts
const nextHop = await ssh.jump({
  host: "10.0.0.2",
  authenticationMethod: SSHAuthenticationMethod.passwordBased("user2", "pass2")
})
```

---

### `close(): Promise<void>`

关闭 SSH 连接并释放资源。

> **注意：** 当不再需要 SSH 连接时应显式调用该方法，以防资源或 socket 泄漏。

#### 返回值：

* 一个 `Promise`，成功关闭连接时 resolve。

#### 示例：

```ts
await ssh.close()
```

---

## 使用示例

```ts
const ssh = await SSHClient.connect({
  host: "192.168.1.10",
  authenticationMethod: SSHAuthenticationMethod.passwordBased("user", "password")
})

const output = await ssh.executeCommand("uptime")
console.log("系统运行时间：", output)

const sftp = await ssh.openSFTP()
await sftp.writeFile("/tmp/hello.txt", "Hello SSH")

await ssh.close()
```
