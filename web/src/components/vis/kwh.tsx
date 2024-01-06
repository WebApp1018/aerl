import { prometheus } from "@/api/prometheus"
import toFixedNumberString from "@/util/to_fixed_number_string";
import { BreakpointsValue, Card, Grid, Loading, Row, Spacer, Text } from "@nextui-org/react"
import { useContext, useEffect, useState } from "react"
import wattHours from "@/util/calculate_watt_hours";
import { TimeContext } from "./time_context";

export default function KWH({ measurement, labelQuery, unit, xs, sm, md, lg, xl }: {
  measurement: string,
  labelQuery?: string,
  unit?: string,
  xs?: BreakpointsValue,
  sm?: BreakpointsValue,
  md?: BreakpointsValue,
  lg?: BreakpointsValue,
  xl?: BreakpointsValue,
}) {
  const time = useContext(TimeContext);
  const [value, setValue] = useState<number>(0);
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(true)
  const data = toFixedNumberString(value, 3);
  const step = Math.max(120, Math.floor((time.end - time.start) / 6000));

  const wattQuery = `sum(aerl_srx_pv_voltage{${labelQuery}} * aerl_srx_pv_current)`;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Request data from Prometheus
        const wattResponse = await prometheus.queryRange(wattQuery, time.start, time.end, step);

        if (wattResponse?.data?.result.length == 0) {
          setFailed(true);
          setLoading(false);
          return;
        }


        const wh = wattHours(wattResponse.data.result[0].values, step);
        setValue(wh);
        setFailed(false);
        setLoading(false);

      } catch (error) {
        setLoading(false);
        setFailed(true);
        console.error(error)
      }
    }

    fetchData()
  }, [time, labelQuery, step, wattQuery])

  return (
    <Grid xs={xs} sm={sm} md={md} lg={lg} xl={xl}>
      <Card variant="bordered" css={{ px: "0.5em" }}>
        <Card.Body css={{ px: "1em" }}>
          <Text size="large" b color="$secondaryText">{measurement}</Text>
          <Row align="center">
            {failed ? <Text size="xx-large" b>-- <Text size="x-large" b color="$secondaryText">{data.prefix}{unit}</Text></Text>
              : <Text size="xx-large" b>{data.value} <Text size="x-large" b color="$secondaryText">{data.prefix}{unit}</Text></Text>}
            {loading && <><Spacer y={1} /><Loading color="white" size="sm" /></>}
          </Row>
        </Card.Body>
      </Card>
    </Grid>
  )
}
