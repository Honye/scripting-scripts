import { Button, fetch, ForEach, Image, List, Navigation, NavigationStack, Script, useState } from 'scripting'
import { Subscription, WidgetJSON } from './types'
import { download } from './files'
import SubscriptionView from './components/Subscription'

interface SubscriptionItem extends Subscription {
  loading?: boolean
}

function App() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(Storage.get('subscriptions') || [])
  const [foreachKey, setForeachKey] = useState(UUID.string())

  const dealURL = (url: string) => {
    const blobRegxp = /^https:\/\/github\.com\/(.+)\/blob\/(.+\.json$)/
    if (blobRegxp.test(url)) {
      url = url.replace(blobRegxp, 'https://raw.githubusercontent.com/$1/$2')
    }
    return url
  }

  const updateSubscription = (subscription: Subscription) => {
    const subscriptions = Storage.get<SubscriptionItem[]>('subscriptions') || []
    const i = subscriptions.findIndex((item) => item.url === subscription.url)
    if (i !== -1) {
      subscriptions[i] = subscription
    } else {
      subscriptions.push(subscription)
    }
    Storage.set('subscriptions', subscriptions)
    setSubscriptions(subscriptions)
  }

  const removeSubscription = (subscription: Subscription) => {
    const subscriptions = Storage.get<Subscription[]>('subscriptions') || []
    const i = subscriptions.findIndex((item) => item.url === subscription.url)
    if (i !== -1) {
      subscriptions.splice(i, 1)
      Storage.set('subscriptions', subscriptions)
      // setSubscriptions(subscriptions)
    }
  }

  const saveSubscription = async (url: string) => {
    const regex = new RegExp('^https?://raw\.githubusercontent\.com/([^/]+)/([^/]+)/(?:refs/heads/)?([^/]+)/(.*)$')
    const match = url.match(regex)
    if (!match) return

    const [, owner, repo, branch, path] = match
    const data: WidgetJSON = await fetch(url).then((resp) => resp.json())
    const subscription: SubscriptionItem = {
      name: data.name,
      version: data.version,
      icon: data.icon,
      color: data.color,
      repo: `${owner}/${repo}`,
      url,
      loading: true
    }
    const subscriptions = Storage.get<SubscriptionItem[]>('subscriptions') || []
    const i = subscriptions.findIndex((item) => item.url === subscription.url)
    if (i !== -1) {
      subscriptions[i] = subscription
    } else {
      subscriptions.push(subscription)
    }
    Storage.set('subscriptions', subscriptions)
    setSubscriptions(subscriptions)
    setForeachKey(UUID.string())
    await download(
      `${owner}/${repo}`,
      branch,
      decodeURIComponent(path),
      data.name
    )
    subscription.loading = false
    updateSubscription(subscription)
  }

  const showDialog = async () => {
    let url = await Dialog.prompt({
      title: 'Subscribe',
      message: 'GitHub script.json file URL',
      placeholder: 'https://github.com/User/Repo/blob/main/scripts/Demo/script.json',
      keyboardType: 'URL'
    })
    if (!url) return

    url = dealURL(url)
    await saveSubscription(url).catch((err) => console.error(err))
  }

  const onMove = (indices: number[], newOffset: number) => {
    const movingItems = indices.map(index => subscriptions[index])
    const newList = subscriptions.filter((_, index) => !indices.includes(index))
    newList.splice(newOffset, 0, ...movingItems)
    Storage.set('subscriptions', newList)
    setSubscriptions(newList)
  }

  return (
    <NavigationStack>
      <List
        toolbar={{
          topBarTrailing: [
            <Button action={showDialog}>
              <Image systemName='plus' />
            </Button>
          ]
        }}
      >
        <ForEach
          key={foreachKey}
          count={subscriptions.length}
          itemBuilder={(index) =>
            <SubscriptionView
              key={subscriptions[index].url}
              data={subscriptions[index]}
              loading={subscriptions[index].loading}
              onUpdate={() => saveSubscription(subscriptions[index].url)}
              onRemove={() => removeSubscription(subscriptions[index])}
            />
          }
          onMove={onMove}
        />
      </List>
    </NavigationStack>
  )
}

async function main() {
  Navigation.present({
    element: <App />
  }).finally(() => {
    Script.exit()
  })
}

main()
