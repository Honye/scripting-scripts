import {
  Button,
  List,
  Navigation,
  NavigationStack,
  Script,
  Section,
  Text,
  TextField,
  useState,
  VStack,
} from "scripting"

const SAMPLE_LANG = "今天天气真好,Tim Cook visited Beijing yesterday. ¡Hola mundo!"
const SAMPLE_TAGGER = "Tim Cook visited Beijing yesterday. The food was absolutely fantastic!"
const SAMPLE_GAZETTEER = "Acme Corp ships the Scripting app worldwide."

function safeCall<T>(label: string, fn: () => T): T | null {
  try {
    return fn()
  } catch (e) {
    Dialog.alert({
      title: label,
      message: String(e),
    })
    return null
  }
}

async function safeCallAsync<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch (e) {
    Dialog.alert({
      title: label,
      message: String(e),
    })
    return null
  }
}

function Example() {
  const dismiss = Navigation.useDismiss()

  // Language recognition
  const [langText, setLangText] = useState(SAMPLE_LANG)
  const [dominant, setDominant] = useState<string>("—")
  const [hypotheses, setHypotheses] = useState<string>("—")

  // Tokenizer
  const [tokText, setTokText] = useState("Hello, world! 你好世界。")
  const [tokens, setTokens] = useState<string>("—")

  // Tagger
  const [tagText, setTagText] = useState(SAMPLE_TAGGER)
  const [namedEntities, setNamedEntities] = useState<string>("—")
  const [sentiment, setSentiment] = useState<string>("—")
  const [posTags, setPosTags] = useState<string>("—")

  // Embedding
  const [embA, setEmbA] = useState("happy")
  const [embB, setEmbB] = useState("joyful")
  const [embDistance, setEmbDistance] = useState<string>("—")
  const [embNeighbors, setEmbNeighbors] = useState<string>("—")

  // Gazetteer
  const [gazTags, setGazTags] = useState<string>("—")

  // Contextual embedding
  const [ctxStatus, setCtxStatus] = useState<string>("idle")
  const [ctxResult, setCtxResult] = useState<string>("—")

  return <NavigationStack>
    <List
      navigationTitle={"NaturalLanguage"}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        cancellationAction: <Button title={"Done"} action={dismiss} />,
      }}
    >
      {/* 1. Language recognition */}
      <Section
        header={<Text>1. Language recognition</Text>}
        footer={<Text>dominantLanguage / languageHypotheses</Text>}
      >
        <TextField
          title={"text"}
          value={langText}
          onChanged={setLangText}
        />
        <Button
          title={"Detect language"}
          action={() => {
            const lang = safeCall("dominantLanguage", () =>
              NaturalLanguage.dominantLanguage(langText)
            )
            setDominant(lang ?? "null")

            const hyps = safeCall("languageHypotheses", () =>
              NaturalLanguage.languageHypotheses(langText, { maximumCount: 3 })
            )
            setHypotheses(
              hyps
                ? hyps
                  .map(h => `${h.language} ${(h.confidence * 100).toFixed(1)}%`)
                  .join("  /  ")
                : "—"
            )
          }}
        />
        <VStack alignment={"leading"}>
          <Text font={"headline"}>dominant</Text>
          <Text font={"caption"}>{dominant}</Text>
        </VStack>
        <VStack alignment={"leading"}>
          <Text font={"headline"}>top hypotheses</Text>
          <Text font={"caption"}>{hypotheses}</Text>
        </VStack>
      </Section>

      {/* 2. Tokenizer */}
      <Section
        header={<Text>2. Tokenizer</Text>}
        footer={<Text>tokenize — words / sentences / paragraphs.</Text>}
      >
        <TextField
          title={"text"}
          value={tokText}
          onChanged={setTokText}
        />
        <Button
          title={"Tokenize as words"}
          action={() => {
            const result = safeCall("tokenize (word)", () =>
              NaturalLanguage.tokenize(tokText, { unit: "word" })
            )
            setTokens(result ? result.map(t => `"${t.text}"`).join(" · ") : "—")
          }}
        />
        <Button
          title={"Tokenize as sentences"}
          action={() => {
            const result = safeCall("tokenize (sentence)", () =>
              NaturalLanguage.tokenize(tokText, { unit: "sentence" })
            )
            setTokens(result ? result.map(t => `[${t.text.trim()}]`).join("\n") : "—")
          }}
        />
        <VStack alignment={"leading"}>
          <Text font={"headline"}>tokens</Text>
          <Text font={"caption"}>{tokens}</Text>
        </VStack>
      </Section>

      {/* 3. Tagger (NER + sentiment + POS) */}
      <Section
        header={<Text>3. Tagger</Text>}
        footer={<Text>Named entities, sentiment, part-of-speech tags.</Text>}
      >
        <TextField
          title={"text"}
          value={tagText}
          onChanged={setTagText}
        />
        <Button
          title={"Run Tagger"}
          action={() => {
            const tagger = safeCall("new Tagger", () =>
              new NaturalLanguage.Tagger(["nameType", "lexicalClass", "sentimentScore"])
            )
            if (!tagger) { return }
            tagger.setText(tagText)

            const entities = safeCall("enumerateNamedEntities", () =>
              tagger.enumerateNamedEntities()
            )
            setNamedEntities(
              entities && entities.length > 0
                ? entities.map(e => `${e.entity}: ${e.text}`).join("\n")
                : "(none)"
            )

            const score = safeCall("sentimentScore", () => tagger.sentimentScore())
            setSentiment(score == null ? "null" : score.toFixed(3))

            const pos = safeCall("tags (lexicalClass)", () =>
              tagger.tags(null, "word", "lexicalClass", {
                omitWhitespace: true,
                omitPunctuation: true,
              })
            )
            setPosTags(
              pos
                ? pos
                  .filter(t => t.tag != null)
                  .slice(0, 8)
                  .map(t => `${t.tag}@${t.range.location}`)
                  .join(" · ")
                : "—"
            )
          }}
        />
        <VStack alignment={"leading"}>
          <Text font={"headline"}>named entities</Text>
          <Text font={"caption"}>{namedEntities}</Text>
        </VStack>
        <VStack alignment={"leading"}>
          <Text font={"headline"}>sentiment</Text>
          <Text font={"caption"}>{sentiment}</Text>
        </VStack>
        <VStack alignment={"leading"}>
          <Text font={"headline"}>first 8 POS tags</Text>
          <Text font={"caption"}>{posTags}</Text>
        </VStack>
      </Section>

      {/* 4. Embedding */}
      <Section
        header={<Text>4. Embedding</Text>}
        footer={<Text>Distance + nearest neighbors from the English word embedding.</Text>}
      >
        <TextField title={"token A"} value={embA} onChanged={setEmbA} />
        <TextField title={"token B"} value={embB} onChanged={setEmbB} />
        <Button
          title={"Distance + neighbors"}
          action={() => {
            const emb = safeCall("wordEmbedding(en)", () =>
              NaturalLanguage.Embedding.wordEmbedding("en")
            )
            if (!emb) {
              setEmbDistance("(no en embedding available)")
              setEmbNeighbors("—")
              return
            }
            const dist = safeCall("distance", () => emb.distance(embA, embB))
            setEmbDistance(dist == null ? "null (token oov)" : dist.toFixed(4))

            const neigh = safeCall("neighbors", () => emb.neighbors(embA, 5))
            setEmbNeighbors(
              neigh && neigh.length > 0
                ? neigh.map(n => `${n.token} (${n.distance.toFixed(3)})`).join("  /  ")
                : "(none)"
            )
          }}
        />
        <VStack alignment={"leading"}>
          <Text font={"headline"}>{`distance(${embA}, ${embB})`}</Text>
          <Text font={"caption"}>{embDistance}</Text>
        </VStack>
        <VStack alignment={"leading"}>
          <Text font={"headline"}>{`neighbors(${embA}, 5)`}</Text>
          <Text font={"caption"}>{embNeighbors}</Text>
        </VStack>
      </Section>

      {/* 5. Gazetteer */}
      <Section
        header={<Text>5. Gazetteer</Text>}
        footer={<Text>Custom lexicon overrides the system tagger.</Text>}
      >
        <VStack alignment={"leading"}>
          <Text font={"headline"}>sample text</Text>
          <Text font={"caption"}>{SAMPLE_GAZETTEER}</Text>
        </VStack>
        <Button
          title={"Tag with custom dictionary"}
          action={() => {
            const gz = safeCall("new Gazetteer", () =>
              new NaturalLanguage.Gazetteer({
                product: ["Scripting"],
                company: ["Acme", "Acme Corp"],
              }, "en")
            )
            if (!gz) { return }

            const tagger = safeCall("new Tagger(nameType)", () =>
              new NaturalLanguage.Tagger(["nameType"])
            )
            if (!tagger) { return }
            tagger.setGazetteers([gz], "nameType")
            tagger.setText(SAMPLE_GAZETTEER)

            const tags = safeCall("tags (nameType)", () =>
              tagger.tags(null, "word", "nameType", {
                omitWhitespace: true,
                omitPunctuation: true,
              })
            )
            setGazTags(
              tags
                ? tags
                  .filter(t => t.tag != null)
                  .map(t => `${t.tag}@${t.range.location}`)
                  .join(" · ")
                : "—"
            )
          }}
        />
        <VStack alignment={"leading"}>
          <Text font={"headline"}>tags</Text>
          <Text font={"caption"}>{gazTags}</Text>
        </VStack>
      </Section>

      {/* 6. Contextual embedding */}
      <Section
        header={<Text>6. ContextualEmbedding</Text>}
        footer={<Text>Downloads assets on first prepare(); may take a moment.</Text>}
      >
        <Button
          title={"prepare() + embeddingResult()"}
          action={async () => {
            setCtxStatus("loading embedding...")
            const emb = safeCall("forLanguage(en)", () =>
              NaturalLanguage.ContextualEmbedding.forLanguage("en")
            )
            if (!emb) {
              setCtxStatus("no embedding for en")
              return
            }

            setCtxStatus("requesting assets...")
            await safeCallAsync("prepare", () => emb.prepare())

            setCtxStatus("computing...")
            const result = await safeCallAsync("embeddingResult", () =>
              emb.embeddingResult("NaturalLanguage on iOS is cool.", "en")
            )
            if (!result) {
              setCtxStatus("embeddingResult failed")
              return
            }

            setCtxStatus(`done · sequenceLength=${result.sequenceLength}`)
            const head = result.tokens.slice(0, 3).map(t =>
              `${t.text} → [${t.vector.slice(0, 4).map(v => v.toFixed(3)).join(", ")}...]`
            ).join("\n")
            setCtxResult(head || "(empty)")
          }}
        />
        <VStack alignment={"leading"}>
          <Text font={"headline"}>status</Text>
          <Text font={"caption"}>{ctxStatus}</Text>
        </VStack>
        <VStack alignment={"leading"}>
          <Text font={"headline"}>first 3 tokens · first 4 dims</Text>
          <Text font={"caption"}>{ctxResult}</Text>
        </VStack>
      </Section>
    </List>
  </NavigationStack>
}

async function run() {
  await Navigation.present({
    element: <Example />,
  })
  Script.exit()
}

run()
