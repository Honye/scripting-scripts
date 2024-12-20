import { Navigation, NavigationStack, Button, Script, EmptyView, ContentUnavailableView, VirtualNode, Group, Widget, } from 'scripting'
import { NavigationListView } from './navigation_list_view'
import { useModel } from './model'
import { findRouteByTitle } from './routes'
import { store } from './store'

function MainView() {
  const dismiss = Navigation.useDismiss()
  const {
    searchText,
    setSearchText,
    list,
  } = useModel()

  return <NavigationStack>
    <NavigationListView
      title="Documentation"
      items={list}
      toolbar={{
        topBarLeading: <Button
          title={"Done"}
          action={dismiss}
        />
      }}
      searchable={{
        value: searchText,
        onChanged: setSearchText,
      }}
      overlay={
        list.length
          ? <EmptyView />
          : <ContentUnavailableView
            title={"Not found"}
            systemImage={"square.2.layers.3d"}
          />
      }
    />
  </NavigationStack>
}

function SingleDocViewer({
  title,
  children,
}: {
  title: string
  children: VirtualNode | undefined
}) {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <Group
      navigationTitle={title}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        topBarLeading: <Button
          title={"Done"}
          action={dismiss}
        />
      }}
    >
      {children}
    </Group>
  </NavigationStack>
}

async function run() {
  const docTitle = Script.queryParameters["doc"]
  if (typeof docTitle === "string") {
    // If the script is opened by widget
    const route = findRouteByTitle(docTitle)

    if (route != null) {
      await Navigation.present({
        element: (
          <SingleDocViewer
            title={route.title}
          >
            {route.destination}
          </SingleDocViewer>
        ),
        modalPresentationStyle: 'pageSheet',
      })

      // Mark as read.
      store.setRead(route.title)
      Widget.reloadAll()
      
      Script.exit()
      return
    } else {
      console.error(`Document of "${docTitle}" not found.`)
    }
  }

  await Navigation.present({
    element: <MainView />,
    modalPresentationStyle: 'pageSheet',
  })

  Script.exit()
}

run()