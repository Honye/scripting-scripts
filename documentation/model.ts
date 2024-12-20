import { useState, useMemo } from "scripting"
import { routes, RouteItem } from "./routes"

export function useModel() {
  const [
    searchText,
    setSearchText
  ] = useState("")
  const filteredRoutes = useMemo(() => {
    if (searchText.length === 0) {
      return routes
    }

    const text = searchText.toLowerCase()
    const result: RouteItem[] = []

    const traversal = (
      list: RouteItem[]
    ) => {
      for (const item of list) {
        if (item.children) {
          traversal(
            item.children
          )
        }
        if (item
          .title
          .toLowerCase()
          .includes(text)
          || item
            .keywords
            ?.some(
              item => item
                .toLowerCase()
                .includes(text)
            )) {
          result.push(item)
        }
      }
    }

    traversal(routes)
    return result
  }, [searchText])

  const list = searchText.length !== 0
    ? filteredRoutes
    : routes

  return {
    list,
    searchText,
    setSearchText,
  }
}