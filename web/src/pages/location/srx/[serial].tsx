import { createContext, useEffect, useState } from "react";
import getTimeOptions, { timeOptions } from "@/util/time_options";
import { useRouter } from "next/router";
import Chart from "@/components/vis/chart";
import Layout, { LayoutProps } from "@/components/layouts/main";
import {
  Grid,
  Spacer,
  Text,
  Row,
  Col,
  Link,
  Container,
  Dropdown,
  Button,
} from "@nextui-org/react";
import { ArrowLeft, Clock } from "react-feather";
import TimeContextProvider from "@/components/vis/time_context";
import { prometheus } from "@/api/prometheus";
import { Circle } from "@/components/icons";

export const TimeContext = createContext({
  start: getTimeOptions("today").start,
  end: getTimeOptions("today").end,
});

export default function Home(props: LayoutProps) {
  const [time, setTime] = useState(getTimeOptions("today"));
  const router = useRouter();
  const serial = router.query.serial;
  const labelQuery = `serial_number="${serial}"`;
  const [online, setOnline] = useState(false);

  const properties = [{ name: "Model", value: "CoolMax SRX 600/55-48" }];

  useEffect(() => {
    const update = () => {
      try {
        const uid = localStorage?.getItem("dashboard-time");

        if (uid) {
          const newTime = getTimeOptions(uid);
          if (!newTime) return;

          if (time.end != newTime.end || time.start != newTime.start) {
            setTime(newTime);
          }
        }
      } catch (error) {
        console.log(error);
      }
    };

    const interval = setInterval(update, 30_000);

    update();

    return () => clearInterval(interval);
  }, []);

  // Online status
  useEffect(() => {
    var isCancelled = false;
    const checkOnlineStatus = async () => {
      let result = await prometheus.query(
        `aerl_srx_information_serial_number{serial_number="${serial}"}`,
      );

      if (isCancelled || result.status != "success") return;
      console.log(result.data.result.length);
      if (result.data.result.length > 0) {
        setOnline(true);
      } else {
        setOnline(false);
      }
    };

    checkOnlineStatus();

    return () => {
      isCancelled = true;
    };
  }, [time, serial]);

  return (
    <Layout {...props}>
      <Container gap={0.5}>
        <Row>
          <Link href="/locations">
            <Button
              flat
              auto
              icon={<ArrowLeft color="var(--nextui-colors-primary)" />}
            >
              Return to Locations
            </Button>
          </Link>
        </Row>
      </Container>
      <Spacer y={1.5} />
      <Container gap={0.5}>
        <Row>
          <Col>
            <Row align="center">
              <Text size="xx-large" b>
                CoolMax SRX - {serial}
              </Text>
              <Spacer x={0.5} />
              <Circle
                size={16}
                color={
                  online
                    ? "var(--nextui-colors-successLightContrast)"
                    : "var(--nextui-colors-neutralLightContrast)"
                }
              />
            </Row>
            <Row>
              <Col css={{ display: "none" }}>
                <Text size="large" b>
                  Specifications
                </Text>
                <Container gap={1}>
                  <table>
                    {properties.map((property) => (
                      <tr key={property.name}>
                        <td>
                          <Text b css={{ pr: 10 }}>
                            {property.name}
                          </Text>
                        </td>
                        <td>
                          <Text>{property.value}</Text>
                        </td>
                      </tr>
                    ))}
                  </table>
                </Container>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
      <Spacer y={1} />
      <Row gap={0.5}>
        <Dropdown isBordered>
          <Dropdown.Button flat>
            <Clock />
            <Spacer x={0.3} />
            {time.name}
          </Dropdown.Button>
          <Dropdown.Menu
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={new Set([0])}
            onAction={(key) => {
              const newTime = getTimeOptions(key as string);

              if (newTime) {
                setTime(newTime);
                if (window) localStorage.setItem("dashboard-time", newTime.uid);
              }
            }}
          >
            {timeOptions.map(({ uid, name }) => {
              return <Dropdown.Item key={uid}>{name}</Dropdown.Item>;
            })}
          </Dropdown.Menu>
        </Dropdown>
      </Row>
      <Spacer y={1} />
      <TimeContextProvider
        value={{ start: time.start / 1000, end: time.end / 1000 }}
      >
        <Grid.Container gap={1} justify="center">
          <Chart
            xs={12}
            aspect={8 / 1}
            title="PV Power"
            unit="W"
            extents={["peak", "avg"]}
            metric={`sum(aerl_srx_pv_voltage{${labelQuery}} * aerl_srx_pv_current) < 100000`}
          />
          <Chart
            xs={12}
            sm={6}
            aspect={8 / 1}
            title="PV Voltage"
            unit="V"
            extents={["max", "avg"]}
            metric={`avg(aerl_srx_pv_voltage{${labelQuery}}) < 100000`}
          />
          <Chart
            xs={12}
            sm={6}
            aspect={8 / 1}
            title="Battery Voltage"
            unit="V"
            extents={["max", "min"]}
            metric={`avg(aerl_srx_output_voltage{${labelQuery}}) < 100000`}
          />
          <Chart
            xs={12}
            sm={6}
            title="PV Current"
            unit="A"
            extents={["max", "avg"]}
            metric={`sum(aerl_srx_pv_current{${labelQuery}}) < 100000`}
          />
          <Chart
            xs={12}
            sm={6}
            title="Battery Current"
            unit="A"
            extents={["max", "avg"]}
            metric={`sum(aerl_srx_output_current{${labelQuery}}) < 100000`}
          />
          <Chart
            xs={12}
            aspect={16 / 1}
            title="Heatsink Temperature"
            unit="°C"
            extents={["max", "min"]}
            metric={`avg(aerl_srx_temperature_heatsink{${labelQuery}}) < 1000`}
          />
        </Grid.Container>
      </TimeContextProvider>
    </Layout>
  );
}
