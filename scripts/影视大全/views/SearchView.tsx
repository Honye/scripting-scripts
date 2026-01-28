import { Text, useObservable, VStack } from "scripting"

export default function SearchView() {
  const keyword = useObservable('')

  return (
    <VStack
      searchable={{
        value: keyword,
        prompt: 'Search'
      }}
    >
      <Text>Search</Text>
    </VStack>
  )
}
