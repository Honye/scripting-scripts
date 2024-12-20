import { Button, Navigation, NavigationStack, ScrollView, VStack } from "scripting"
import { APIExample } from "../api_example"

export function PhotosExample() {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <ScrollView
      navigationTitle={"Photos"}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        topBarLeading: <Button
          title={"Done"}
          action={dismiss}
        />
      }}
    >
      <VStack>
        <APIExample
          title={"Photos.getLatestPhotos"}
          subtitle={"Get the latest specified number of photos from the Photos app."}
          code={`const images = await Photos.getLatestPhotos(1)
const image = images?.[0]

if (image != null) {
  console.log(\`Image size: \${image.width}*\${image.height}\`)
} else {
  console.log("Cancelled")
}`}
          run={async log => {
            const images = await Photos.getLatestPhotos(1)
            const image = images?.[0]

            if (image != null) {
              log(`Image size: ${image.width}*${image.height}`)
            } else {
              log("Cancelled")
            }
          }}
        />

        <APIExample
          title={"Photos.pickPhotos"}
          subtitle={"Present a photo picker dialog and pick limited number of photos."}
          code={`const images = await Photos.pickPhotos(1)
const image = images?.[0]

if (image != null) {
  console.log(\`Image size: \${image.width}*\${image.height}\`)
} else {
  console.log("Cancelled")
}`}
          run={async log => {
            const images = await Photos.pickPhotos(1)
            const image = images?.[0]

            if (image != null) {
              log(`Image size: ${image.width}*${image.height}`)
            } else {
              log("Cancelled")
            }
          }}
        />

        <APIExample
          title={"Photos.takePhoto"}
          subtitle={"Take a photo and return a UIImage instance."}
          code={`const image = await Photos.takePhoto()

if (image != null) {
  console.log(\`Image size: \${image.width}*\${image.height}\`)
} else {
  console.log("Cancelled")
}`}
          run={async log => {
            const image = await Photos.takePhoto()

            if (image != null) {
              log(`Image size: ${image.width}*${image.height}`)
            } else {
              log("Cancelled")
            }
          }}
        />

        <APIExample
          title={"Photos.savePhoto"}
          subtitle={"Save an image to the Photos app. Returns a boolean value indicates that whether the operation is successful."}
          code={`const image = await Photos.takePhoto()

if (image != null) {
  const success = await Photos.savePhoto(Data.fromJPEG(image, 0.5)!)
  Dialog.alert({
    message: "The photo has been saved: " + success
  })
}`}
          run={async (log) => {
            const image = await Photos.takePhoto()

            if (image != null) {
              const success = await Photos.savePhoto(Data.fromJPEG(image, 0.5)!)
              Dialog.alert({
                message: "The photo has been saved: " + success
              })
            } else {
              log("Canceled")
            }
          }}
        />
      </VStack>
    </ScrollView>
  </NavigationStack>
}