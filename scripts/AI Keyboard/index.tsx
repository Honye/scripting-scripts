import { Navigation, NavigationStack, VStack } from 'scripting'
import { AIKeyboardView } from './components/AIKeyboardView'
import { getAdaptiveLayoutParams } from './utils/adaptive'

function App() {
  const adaptiveParams = getAdaptiveLayoutParams()

  return (
    <NavigationStack>
      <VStack
        frame={{ height: adaptiveParams.totalHeight }}
        background={{ light: '#d1d3d8', dark: '#343232' }}
      >
        <AIKeyboardView />
      </VStack>
    </NavigationStack>
  )
}

Navigation.present({
  element: <App />,
})
