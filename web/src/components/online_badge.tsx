import { Row, Spacer, Text } from '@nextui-org/react';
import { Circle } from '@/components/icons';

export default function OnlineBadge({
  timestamp,
  hideText
}: {
  timestamp: string | number | Date | null,
  hideText?: boolean
}) {
  if (!timestamp) {
    if (!hideText) {
      return <Text>Never</Text>;
    } else {
      return <Circle size={8} color="var(--nextui-colors-neutralLightContrast)" />
    }
  }

  const date = new Date(timestamp);
  const now = new Date();

  const diff = (now.getTime() - date.getTime()) / 1000;

  if (diff <= (60 * 5)) {
    return (
      <Row align='center'>
        <Circle size={8} color="var(--nextui-colors-successLightContrast)" />
        {!hideText && <>
          <Spacer x={0.3} />
          Connected
        </>}
      </Row>
    )
  }

  const isToday = date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const formatted = date.toLocaleString([], {
    month: isToday ? undefined : 'short',
    day: isToday ? undefined : 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZoneName: 'short'
  })

  return (
    <Row align='center'>
      <Circle size={8} color="var(--nextui-colors-neutralLightContrast)" />
      {!hideText && <>
        <Spacer x={0.3} />
        Last seen {formatted}
      </>}
    </Row>
  )
}
