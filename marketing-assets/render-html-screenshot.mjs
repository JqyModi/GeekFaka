import { spawn } from "node:child_process"
import { writeFile } from "node:fs/promises"
import http from "node:http"
import path from "node:path"

const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const [input, output, widthRaw, heightRaw] = process.argv.slice(2)

if (!input || !output || !widthRaw || !heightRaw) {
  console.error("Usage: node marketing-assets/render-html-screenshot.mjs input.html output.png width height")
  process.exit(1)
}

const width = Number(widthRaw)
const height = Number(heightRaw)
const port = 9237 + Math.floor(Math.random() * 1000)
const url = `file://${path.resolve(input)}`

function getJson(target) {
  return new Promise((resolve, reject) => {
    http.get(target, (res) => {
      let data = ""
      res.on("data", (chunk) => {
        data += chunk
      })
      res.on("end", () => {
        try {
          resolve(JSON.parse(data))
        } catch (error) {
          reject(error)
        }
      })
    }).on("error", reject)
  })
}

async function waitForTab() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const tabs = await getJson(`http://127.0.0.1:${port}/json`)
      const tab = tabs.find((item) => item.type === "page")
      if (tab?.webSocketDebuggerUrl) return tab
    } catch {
      // Chrome is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error("Timed out waiting for Chrome tab")
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let id = 0
  const pending = new Map()

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message)
      pending.delete(message.id)
    }
  }

  const open = new Promise((resolve) => {
    ws.onopen = resolve
  })

  const send = async (method, params = {}) => {
    await open
    const messageId = ++id
    return new Promise((resolve) => {
      pending.set(messageId, resolve)
      ws.send(JSON.stringify({ id: messageId, method, params }))
    })
  }

  return { ws, send }
}

const chromeProcess = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--window-size=${width},${height}`,
  url,
], {
  stdio: "ignore",
})

try {
  const tab = await waitForTab()
  const { ws, send } = connect(tab.webSocketDebuggerUrl)
  await send("Page.enable")
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  })
  await send("Page.navigate", { url })
  await send("Page.loadEventFired")
  await new Promise((resolve) => setTimeout(resolve, 300))
  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
    clip: { x: 0, y: 0, width, height, scale: 1 },
  })
  await writeFile(output, Buffer.from(screenshot.result.data, "base64"))
  ws.close()
} finally {
  chromeProcess.kill("SIGTERM")
}
