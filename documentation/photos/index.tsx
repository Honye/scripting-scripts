import { Button, Dialog, List, Navigation, NavigationStack, Script, Section, Text, } from "scripting"

function Example() {
  const dismiss = Navigation.useDismiss()

  return <NavigationStack>
    <List
      navigationTitle={"Photos"}
      navigationBarTitleDisplayMode={"inline"}
      toolbar={{
        cancellationAction: <Button
          title={"Done"}
          action={dismiss}
        />
      }}
    >
      <Section
        footer={
          <Text>Get the latest specified number of photos from the Photos app.</Text>
        }
      >
        <Button
          title={"Photos.getLatestPhotos"}
          action={async () => {
            const images = await Photos.getLatestPhotos(1)
            const image = images?.[0]

            if (image != null) {
              Dialog.alert({
                message: `Image size: ${image.width}*${image.height}`
              })
            } else {
              Dialog.alert({
                message: "Cancelled"
              })
            }
          }}
        />
      </Section>

      <Section
        footer={
          <Text>Present a photo picker dialog and pick limited number of photos.</Text>
        }
      >

        <Button
          title={"Photos.pickPhotos"}
          action={async () => {
            const images = await Photos.pickPhotos(1)
            const image = images?.[0]

            if (image != null) {
              Dialog.alert({
                message: `Image size: ${image.width}*${image.height}`
              })
            } else {
              Dialog.alert({
                message: "Cancelled"
              })
            }
          }}
        />
      </Section>

      <Section
        footer={
          <Text>Take a photo and return a UIImage instance.</Text>
        }
      >
        <Button
          title={"Photos.takePhoto"}
          action={async () => {
            const image = await Photos.takePhoto()

            if (image != null) {
              Dialog.alert({
                message: `Image size: ${image.width}*${image.height}`
              })
            } else {
              Dialog.alert({
                message: "Cancelled"
              })
            }
          }}
        />
      </Section>

      <Section
        footer={
          <Text>Save an image to the Photos app. Returns a boolean value indicates that whether the operation is successful.</Text>
        }
      >
        <Button
          title={"Photos.savePhoto"}
          action={async () => {
            const image = await Photos.takePhoto()

            if (image != null) {
              const success = await Photos.savePhoto(Data.fromJPEG(image, 0.5)!)
              Dialog.alert({
                message: "The photo has been saved: " + success
              })
            } else {
              Dialog.alert({
                message: "Canceled"
              })
            }
          }}
        />
      </Section>

      <Section
        header={<Text>Photo Asset Layer</Text>}
        footer={
          <Text>Query the library and read rich metadata (date, dimensions, location, subtypes) from each PHAsset.</Text>
        }
      >
        <Button
          title={"Photos.fetchAssets"}
          action={async () => {
            const status = Photos.authorizationStatus()
            const assets = await Photos.fetchAssets({ mediaType: "image", limit: 5 })
            const newest = assets[0]

            if (newest == null) {
              Dialog.alert({ message: `No photos found. (status: ${status})` })
              return
            }

            const created = newest.creationDate != null
              ? new Date(newest.creationDate).toLocaleString()
              : "unknown"
            const where = newest.location != null
              ? `${newest.location.latitude.toFixed(3)}, ${newest.location.longitude.toFixed(3)}`
              : "none"

            Dialog.alert({
              message: [
                `Fetched ${assets.length} asset(s).`,
                `Newest: ${newest.pixelWidth}×${newest.pixelHeight}`,
                `Created: ${created}`,
                `Favorite: ${newest.isFavorite}`,
                `Subtypes: ${newest.mediaSubtypes.join(", ") || "none"}`,
                `Location: ${where}`,
              ].join("\n")
            })
          }}
        />

        <Button
          title={"Asset.requestImage (thumbnail)"}
          action={async () => {
            const assets = await Photos.fetchAssets({ mediaType: "image", limit: 1 })
            const asset = assets[0]
            if (asset == null) {
              Dialog.alert({ message: "No photos found." })
              return
            }
            const image = await asset.requestImage({
              targetWidth: 200,
              targetHeight: 200,
              contentMode: "aspectFill",
            })
            Dialog.alert({
              message: image != null
                ? `Loaded thumbnail: ${image.width}×${image.height}`
                : "Failed to load image."
            })
          }}
        />

        <Button
          title={"Photos.fetchAlbums"}
          action={async () => {
            const albums = await Photos.fetchAlbums({ type: "smartAlbum" })
            const titles = albums
              .slice(0, 8)
              .map(a => `• ${a.title ?? a.subtype} (${a.estimatedAssetCount})`)
              .join("\n")
            Dialog.alert({
              message: `Found ${albums.length} smart album(s):\n${titles}`
            })
          }}
        />
      </Section>
    </List>
  </NavigationStack>
}

async function run() {
  await Navigation.present({
    element: <Example />
  })

  Script.exit()
}

run()