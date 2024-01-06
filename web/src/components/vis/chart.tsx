'use client';

import { prometheus } from "@/api/prometheus"
import toFixedNumberString from '@/util/to_fixed_number_string'
import { BreakpointsValue, Card, Grid, Row, Spacer, Text, Col, Loading, useTheme } from "@nextui-org/react"
import { useContext, useEffect, useState } from "react"
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts"
import { TimeContext } from "./time_context"

interface DataPoint {
  time: string,
  value: number,
}

// Chart component
export default function Chart({
  title,
  unit,
  metric,
  aspect,
  extents,
  xs,
  sm,
  md,
  lg,
  xl,
}: {
  title?: string,
  unit?: string,
  metric: string,
  aspect?: number,
  extents?: ("min" | "max" | "avg" | "peak")[]
  xs?: BreakpointsValue,
  sm?: BreakpointsValue,
  md?: BreakpointsValue,
  lg?: BreakpointsValue,
  xl?: BreakpointsValue,
}) {
  const time = useContext(TimeContext)
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true);

  const { theme } = useTheme();

  // This is required (along with setting the domain manually) because of a bug
  // in recharts where it doesn't handle values above 1000 properly.
  const maxYValue = (dataPoints ? Math.max(...dataPoints.map((item) =>
    // handle float and undefined values
    item["value"] ? item["value"] : 0
  )) : 100);
  const maxValue = toFixedNumberString(maxYValue, 3)

  const minYValue = (dataPoints ? Math.min(...dataPoints.map((item) =>
    // handle float and undefined values
    item["value"] ? item["value"] : 0
  )) : 100);
  const minValue = toFixedNumberString(minYValue, 3)

  const averageYValue = (dataPoints ? dataPoints.reduce((sum, item) => {
    // handle float and undefined values
    const value = Math.round(item["value"] ? item["value"] : 0)
    return sum + value;
  }, 0) / dataPoints.length : 100);
  const averageValue = toFixedNumberString(averageYValue, 3)

  const lastValue = toFixedNumberString((dataPoints ? dataPoints[dataPoints.length - 1]?.value : 0), 3)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      try {
        const t_delta = time.end - time.start
        const days = Math.ceil(t_delta / 60 / 60 / 24)
        const step = days * 60

        const response = await prometheus.queryRange(metric, time.start, time.end, step)
        const data = response?.data?.result[0]?.values ?? []

        setDataPoints(data.map(([timestamp, value]: [number, string]) => ({
          time: new Date(timestamp * 1000).toISOString(),
          value: Math.max(parseFloat(value), 0),
        })))
      } catch (e) {
        console.error(e)
      }

      setLoading(false)
    }

    load()
  }, [time, metric])

  return (
    <Grid xs={xs} sm={sm} md={md} lg={lg} xl={xl}>
      <Card variant="bordered" css={{ height: "16em" }}>
        <Card.Header css={{ position: "absolute", zIndex: 1, width: "auto" }}>
          <Col>
            <Row align="center">
              <Text color="$secondaryText" size="medium" b>{title}</Text>
              <Spacer x={0.5} />
              {loading && <Loading color="currentColor" size="xs" />}
            </Row>
            {dataPoints.length == 0 ?
              !loading && <Text color="$secondaryText">No data available</Text>
              :
              <>
                <Row>
                  <Text size="xx-large" b>{lastValue.value} {lastValue.prefix}{unit}</Text>
                </Row>
                {extents?.includes("peak") && <Row align="flex-end">
                  <Text color="$secondaryText" b>{maxValue.value} {maxValue.prefix}{unit} Peak</Text>
                </Row>}
                {extents?.includes("max") && <Row align="flex-end">
                  <Text color="$secondaryText" b>{maxValue.value} {maxValue.prefix}{unit} Max</Text>
                </Row>}
                {extents?.includes("min") && < Row align="flex-end">
                  <Text color="$secondaryText" b>{minValue.value} {minValue.prefix}{unit} Min</Text>
                </Row>}
                {extents?.includes("avg") && <Row align="flex-end">
                  <Text color="$secondaryText" b>{averageValue.value} {averageValue.prefix}{unit} Avg</Text>
                </Row>}
              </>
            }
          </Col>
        </Card.Header>
        <Card.Body css={{ p: 0, m: 0, overflow: "hidden", bottom: 0, position: "absolute" }}>
          <ResponsiveContainer width="100%" aspect={aspect || (6 / 1)}>
            <AreaChart data={dataPoints} margin={{ top: 0, left: 0, right: 0, bottom: 0 }}>
              <Area unit={unit}
                strokeWidth={2}
                type="basis"
                dataKey="value"
                stroke={theme?.colors.primary.value}
                fillOpacity={1}
                fill={theme?.colors.primaryLight.value}
                animationDuration={300} />
              <Tooltip wrapperStyle={{ zIndex: 1 }} content={<CustomTooltip />} />
            </AreaChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>
    </Grid>
  )
}

// Custom tooltip component
const CustomTooltip = ({ payload, active }: {
  payload?: Array<any>,
  label?: any,
  active?: any,
}) => {
  if (active && payload) {
    const value = toFixedNumberString(payload[0]?.value, 3)
    const time = payload[0]?.payload.time

    return (
      <Card
        variant="bordered"
        css={{ px: "0.5em" }}
      >
        <Card.Body css={{ p: "0.5em" }}>
          <Text b>{value.value} {value.prefix}{payload[0]?.unit}</Text>
          <Spacer y={0.1} />
          <Text size="small">{new Date(time).toLocaleTimeString()} {new Date(time).toLocaleDateString()}</Text>
        </Card.Body>
      </Card>
    )
  }

  return null
}
