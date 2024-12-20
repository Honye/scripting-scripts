import { Divider, ForEach, Grid, GridRow, HStack, Image, Rectangle, ScrollView, Text, Toggle, useState, VStack } from "scripting"
import { UIExample } from "../../ui_example"

export function GridExample() {
  const [gridCellUnsizedAxes, setGridCellUnsizedAxes] = useState(false)

  return <ScrollView>
    <VStack>
      <UIExample
        title={"Grid"}
        code={`<Grid>
  <GridRow>
    <Text>Hello</Text>
    <Image systemName={"globe"} />
  </GridRow>
  <GridRow>
    <Image systemName={"hand.wave"} />
    <Text>World</Text>
  </GridRow>
</Grid>`}
      >
        <Grid>
          <GridRow>
            <Text>Hello</Text>
            <Image systemName={"globe"} />
          </GridRow>
          <GridRow>
            <Image systemName={"hand.wave"} />
            <Text>World</Text>
          </GridRow>
        </Grid>
      </UIExample>

      <UIExample
        title={"Grid Divider"}
        code={`<Grid>
  <GridRow>
    <Text>Hello</Text>
    <Image systemName={"globe"} />
  </GridRow>
  <Divider
    gridCellUnsizedAxes={gridCellUnsizedAxes
      ? 'horizontal'
      : undefined}
  />
  <GridRow>
    <Image systemName={"hand.wave"} />
    <Text>World</Text>
  </GridRow>
</Grid>`}
      >
        <VStack>

          <Toggle
            title={"gridCellUnsizedAxes"}
            value={gridCellUnsizedAxes}
            onChanged={setGridCellUnsizedAxes}
          />
          <Grid>
            <GridRow>
              <Text>Hello</Text>
              <Image systemName={"globe"} />
            </GridRow>
            <Divider
              gridCellUnsizedAxes={gridCellUnsizedAxes
                ? 'horizontal'
                : undefined}
            />
            <GridRow>
              <Image systemName={"hand.wave"} />
              <Text>World</Text>
            </GridRow>
          </Grid>
        </VStack>
      </UIExample>

      <UIExample
        title={"Column count, cell spacing, alignment"}
        code={`<Grid
  alignment={"bottom"}
  verticalSpacing={1}
  horizontalSpacing={1}
>
  <GridRow>
    <Text>Row 1</Text>
    <ForEach
      count={2}
      itemBuilder={index =>
        <Rectangle
          fill={"red"}
          key={index.toString()}
        />
      }
    />
  </GridRow>
  <GridRow>
    <Text>Row 2</Text>
    <ForEach
      count={5}
      itemBuilder={index =>
        <Rectangle
          fill={"green"}
          key={index.toString()}
        />
      }
    />
  </GridRow>
  <GridRow>
    <Text>Row 3</Text>
    <ForEach
      count={5}
      itemBuilder={index =>
        <Rectangle
          fill={"blue"}
          key={index.toString()}
        />
      }
    />
  </GridRow>
</Grid>`}
      >
        <Grid
          alignment={"bottom"}
          verticalSpacing={1}
          horizontalSpacing={1}
        >
          <GridRow>
            <Text>Row 1</Text>
            <ForEach
              count={2}
              itemBuilder={index =>
                <Rectangle
                  fill={"red"}
                  key={index.toString()}
                />
              }
            />
          </GridRow>
          <GridRow>
            <Text>Row 2</Text>
            <ForEach
              count={5}
              itemBuilder={index =>
                <Rectangle
                  fill={"green"}
                  key={index.toString()}
                />
              }
            />
          </GridRow>
          <GridRow>
            <Text>Row 3</Text>
            <ForEach
              count={5}
              itemBuilder={index =>
                <Rectangle
                  fill={"blue"}
                  key={index.toString()}
                />
              }
            />
          </GridRow>
        </Grid>
      </UIExample>
    </VStack>
  </ScrollView>
}