The `WebScraper` module provides a lightweight web scraping service that allows scripts to reliably load web pages and retrieve their HTML content or extract structured data from them.

The module loads web pages in a controlled environment and supports multiple waiting strategies (such as DOM completion, network idle, or waiting for specific elements). These strategies help ensure stability when scraping modern websites that rely on dynamic rendering.

Typical use cases include:

* Retrieving the final rendered HTML of a page
* Extracting structured data by running JavaScript in the page context
* Waiting for dynamic content to load before scraping
* Writing stable automation scripts for web data extraction

All operations are executed as **asynchronous tasks**. Each task has a unique `taskId`, which can be used to track or cancel the task.

---

# Type Definitions

## WaitOptions

Defines the strategy used to determine when a page has finished loading.

```ts
type WaitOptions =
  | "domComplete"
  | "networkIdle"
  | {
      mode: "domComplete"
    }
  | {
      mode: "networkIdle"
      idleSeconds?: number
    }
  | {
      mode: "selector"
      selector: string
    }
```

### Available Modes

#### `"domComplete"`

Waits until `document.readyState === "complete"`.

Suitable for:

* Static websites
* Simple pages
* Websites that do not rely heavily on asynchronous loading

Example:

```ts
wait: "domComplete"
```

---

#### `"networkIdle"`

Waits until the page network activity becomes idle.

When no new network requests occur within a period of time, the page is considered fully loaded.

Suitable for:

* SPA applications
* Pages that fetch data via APIs
* Websites with dynamic content loading

Example:

```ts
wait: "networkIdle"
```

You may also specify the idle duration:

```ts
wait: {
  mode: "networkIdle",
  idleSeconds: 2
}
```

---

#### `"selector"`

Waits until a specific DOM element appears.

When an element matching the selector exists in the document, the task continues.

Suitable for:

* Dynamically rendered content
* Waiting for specific UI components
* Precisely controlling when scraping begins

Example:

```ts
wait: {
  mode: "selector",
  selector: ".article-content"
}
```

---

# Error

Represents error information when a scraping task fails.

```ts
type Error = {
  code: string
  message: string
}
```

### Properties

#### code

An error code identifying the type of failure.

Examples:

```
NETWORK_ERROR
TIMEOUT
SCRIPT_ERROR
```

#### message

A human-readable error message describing the failure.

Example:

```
Request timed out
```

---

# Timing

Represents execution timing information for a task.

```ts
type Timing = {
  totalMs: number
}
```

### Properties

#### totalMs

The total execution time of the task in milliseconds.

---

# Result

All `WebScraper` APIs return results using the `Result` type.

```ts
type Result<T = any> = {
  ok: boolean
  taskId: string
  url?: string
  html?: string
  data?: T
  error?: Error
  timing?: Timing
}
```

### Properties

#### ok

Indicates whether the task completed successfully.

```
true   task succeeded
false  task failed
```

---

#### taskId

The unique identifier of the task.

If `taskId` is not specified when starting the task, the system automatically generates one.

It can be used to cancel the task:

```ts
WebScraper.cancel(taskId)
```

---

#### url

The final loaded URL.

If redirects occurred during navigation, this field contains the final destination URL.

---

#### html

The final HTML of the page.

This is typically the **rendered DOM HTML**, not the raw HTML response.

---

#### data

The data returned by `extractScript` or `eval`.

The type of this field is defined by the generic parameter `T`.

---

#### error

Returned when the task fails.

Contains error information.

---

#### timing

Timing information about the task execution.

---

# API

## load

Loads a web page and returns the final HTML.

```ts
function load(options: {
  url: string
  wait?: WaitOptions
  timeout?: number
  taskId?: string
}): Promise<Result<string>>
```

### Parameters

#### url

The URL of the page to load.

Example:

```ts
url: "https://example.com"
```

---

#### wait

The waiting strategy used to determine when the page is ready.

Default:

```
"domComplete"
```

---

#### timeout

The maximum allowed time for the task in **seconds**.

If the task does not finish within the specified time, it fails with a timeout error.

Example:

```
timeout: 15
```

---

#### taskId

An optional task identifier.

If not provided, the system automatically generates one.

---

### Example

```ts
const result = await WebScraper.load({
  url: "https://example.com",
  wait: "networkIdle"
})

if (result.ok) {
  console.log(result.html)
}
```

---

# scrape

Loads a page and optionally executes an extraction script in the page context.

```ts
function scrape<T = any>(options: {
  url: string
  wait?: WaitOptions
  timeout?: number
  extractScript?: string
  taskId?: string
}): Promise<Result<T>>
```

This method performs the following steps:

1. Load the page
2. Wait until the specified condition is satisfied
3. Execute `extractScript` in the page context
4. Return both the HTML and extracted data

---

### Parameters

#### extractScript

JavaScript code executed in the page context.

The script should return the data to extract.

Example:

```ts
extractScript: `
  return {
    title: document.title,
    articles: Array.from(document.querySelectorAll("article")).map(el => ({
      title: el.querySelector("h2")?.innerText,
      link: el.querySelector("a")?.href
    }))
  }
`
```

---

### Example

```ts
const result = await WebScraper.scrape({
  url: "https://news.ycombinator.com",
  wait: {
    mode: "selector",
    selector: ".athing"
  },
  extractScript: `
    return Array.from(document.querySelectorAll(".athing")).map(el => ({
      title: el.querySelector(".titleline a")?.innerText,
      url: el.querySelector(".titleline a")?.href
    }))
  `
})

if (result.ok) {
  console.log(result.data)
}
```

---

# eval

Evaluates JavaScript in the page context and returns the result.

```ts
function eval<T = any>(options: {
  url: string
  script: string
  wait?: WaitOptions
  timeout?: number
  taskId?: string
}): Promise<Result<T>>
```

This method is intended for executing custom JavaScript logic inside the page.

Compared to `scrape`:

* `eval` focuses on executing arbitrary JavaScript
* `scrape` is designed specifically for extracting data

---

### Parameters

#### script

JavaScript code executed in the page context.

The script must return a value.

---

### Example

```ts
const result = await WebScraper.eval({
  url: "https://example.com",
  script: `
    return {
      title: document.title,
      links: document.links.length
    }
  `
})

if (result.ok) {
  console.log(result.data)
}
```

---

# cancel

Cancels a running scraping task.

```ts
function cancel(taskId: string): Promise<boolean>
```

### Parameters

#### taskId

The identifier of the task to cancel.

---

### Return Value

```
true   task was successfully cancelled
false  task not found or already finished
```

---

### Example

```ts
const taskId = "scrape-news"

WebScraper.scrape({
  url: "https://example.com",
  taskId
})

await WebScraper.cancel(taskId)
```

---

# Usage Recommendations

## Choose an Appropriate Waiting Strategy

Different types of websites benefit from different strategies.

| Scenario                      | Recommended wait |
| ----------------------------- | ---------------- |
| Static pages                  | `"domComplete"`  |
| SPA applications              | `"networkIdle"`  |
| Waiting for specific elements | `"selector"`     |

---

## Prefer selector Waiting for Dynamic Content

For dynamic pages, waiting for a specific element improves reliability.

```ts
wait: {
  mode: "selector",
  selector: ".content"
}
```

---

## Adjust Timeout for Complex Pages

Complex sites may require longer timeouts.

```
timeout: 20
```

---

## Prefer extractScript Instead of Parsing HTML

Instead of retrieving HTML and parsing it manually:

```ts
const html = result.html
```

It is often more efficient to extract data directly in the page:

```ts
extractScript: `
  return document.title
`
```

This approach reduces script complexity and improves performance.
