export async function saveImageForWidget(image: UIImage, filePath: string) {
  const { screen } = Device
  const size = {
    width: Math.min(screen.width, image.width),
    height: Math.min(screen.height, image.height)
  }
  const thumbnail = image.preparingThumbnail(size)
  if (thumbnail) {
    const data = Data.fromPNG(thumbnail)
    if (data) {
      await FileManager.writeAsData(filePath, data)
    }
  }
}
