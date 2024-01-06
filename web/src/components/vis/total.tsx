import { prometheus } from "@/api/prometheus";
import toFixedNumberString from "@/util/to_fixed_number_string";
import {
  BreakpointsValue,
  Card,
  Grid,
  Loading,
  Row,
  Spacer,
  Text,
} from "@nextui-org/react";
import { useContext, useEffect, useState } from "react";
import { TimeContext } from "./time_context";

export default function Total({
  measurement,
  query,
  unit,
  xs,
  sm,
  md,
  lg,
  xl,
}: {
  measurement: string;
  query?: string;
  unit?: string;
  xs?: BreakpointsValue;
  sm?: BreakpointsValue;
  md?: BreakpointsValue;
  lg?: BreakpointsValue;
  xl?: BreakpointsValue;
}) {
  const time = useContext(TimeContext);
  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(true);

  const data = toFixedNumberString(value, 3);

  useEffect(() => {
    var cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await prometheus.query(query ?? "", time.end);
        if (cancelled) return;
        if (response?.data?.result.length == 0) {
          setValue(0);
          setFailed(true);
        } else {
          const result = Math.round(response?.data?.result[0].value[1]);
          setValue(result);
          setFailed(false);
        }
      } catch (error) {
        console.error(error);
        setFailed(true);
      }
      setLoading(false);
    };

    if (query) {
      setFailed(false);
      fetchData();
    } else {
      setFailed(true);
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [time, query]);

  return (
    <Grid xs={xs} sm={sm} md={md} lg={lg} xl={xl} css={{}}>
      <Card variant="bordered" css={{ px: "0.5em" }}>
        <Card.Body css={{ px: "1em", py: "0.5" }}>
          <Text size="large" b color="$secondaryText">
            {measurement}
          </Text>
          <Row align="center">
            {failed ? (
              <Text size="xx-large" b>
                --{" "}
                <Text size="x-large" b color="$secondaryText">
                  {data.prefix}
                  {unit}
                </Text>
              </Text>
            ) : (
              <Text size="xx-large" b>
                {data.value}{" "}
                <Text size="x-large" b color="$secondaryText">
                  {data.prefix}
                  {unit}
                </Text>
              </Text>
            )}
            {loading && (
              <>
                <Spacer y={1} />
                <Loading color="white" size="sm" />
              </>
            )}
          </Row>
        </Card.Body>
      </Card>
    </Grid>
  );
}
