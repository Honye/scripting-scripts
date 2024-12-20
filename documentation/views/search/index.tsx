import { Button, List, NavigationStack, Text, useMemo, useState } from "scripting"
import { CodePreview } from "../../ui_example"

export function SearchExample() {
  const [codeVisible, setCodeVisible] = useState(false)
  const [searchText, setSearchText] = useState("")
  const languages = useMemo(() => [
    "Java",
    "Objective-C",
    "Swift",
    "Python",
    "JavaScript",
    "C++",
    "Ruby",
    "Lua"
  ], [])

  const filteredLanguages = useMemo(() => {
    if (searchText.length === 0) {
      return languages
    }

    const text = searchText.toLowerCase()

    return languages.filter(language =>
      language.toLowerCase().includes(text)
    )
  }, [searchText, languages])

  return <NavigationStack>
    <List
      navigationTitle={"Searchable List"}
      searchable={{
        value: searchText,
        onChanged: setSearchText,
      }}
      toolbar={{
        topBarTrailing: <Button
          title={"Code"}
          buttonStyle={'borderedProminent'}
          controlSize={'small'}
          action={() => setCodeVisible(true)}
          popover={{
            isPresented: codeVisible,
            onChanged: setCodeVisible,
            content: <CodePreview
              code={code}
              dismiss={() => setCodeVisible(false)}
            />
          }}
        />
      }}
    >
      {filteredLanguages.map(language =>
        <Text>{language}</Text>
      )}
    </List>
  </NavigationStack>
}

const code = `function SearchExample() {
  const [searchText, setSearchText] = useState("")
  const languages = useMemo(() => [
    "Java",
    "Objective-C",
    "Swift",
    "Python",
    "JavaScript",
    "C++",
    "Ruby",
    "Lua"
  ], [])

  const filteredLanguages = useMemo(() => {
    if (searchText.length === 0) {
      return languages
    }

    const text = searchText.toLowerCase()

    return languages.filter(language =>
      language.toLowerCase().includes(text)
    )
  }, [searchText, languages])

  return <NavigationStack>
    <List
      navigationTitle={"Searchable List"}
      searchable={{
        value: searchText,
        onChanged: setSearchText,
      }}
    >
      {filteredLanguages.map(language =>
        <Text>{language}</Text>
      )}
    </List>
  </NavigationStack>
}`