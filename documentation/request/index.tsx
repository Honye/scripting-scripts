import { Base64, fetch, ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function RequestExample() {
  return <ScrollView
    navigationTitle={"Request"}
  >
    <VStack>
      <APIExample
        title={"fetch"}
        subtitle={"The fetch() method starts the process of fetching a resource from the network, returning a promise that is fulfilled once the response is available."}
        code={`const html = await fetch(
  "https://github.com"
).then(
  response => response.text()
)

if (html != null) {
  const controller = new WebViewController()
  controller.loadHTML(html, "https://github.com")
  await controller.present()
  controller.dispose()
} else {
  console.log("Failed to fetch the HTML content.")
}`}
        run={async log => {
          log("Start fetching...")
          try {
            const html = await fetch(
              "https://github.com"
            ).then(
              response => response.text()
            )

            if (html != null) {
              const controller = new WebViewController()
              controller.loadHTML(html, "https://github.com/")
              await controller.present()
              controller.dispose()
            } else {
              log("Failed to fetch the HTML content.")
            }
          } catch (e) {
            log("Failed to fetch the HTML content, " + e, true)
          }
        }}
      />

      <APIExample
        title={"Cancelable request"}
        subtitle={"You can cancel a request by passing a CancelToken object"}
        code={`const cancelToken = new CancelToken()
fetch("https://example.com/api/data.json", {
  cancelToken: cancelToken
})
.then(res => res.json())
.then(data => {
  // handle data
})

// Cancel the request after 2 seconds.
setTimeout(() => {
  cancelToken.cancel()
}, 2000)`}
      />

      <APIExample
        title={"Options of the fetch() function"}
        code={`fetch("https://example.com/api", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(params),
  connectTimeout: 5000, // 5 seconds
  receiveTimeout: 10000, // 10 seconds
  cancelToken: cancelToken, // CancelToken object
})`}
      />

      <APIExample
        title={"Request response"}
        subtitle={"Get various data types based on different methods of the Response object"}
        code={`const response = await fetch("https://example.com/api")

response.text().then(text => {
  // handle text content
})

response.json().then(jsonObject => {
  // handle json data
})

response.arrayBuffer().then(arrayBuffer => {
  // handle array buffer
})`}
      />

      <APIExample
        title={"Using readable streams for response"}
        subtitle={"Programmatically reading and manipulating streams of data received over the network, chunk by chunk, is very useful"}
        code={`const response = await fetch(
  "https://x.com",
)
const reader = response.body.getReader()

async function read() {
  while (true) {
    const {
      done,
      value
    } = await reader.read()

    if (done) {
      break
    } else if (value != null) {
      const data = Data.fromBytes(value)
      if (data != null) {
        const text = data.toRawString()
        console.log("Received: " + text)
      }
    }
  }
}

read()`}
        run={async log => {
          const response = await fetch(
            "https://x.com",
          )

          const reader = response.body.getReader()

          async function read() {
            try {
              while (true) {
                const {
                  done,
                  value
                } = await reader.read()

                if (done) {
                  break
                } else if (value != null) {
                  const data = Data.fromArrayBuffer(value.buffer)
                  if (data != null) {
                    const text = data.toRawString()
                    log("Received: " + text)
                  }
                }
              }
            } catch (e) {
              console.error(String(e))
            }
          }

          read()
        }}
      />
    </VStack>
  </ScrollView>
}