import { Button, fetch, Group, HStack, Image, List, Navigation, NavigationStack, ProgressView, RoundedRectangle, Script, Text, useState, VStack } from 'scripting'
import { Subscription, WidgetJSON } from './types'
import { download } from './files'

interface SubscriptionItem extends Subscription {
  loading?: boolean
}

function App() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>(Storage.get('subscriptions') || [])

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
      setSubscriptions(subscriptions)
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
    await download(`${owner}/${repo}`, branch, path, data.name)
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
        {subscriptions.map((item) => (
          <HStack
            key={item.url}
            contextMenu={{
              menuItems: <Group>
                <Button
                  systemImage='arrow.trianglehead.clockwise.rotate.90'
                  title='Update'
                  action={() => saveSubscription(item.url)}
                />
                <Button
                  systemImage='trash'
                  title='Delete'
                  role='destructive'
                  foregroundStyle='systemRed'
                  action={() => removeSubscription(item)}
                />
              </Group>
            }}
            trailingSwipeActions={{
              actions: [
                <Button
                  title='Delete'
                  role='destructive'
                  action={() => removeSubscription(item)}
                />,
                <Button
                  title='Update'
                  action={() => saveSubscription(item.url)}
                />
              ]
            }}
          >
            <Image
              frame={{ width: 40, height: 40 }}
              systemName={item.icon}
              foregroundStyle='white'
              font={20}
              background={
                <RoundedRectangle fill={item.color} cornerRadius={8} />
              }
            />
            <VStack alignment='leading'>
              <HStack>
                <Text>{item.name}</Text>
                <Text font='callout' foregroundStyle='secondaryLabel'>v{item.version}</Text>
              </HStack>
              <Text font='footnote' foregroundStyle='secondaryLabel'>{item.repo}</Text>
            </VStack>
            { item.loading ? <ProgressView /> : null }
          </HStack>
        ))}
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
