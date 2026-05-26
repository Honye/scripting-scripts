The `HeadphoneMotionManager` namespace streams motion data from headphones that support spatial audio with dynamic head tracking, such as **AirPods Pro**, **AirPods Max**, and **AirPods 3**.

It wraps Apple's `CMHeadphoneMotionManager` and exposes attitude, rotation rate, user acceleration, gravity, and connection events to your scripts.

---

## Properties

| Name | Type | Description |
| ---- | ---- | ----------- |
| `isAvailable` | `boolean` | Whether headphone motion data is currently available. Returns `false` on simulators or when no compatible headphones are reachable. |
| `isActive` | `boolean` | Whether motion updates are currently being delivered. |

> Authorization is handled internally — your script does not need to query or request permission. The first call to `startDeviceMotionUpdates` triggers the system prompt automatically; if the user later denies access, subsequent calls reject with a clear error.

---

## Methods

### `startDeviceMotionUpdates(options): Promise<boolean>`

Begin streaming motion samples. Resolves with `true` once the stream is started.

```ts
startDeviceMotionUpdates(options: {
  onUpdate: (motion: HeadphoneDeviceMotion) => void
  onError?: (error: Error) => void
}): Promise<boolean>
```

| Option | Type | Required | Description |
| ------ | ---- | -------- | ----------- |
| onUpdate | `(motion: HeadphoneDeviceMotion) => void` | Yes | Called for every motion sample. |
| onError  | `(error: Error) => void` | No | Called if CoreMotion reports an error during streaming. |

Only one active subscription is supported at a time. Calling `startDeviceMotionUpdates` again replaces the previous handler.

### `stopDeviceMotionUpdates(): void`

Stop the current motion stream. Safe to call when no stream is active.

### `addListener(event, listener): void`

Subscribe to a connection event.

```ts
addListener(event: 'connect' | 'disconnect', listener: () => void): void
```

* `connect` fires when supported headphones become reachable.
* `disconnect` fires when they go away.

### `removeListener(event, listener): void`

Remove a previously registered listener. Pass the same function reference that was used with `addListener`.

---

## Data Types

```ts
type HeadphoneDeviceMotion = {
  timestamp: number          // seconds since device boot, monotonic
  attitude: {
    pitch: number            // radians
    roll: number             // radians
    yaw: number              // radians
    quaternion: { x: number; y: number; z: number; w: number }
  }
  rotationRate: { x: number; y: number; z: number }       // rad/s
  userAcceleration: { x: number; y: number; z: number }   // G
  gravity: { x: number; y: number; z: number }            // G
  sensorLocation: 'default' | 'leftHeadphone' | 'rightHeadphone'
  heading?: number                                        // degrees [0, 360)
  magneticField?: {
    field: { x: number; y: number; z: number }
    accuracy: 'uncalibrated' | 'low' | 'medium' | 'high'
  }
}
```

---

## Example

```ts
if (!HeadphoneMotionManager.isAvailable) {
  console.log("Headphone motion is not available on this device.")
} else {
  HeadphoneMotionManager.addListener('connect', () => {
    console.log("Headphones connected.")
  })
  HeadphoneMotionManager.addListener('disconnect', () => {
    console.log("Headphones disconnected.")
  })

  await HeadphoneMotionManager.startDeviceMotionUpdates({
    onUpdate: motion => {
      const yawDeg = motion.attitude.yaw * (180 / Math.PI)
      console.log(`yaw: ${yawDeg.toFixed(1)}°`)
    },
    onError: err => {
      console.error("motion error:", err.message)
    }
  })

  // Stop when finished:
  // HeadphoneMotionManager.stopDeviceMotionUpdates()
}
```

---

## Notes

* `Info.plist` must include `NSMotionUsageDescription`. Scripting already declares it.
* The first call to `startDeviceMotionUpdates` automatically triggers the system Motion & Fitness permission prompt. If the user denies it (now or later from Settings), `startDeviceMotionUpdates` rejects with a clear error so your script can surface a helpful message.
