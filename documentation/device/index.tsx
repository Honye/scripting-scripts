import { Device, List, Text, VStack } from "scripting"

export function DeviceExample() {
  const details: {
    name: string
    value: string | boolean | number
  }[] = [
      {
        name: "Device.isiPhone",
        value: Device.isiPhone
      },
      {
        name: "Device.isiPad",
        value: Device.isiPad,
      },
      {
        name: "Device.systemVersion",
        value: Device.systemVersion,
      },
      {
        name: "Device.systemName",
        value: Device.systemName,
      },
      {
        name: "Device.isPortrait",
        value: Device.isPortrait,
      },
      {
        name: "Device.isLandscape",
        value: Device.isLandscape,
      },
      {
        name: "Device.isFlat",
        value: Device.isFlat,
      },
      {
        name: "Device.batteryLevel",
        value: Device.batteryLevel,
      },
      {
        name: "Device.batteryState",
        value: Device.batteryState,
      }
    ]

  return <List
    navigationTitle={"Device"}
  >
    {details.map(item =>
      <VStack
        badge={item.value.toString()}
        alignment={"leading"}
      >
        <Text font={"headline"}>{item.name}</Text>
        <Text font={"caption"}>{typeof item.value}</Text>
      </VStack>
    )}
  </List>
}