import { fetch, Intent, Script } from 'scripting'
import { Subscription, WidgetJSON } from './types'
import { download } from './files'

const dealURL = (url: string) => {
    const blobRegxp = /^https:\/\/github\.com\/(.+)\/blob\/(.+\.json$)/
    if (blobRegxp.test(url)) {
      url = url.replace(blobRegxp, 'https://raw.githubusercontent.com/$1/$2')
    }
    return url
  }

const saveSubscription = async (url: string) => {
  url = dealURL(url)
  const regex = new RegExp('^https?://raw\.githubusercontent\.com/([^/]+)/([^/]+)/(?:refs/heads/)?([^/]+)/(.*)$')
  const match = url.match(regex)
  if (!match) return

  const [, owner, repo, branch, path] = match
  const data: WidgetJSON = await fetch(url).then((resp) => resp.json())
  const subscription: Subscription = {
    name: data.name,
    version: data.version,
    icon: data.icon,
    color: data.color,
    repo: `${owner}/${repo}`,
    url
  }
  const subscriptions = Storage.get<Subscription[]>('subscriptions') || []
  const i = subscriptions.findIndex((item) => item.url === subscription.url)
  if (i !== -1) {
    subscriptions[i] = subscription
  } else {
    subscriptions.push(subscription)
  }
  Storage.set('subscriptions', subscriptions)
  await download(
    `${owner}/${repo}`,
    branch,
    decodeURIComponent(path),
    data.name
  )
}

async function run() {
  const urls = Intent.urlsParameter
  if (urls && urls[0]) {
    console.log('URL: ', urls[0])
    console.present().then(() => {
      Script.exit()
    })
    await saveSubscription(urls[0])
  } else {
    Script.exit()
  }
}

run()
