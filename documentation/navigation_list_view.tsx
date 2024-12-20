import { NavigationLink, ContentUnavailableView, List, DisclosureGroup, HStack, Text, Spacer, Navigation, VStack } from "scripting"
import { RouteItem } from "./routes"

function NavigationItemView({
  item
}: {
  item: RouteItem
}) {

  return <NavigationLink
    destination={
      item.destination
        ? item.destination
        : item.children
          ? <NavigationListView
            title={item.title}
            items={item.children}
          />
          : <ContentUnavailableView
            title={"You must set a destination view."}
            systemImage={"tray"}
          />
    }
  >
    <VStack
      alignment={"leading"}
    >
      <Text>{item.title}</Text>
      {item.subtitle != null
        ? <Text
          font={"subheadline"}
          foregroundStyle={"secondaryLabel"}
        >{item.subtitle}</Text>
        : null
      }
    </VStack>
  </NavigationLink>
}


export function NavigationListView({
  title,
  items,
}: {
  title: string
  items: RouteItem[]
}) {
  return <List
    navigationTitle={title}
    navigationBarTitleDisplayMode={"inline"}
    listStyle={"inset"}
  >
    {items.map(item =>
      <NavigationItemView
        item={item}
      />
    )}
  </List>
}
