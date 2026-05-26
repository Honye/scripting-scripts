The `HttpServer` class provides a lightweight local HTTP server that can handle HTTP requests, serve static files, and manage WebSocket connections. It is commonly used for local debugging, communication between devices, and serving simple web APIs inside scripts.

---

## Overview

`HttpServer` supports:

* Handling custom HTTP routes with programmable handlers
* Serving static files or directories
* Managing WebSocket connections for real-time communication
* Listening on both IPv4 and IPv6
* Configurable ports (including automatic random ports)
* Server state tracking

---

## Properties

### `state: HttpServerState`

The current state of the server.

| State        | Description             |
| ------------ | ----------------------- |
| `"starting"` | The server is starting. |
| `"running"`  | The server is running.  |
| `"stopping"` | The server is stopping. |
| `"stopped"`  | The server is stopped.  |

---

### `port: number | null`

The port number the server is listening on.
If the server is not running, this value is `null`.

---

### `isIPv4: boolean`

Indicates whether the server is listening on an IPv4 address.
If `false`, the server may be using IPv6.

---

### `listenAddressIPv4: string | null`

The IPv4 address to listen on.
Only used when `forceIPv4` is set to `true`.

---

### `listenAddressIPv6: string | null`

The IPv6 address to listen on.
Only used when `forceIPv6` is set to `true`.

---

## Methods

### `registerHandler(path: string, handler: (request: HttpRequest) => HttpResponse): void`

> **Deprecated.** Prefer `registerAsyncHandler`. The sync entry point cannot `await` Keychain access, network IO, or file reads before responding, and is kept only for legacy scripts.

Registers a synchronous handler for a specific request path. The handler runs on the JavaScript main thread and must return an `HttpResponse` immediately.

**Parameters:**

| Name      | Type                                     | Description                                                             |
| --------- | ---------------------------------------- | ----------------------------------------------------------------------- |
| `path`    | `string`                                 | The route path (supports parameters, e.g., `/user/:id`).                |
| `handler` | `(request: HttpRequest) => HttpResponse` | The handler function that processes the request and returns a response. |

**Example:**

```ts
const server = new HttpServer()

server.registerHandler("/hello", (req) => {
  return HttpResponse.ok(HttpResponseBody.text("Hello, world!"))
})
```

---

### `registerAsyncHandler(path: string, handler: (request: HttpRequest) => Promise<HttpResponse>): void`

Registers an async handler. The handler may return a `Promise<HttpResponse>` and the server will wait for the promise to resolve before sending the reply. If the promise rejects, the server returns a 500 with the error message as the body.

**Parameters:**

| Name      | Type                                              | Description                                                       |
| --------- | ------------------------------------------------- | ----------------------------------------------------------------- |
| `path`    | `string`                                          | The route path (supports parameters, e.g., `/user/:id`).          |
| `handler` | `(request: HttpRequest) => Promise<HttpResponse>` | The async handler. Resolves with an `HttpResponse`.               |

**Example:**

```ts
const server = new HttpServer()

server.registerAsyncHandler("/slow", async (req) => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return HttpResponse.ok(HttpResponseBody.text("slow ok"))
})
```

---

### `registerFile(path: string, filePath: string): void`

Registers a single static file for a specific path.

**Parameters:**

| Name       | Type     | Description                   |
| ---------- | -------- | ----------------------------- |
| `path`     | `string` | The HTTP request path.        |
| `filePath` | `string` | The local file path to serve. |

**Example:**

```ts
server.registerFile("/readme", Path.join(Script.directory, "README.md"))
```

Accessing `/readme` in the browser returns the file content.

---

### `registerFilesFromDirectory(path: string, directory: string, options?: { defaults?: string[] }): void`

Registers a directory of static files to serve.

**Parameters:**

| Name               | Type       | Description                                                                                    |
| ------------------ | ---------- | ---------------------------------------------------------------------------------------------- |
| `path`             | `string`   | The URL path template, e.g., `/static/:file`.                                                  |
| `directory`        | `string`   | The directory path to serve from.                                                              |
| `options.defaults` | `string[]` | Default files to serve if no filename is provided (default: `["index.html", "default.html"]`). |

**Example:**

```ts
server.registerFilesFromDirectory("/static/:file", Path.join(Script.directory, "html"), {
  defaults: ["index.html", "index.htm"]
})
```

When accessing `/static/`, the server automatically serves the default index file.

---

### `registerWebsocket(path: string, handlers: WebSocketHandlers): void`

Registers a WebSocket handler for the specified path.

**Parameters:**

| Name       | Type                | Description                            |
| ---------- | ------------------- | -------------------------------------- |
| `path`     | `string`            | The WebSocket endpoint path.           |
| `handlers` | `WebSocketHandlers` | The WebSocket event handler functions. |

**WebSocketHandlers type definition:**

```ts
interface WebSocketHandlers {
  onPong?: (session: WebSocketSession) => void
  onConnected?: (session: WebSocketSession) => void
  onDisconnected?: (session: WebSocketSession) => void
  handleText?: (session: WebSocketSession, text: string) => void
  handleBinary?: (session: WebSocketSession, data: Data) => void
}
```

**Example:**

```ts
const connectedSessions: WebSocketSession[] = []

server.registerWebsocket("/ws", {
  onConnected: (session) => {
    connectedSessions.push(session)
  },
  onDisconnected: (session) => {
    connectedSessions.splice(connectedSessions.indexOf(session), 1)
  },
  handleText: (session, text) => {
    session.writeText("Echo: " + text)
  }
})
```

---

### `registerMiddleware(handler: (request: HttpRequest) => Promise<HttpResponse | null | undefined>): void`

Registers an async middleware layer that runs before every route handler. Layers run in registration order. A layer may either:

- resolve with `null` / `undefined` to let the request pass through to the next layer or the route handler, or
- resolve with an `HttpResponse` to short-circuit the request — no subsequent middleware or route handler will run.

A rejection or thrown error becomes a `500` response.

**Parameters:**

| Name      | Type                                                              | Description                |
| --------- | ----------------------------------------------------------------- | -------------------------- |
| `handler` | `(req: HttpRequest) => Promise<HttpResponse \| null \| undefined>` | The async middleware function. |

**Example: simple auth gate**

```ts
server.registerMiddleware(async (req) => {
  if (!req.headers["x-auth"]) {
    return HttpResponse.unauthorized(HttpResponseBody.text("missing token"))
  }
  return null
})
```

---

### `setNotFoundHandler(handler: (request: HttpRequest) => Promise<HttpResponse>): void`

Sets the async handler invoked when no route matches the incoming request. The handler must resolve with an `HttpResponse`. Calling this multiple times replaces the previous handler. Rejection or throw becomes a `500`.

**Parameters:**

| Name      | Type                                              | Description                          |
| --------- | ------------------------------------------------- | ------------------------------------ |
| `handler` | `(req: HttpRequest) => Promise<HttpResponse>`     | The async 404 handler.               |

**Example:**

```ts
server.setNotFoundHandler(async (req) => {
  return HttpResponse.notFound(HttpResponseBody.text(`No route: ${req.path}`))
})
```

---

### `start(options?: { port?, forceIPv4?, tls? }): string | null`

Starts the HTTP server. Returns `null` on success, or an error message string on failure (configuration error, port in use, etc.).

**Parameters:**

| Name                    | Type                | Description                                                                                                                                                       |
| ----------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.port`          | `number`            | The port to listen on (default: `8080`). If `0` is specified, a random available port is chosen and exposed via `server.port` after start.                       |
| `options.forceIPv4`     | `boolean`           | Whether to force IPv4 listening (default: `false`).                                                                                                              |
| `options.tls.p12`       | `string \| Data`    | PKCS#12 identity. Either an absolute file path (`string`) or the raw P12 bytes (`Data`). The `Data` form is convenient when the P12 lives in Keychain.            |
| `options.tls.password`  | `string`            | Password used to decrypt the P12.                                                                                                                                 |
| `options.tls.minVersion`| `"1.2" \| "1.3"`   | Minimum TLS protocol version (default: `"1.2"`). TLSv1.0 / 1.1 are not supported — Apple deprecated them in macOS 12 / iOS 15.                                    |
| `options.tls.maxVersion`| `"1.2" \| "1.3"`   | Maximum TLS protocol version. Default is unset (no upper bound). Pin to `"1.3"` on both `minVersion` and `maxVersion` to enforce TLSv1.3-only.                    |

**HTTP example:**

```ts
const error = server.start({ port: 8080 })
if (error) {
  console.error("Failed to start:", error)
} else {
  console.log("Server running on port:", server.port)
}
```

**HTTPS from a P12 file:**

```ts
const error = server.start({
  port: 8443,
  tls: {
    p12: Path.join(Script.directory, "server.p12"),
    password: "your-p12-password",
  },
})
```

**HTTPS from P12 bytes (Keychain pipeline) + TLS 1.3 only:**

```ts
// Keychain APIs are synchronous and return null when the key is missing.
const p12Bytes = Keychain.getData("server.p12")
if (!p12Bytes) {
  throw new Error("server.p12 is not stored in Keychain")
}
server.start({
  port: 8443,
  tls: {
    p12: p12Bytes,
    password: "your-p12-password",
    minVersion: "1.3",
    maxVersion: "1.3",
  },
})
```

To generate a self-signed P12 for local testing:

```sh
openssl req -x509 -newkey rsa:2048 \
    -keyout localhost.key -out localhost.crt \
    -days 3650 -nodes -subj "/CN=localhost"
openssl pkcs12 -export -out localhost.p12 \
    -inkey localhost.key -in localhost.crt \
    -name "scripting-test" -password pass:yourpassword \
    -keypbe PBE-SHA1-3DES -certpbe PBE-SHA1-3DES
```

---

### `stop(): void`

Stops the HTTP server and releases its resources.

**Example:**

```ts
server.stop()
console.log("Server stopped")
```

---

## Type Definitions

### `HttpServerState`

```ts
type HttpServerState = "starting" | "running" | "stopping" | "stopped"
```

---

### `WebSocketSession`

Represents a live WebSocket connection.

**Methods:**

| Method                    | Description                           |
| ------------------------- | ------------------------------------- |
| `writeText(text: string)` | Sends a text message to the client.   |
| `writeData(data: Data)`   | Sends a binary message to the client. |
| `close()`                 | Closes the connection.                |

---

## Full Example

Below is a complete example of a working HTTP + WebSocket server:

```ts
const server = new HttpServer()

// Register a simple HTTP route
server.registerHandler("/api/hello", (req) => {
  return HttpResponse.ok(HttpResponseBody.text("Hello from Scripting Server"))
})

// Serve static files from a directory
server.registerFilesFromDirectory("/public/:file", Path.join(Script.directory, "html"))

// WebSocket chat example
server.registerWebsocket("/chat", {
  onConnected: (session) => {
    console.log("Client connected")
    session.writeText("Welcome to the chat")
  },
  handleText: (session, text) => {
    console.log("Received:", text)
    session.writeText("You said: " + text)
  }
})

// Start the server
const error = server.start({ port: 8080 })
if (error) {
  console.error("Server failed to start:", error)
} else {
  console.log("HTTP Server started on port:", server.port)
}
```
