import { RouteItem, routes } from "./routes"

const readKey = "scripting.doc.read"
const dateKey = "scripting.doc.date"
const docsKey = "scripting.doc.list"
const docCount = 8

class DocStore {

  docsToRead!: RouteItem[]

  constructor() {
    let today = new Date().toLocaleDateString()

    if (Storage.get<string>(dateKey) != today) {
      Storage.set(dateKey, today)
      this.saveRandomDocsToRead()
    } else {
      this.docsToRead = Storage.get<RouteItem[]>(docsKey) ?? []
    }
  }

  saveRandomDocsToRead() {
    const docs: RouteItem[] = []

    while (docs.length < docCount) {
      const route = this.getRandomRouteItem(routes)

      if (!docs.includes(route)) {
        docs.push(route)
      }
    }

    this.docsToRead = docs
    Storage.set(docsKey, docs)
  }

  private getRandomRouteItem(routes: RouteItem[]): RouteItem {
    const index = Math.random() * routes.length | 0
    const route = routes[index]

    return route.children != null
      ? this.getRandomRouteItem(route.children)
      : route
  }

  getReadRecord(): Record<string, boolean> {
    return Storage.get<Record<string, boolean>>(readKey) ?? {}
  }

  setRead(title: string) {
    let record = this.getReadRecord()
    if (record[title]) {
      return
    }

    record[title] = true
    Storage.set(readKey, record)
  }

  toggleRead(title: string) {
    let record = this.getReadRecord()
    if (record[title]) {
      delete record[title]
    } else {
      record[title] = true
    }

    Storage.set(readKey, record)
  }
}

export const store = new DocStore()