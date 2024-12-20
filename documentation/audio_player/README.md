The `AVPlayer` allows for playback of both local and network audio sources, and offers controls such as play, pause, stop, volume, and more. Below is a sample usage along with detailed explanations of each part of the code.

## Usage Example

Here's an example of how to use the `AVPlayer` class:

```typescript
// Create a new AVPlayer instance
let player = new AVPlayer()

// Set an audio source (can be a local file path or a network URL)
player.setSource('https://example.com/audio.mp3')

// Assign event handlers
player.onReadyToPlay = () => {
  console.log("Player is ready to play")
  setTimeout(() => {
    console.log("Audio Duration:", player.duration, "seconds")
    player.play()
  }, 100) // Small delay to ensure duration has time to load
}

player.onEnded = () => {
  console.log("Playback finished")
}

player.onError = (message) => {
  console.log("Playback error:", message)
}

// Set playback rate
player.rate = 1.5 // Play at 1.5x speed

// Set number of loops
player.numberOfLoops = 2 // Loop twice

// Dispose the player when done
setTimeout(() => {
  player.dispose()
  console.log("Disposed the player")
}, 30000)
```

## Detailed Explanation

### 1. **Creating an AVPlayer Instance**

```typescript
let player = new AVPlayer()
```

First, create a new instance of the `AVPlayer` class. This instance will manage audio playback and offer various controls and event handlers.

### 2. **Setting the Audio Source**

```typescript
player.setSource('https://example.com/audio.mp3')
```

The `setSource` method accepts either a local file path or a network URL. This sets the audio to be played by the player.

- **Parameter**: `filePathOrURL` - A string that represents either a local file path or a network URL.
- **Return Value**: `true` if the audio source is set successfully, otherwise `false`.

### 3. **Assigning Event Handlers**

- **onReadyToPlay**
  ```typescript
  player.onReadyToPlay = () => {
    console.log("Player is ready to play")
    setTimeout(() => {
      console.log("Audio Duration:", player.duration, "seconds")
      player.play()
    }, 100)
  }
  ```
  This handler is triggered when the audio is ready to play. In this example, we log a message to the console and then call `player.play()` after a short delay to ensure the duration has been loaded.

- **onEnded**
  ```typescript
  player.onEnded = () => {
    console.log("Playback finished")
  }
  ```
  This handler is called when the playback of the audio has finished. You can use it to perform any cleanup actions or trigger other functionality.

- **onError**
  ```typescript
  player.onError = (message) => {
      console.log("Playback error:", message)
  }
  ```
  This handler is called if there is an error during playback. The `message` parameter provides details about the error.

### 4. **Setting Playback Rate**

```typescript
player.rate = 1.5
```
The `rate` property controls the playback speed of the audio. The value `1.0` represents normal speed, values greater than `1.0` speed up playback, and values less than `1.0` slow it down. In this example, the rate is set to `1.5`, which means the audio will play at 1.5 times the normal speed.

### 5. **Looping Audio**

```typescript
player.numberOfLoops = 2
```
The `numberOfLoops` property specifies how many times the audio should loop. Setting it to `0` means no looping, while a positive value indicates the number of loops. In this example, the audio will loop twice. You can also set this property to `-1` for infinite looping.

### 6. **Disposing the Player**

```typescript
setTimeout(() => {
  player.dispose()
  console.log("Disposed the player")
}, 30000)
```
The `dispose` method releases all resources associated with the player. It is important to call this method when the player is no longer needed to prevent memory leaks. In the example, the player is disposed after 30 seconds.

## Notes
- Ensure that the audio source is valid before attempting to play.
- Use event handlers like `onReadyToPlay`, `onEnded`, and `onError` to manage the playback lifecycle effectively.
- Always call `dispose()` when the player is no longer needed to release resources.
