import { Button, Group, HStack, Image, ProgressView, RoundedRectangle, Text, VStack } from 'scripting'
import { Subscription } from '../types'

export default function SubscriptionView({
  data,
  loading,
  onUpdate,
  onRemove
}: {
  data: Subscription
  loading?: boolean
  onUpdate: () => void
  onRemove: () => void
}) {
  return (
    <HStack
      contextMenu={{
        menuItems: <Group>
          <Button
            systemImage='arrow.trianglehead.clockwise.rotate.90'
            title='Update'
            action={onUpdate}
          />
          <Button
            systemImage='trash'
            title='Delete'
            role='destructive'
            foregroundStyle='systemRed'
            action={onRemove}
          />
        </Group>
      }}
      trailingSwipeActions={{
        actions: [
          <Button
            title='Delete'
            role='destructive'
            action={onRemove}
          />,
          <Button
            title='Update'
            action={onUpdate}
          />
        ]
      }}
    >
      <Image
        frame={{ width: 40, height: 40 }}
        systemName={data.icon}
        foregroundStyle='white'
        font={20}
        background={
          <RoundedRectangle fill={data.color} cornerRadius={8} />
        }
      />
      <VStack alignment='leading'>
        <HStack>
          <Text>{data.name}</Text>
          <Text font='callout' foregroundStyle='secondaryLabel'>v{data.version}</Text>
        </HStack>
        <Text font='footnote' foregroundStyle='secondaryLabel'>{data.repo}</Text>
      </VStack>
      { loading ? <ProgressView /> : null }
    </HStack>
  )
}
