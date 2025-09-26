import { Button, Image, List, Navigation, NavigationLink, NavigationStack, Script, Spacer, useState } from 'scripting'
import { Subscription } from './types'
import { download } from './files'
import SubscriptionView from './components/Subscription'
import { Authorization } from './pages/Authorization'
import { getScriptInfo } from './apis/github'

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
    const data = await getScriptInfo(`${owner}/${repo}`, path)
    if (!data) return

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
    await saveSubscription(url).catch((err) => {
      console.present()
      console.error(err)
    })
  }

  const move = (index: number, offset: number) => {
    const [item] = subscriptions.splice(index, 1)
    subscriptions.splice(index + offset, 0, item)
    Storage.set('subscriptions', subscriptions)
    setSubscriptions([...subscriptions])
  }

  return (
    <NavigationStack>
      <List
        navigationBarTitleDisplayMode='inline'
        toolbar={{
          topBarTrailing: [
            <NavigationLink
              destination={<Authorization />}
            >
              <Image systemName='gearshape' />
            </NavigationLink>
          ],
          bottomBar: [
            <Spacer />,
            <Button action={showDialog}>
              <Image systemName='plus' />
            </Button>
          ]
        }}
      >
        {subscriptions.map((item, index) => (
          <SubscriptionView
            key={item.url}
            data={item}
            loading={item.loading}
            onUpdate={() => saveSubscription(item.url)}
            onRemove={() => removeSubscription(item)}
            onMoveUp={() => move(index, -1)}
            onMoveDown={() => move(index, 1)}
          />
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
