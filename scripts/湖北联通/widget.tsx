import {
  Circle,
  HStack,
  Image,
  Spacer,
  Text,
  VStack,
  Widget,
  ZStack,
  Color,
  EnvironmentValuesReader,
  modifiers,
  Path,
  Script,
  fetch
} from 'scripting'
import { rpt } from './utils'

interface ProgressGaugeProps {
  title: string
  value: string | number
  icon: string
  color: { r: number; g: number; b: number }
  progress: number
}

function ProgressGauge({
  title,
  value,
  icon,
  color,
  progress
}: ProgressGaugeProps) {
  const trimTo = 0.15 + 0.7 * Math.max(0, Math.min(1, progress))
  const iconColor: Color = `rgba(${color.r},${color.g},${color.b},1)`
  const colorStart: Color = `rgba(${color.r},${color.g},${color.b},0.4)`
  const colorEnd = iconColor
  const bgColor: Color = `rgba(${color.r},${color.g},${color.b},0.1)`
  const bgStart: Color = `rgba(${color.r},${color.g},${color.b},0.2)`
  return (
    <EnvironmentValuesReader keys={['widgetRenderingMode']}>
      {({ widgetRenderingMode }) => (
        <ZStack>
          <Circle
            frame={{ width: rpt(58), height: rpt(58) }}
            trim={{ from: 0.15, to: 0.85 }}
            rotationEffect={90}
            stroke={{
              shapeStyle: bgColor,
              strokeStyle: { lineWidth: rpt(4), lineCap: 'round' }
            }}
          />
          <Circle
            trim={{ from: 0.15, to: trimTo }}
            rotationEffect={90}
            stroke={{
              shapeStyle: {
                colors: [colorStart, colorEnd],
                startPoint: 'leading',
                endPoint: 'trailing'
              },
              strokeStyle: { lineWidth: rpt(4), lineCap: 'round' }
            }}
          />
          <VStack
            frame={{ width: rpt(50), height: rpt(50) }}
            spacing={0}
            background={{
              shape: 'circle',
              style: {
                colors: [bgStart, 'clear'],
                startPoint: 'top',
                endPoint: 'bottom'
              }
            }}
          >
            <Spacer />
            <Text
              font={rpt(8)}
              foregroundStyle="secondaryLabel"
              fontWeight="medium"
            >
              {title}
            </Text>
            <Text
              font={rpt(12)}
              fontDesign="rounded"
              fontWeight="bold"
              foregroundStyle="label"
              lineLimit={1}
              minScaleFactor={0.5}
            >
              {value}
            </Text>
            <Image
              systemName={icon}
              padding={rpt(2)}
              background={{
                shape: 'circle',
                style:
                  widgetRenderingMode === 'accented'
                    ? 'rgba(0,0,0,0.5)'
                    : iconColor
              }}
              foregroundStyle="white"
              font={rpt(12)}
            />
          </VStack>
        </ZStack>
      )}
    </EnvironmentValuesReader>
  )
}

function WidgetView({
  data
}: {
  data: {
    balenceData: { amount: string }
    flowData: { left: number; total: number }
    voiceData: { left: number; total: number }
  }
}) {
  const { balenceData, flowData, voiceData } = data

  return (
    <VStack
      padding={rpt(14)}
      frame={Widget.displaySize}
      modifiers={modifiers()
        .background(
          <Image
            offset={{
              x: rpt(50),
              y: rpt(50) - Widget.displaySize.height / 2 - rpt(22)
            }}
            resizable
            scaleToFit
            frame={{ width: rpt(100), height: rpt(100) }}
            imageUrl="https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts@master/static/unicom_bg.png"
            widgetAccentedRenderingMode="fullColor"
          />
        )
        .widgetBackground('systemBackground')}
    >
      <HStack alignment="top">
        <VStack alignment="leading">
          <Text
            foregroundStyle="secondaryLabel"
            fontWeight="medium"
            font={rpt(12)}
          >
            剩余话费
          </Text>
          <Text
            font={rpt(24)}
            fontDesign="rounded"
            fontWeight="bold"
            foregroundStyle="label"
            lineLimit={1}
            minScaleFactor={0.5}
          >
            {balenceData.amount || '0.00'}
          </Text>
        </VStack>
        <Spacer />
        <Image
          resizable
          scaleToFit
          frame={{ width: rpt(24), height: rpt(24) }}
          imageUrl="https://cdn.jsdelivr.net/gh/Honye/scriptable-scripts@master/static/unicom.png"
          widgetAccentedRenderingMode="fullColor"
        />
      </HStack>
      <HStack spacing={rpt(15)}>
        <ProgressGauge
          title="剩余流量"
          value={(flowData.left / 1024).toFixed(2)}
          icon="antenna.radiowaves.left.and.right"
          color={{ r: 59, g: 201, b: 236 }}
          progress={flowData.total ? flowData.left / flowData.total : 0}
        />
        <ProgressGauge
          title="剩余语音"
          value={voiceData.left}
          icon="phone"
          color={{ r: 162, g: 207, b: 57 }}
          progress={voiceData.total ? voiceData.left / voiceData.total : 0}
        />
      </HStack>
    </VStack>
  )
}

;(async () => {
  const root = Path.join(FileManager.appGroupDocumentsDirectory, Script.name)
  const prefPath = Path.join(root, 'preference.json')
  let preference = { packages: [] as string[], authorization: '' }

  if (FileManager.existsSync(prefPath)) {
    try {
      preference = JSON.parse(FileManager.readAsStringSync(prefPath) || '{}')
    } catch (e) {
      console.error('Failed to parse preference', e)
    }
  }

  const hbHeaders = {
    zx: '12',
    Authorization: preference.authorization || '',
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.31(0x18001f2e) NetType/4G Language/en',
    Accept: '*/*'
  }

  let balenceData = { amount: '0' }
  let addupInfoList: any[] = []

  try {
    const balenceRes = await fetch(
      'https://wap.10010hb.net/zinfo/front/user/findFeePackage',
      {
        method: 'POST',
        headers: hbHeaders
      }
    ).then((r) => r.json())
    if (balenceRes.success) {
      balenceData = balenceRes.data
    }

    const packageRes = await fetch(
      'https://wap.10010hb.net/zinfo/front/user/findLeftPackage',
      {
        method: 'POST',
        headers: hbHeaders
      }
    ).then((r) => r.json())
    if (packageRes.success) {
      addupInfoList = packageRes.data.addupInfoList || []
    }
  } catch (e) {
    console.error('API Error', e)
  }

  const flowData = { left: 0, total: 0 }
  const voiceData = { left: 0, total: 0 }

  const list = addupInfoList.filter((item) =>
    (preference.packages || []).includes(item.FEE_POLICY_ID)
  )

  for (const item of list) {
    // 语音
    if (item.ELEM_TYPE === '1') {
      voiceData.left += Number(item.X_CANUSE_VALUE)
      voiceData.total += Number(item.ADDUP_UPPER)
    }
    // 流量
    if (item.ELEM_TYPE === '3') {
      flowData.left += Number(item.X_CANUSE_VALUE)
      flowData.total += Number(item.ADDUP_UPPER)
    }
  }

  const data = {
    balenceData,
    flowData,
    voiceData
  }

  Widget.present(<WidgetView data={data} />)
})()
