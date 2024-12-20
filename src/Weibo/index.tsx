import { fetch } from 'scripting'

const fetchData = async () => {
  const url = 'https://weibointl.api.weibo.cn/portal.php?ct=feed&a=search_topic'
  const res = await fetch(url).then((resp) => resp.json())
  return res
}

const main = async () => {
  console.log('Hello Scripting!')
  await fetchData()
}

main()
