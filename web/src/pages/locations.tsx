import Layout, { LayoutProps } from "@/components/layouts/main";
import {
  Card,
  Container,
  Input,
  Loading,
  Row,
  Spacer,
  Text,
  useInput,
} from "@nextui-org/react";
import { prometheus } from "@/api/prometheus";
import { Search } from "react-feather";
import { useEffect, useState } from "react";
import serialToModel from "@/util/serial_to_model";
import CopyButton from "@/components/copy_button";
import prettyPrintError from "@/util/pretty_print_error";
import { useRouter } from "next/router";
import OnlineBadge from "@/components/online_badge";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import JSXTable, { JSXTableColumnProps } from "@/components/JSXTable";

interface Device {
  model: string;
  serial_no: string;
  location: string;
  last_seen?: number;
  status?: [number, string][];
}

interface Hub {
  devices: Device[];
  hub_id: string;
  name: string | null;
  last_seen: string | null;
}

export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default function Locations(props: LayoutProps) {
  const supabase = useSupabaseClient();
  const search = useInput("");
  const [hubs, setHubs] = useState<Hub[]>();
  const [loading, setLoading] = useState<boolean>(true);

  const searchDevices = (hub: Hub) => {
    // Empty query returns all devices
    if (search.value === "") {
      return true;
    }

    // Search for either location name or serial number
    return (
      hub.name?.toLowerCase().includes(search.value.toLowerCase()) ||
      hub.devices.some((d) =>
        d.serial_no.toLowerCase().includes(search.value.toLowerCase()),
      )
    );
  };

  // Load the hubs in
  useEffect(() => {
    // Load all hubs in org
    const loadHubs = async () => {
      // Query hubs from supabase
      const { data } = await supabase
        .from("device")
        .select("hub_id, name, last_seen")
        .order("name");

      return data as Hub[];
    };

    let isCancelled = false; // Prevent memeory leak
    const load = async () => {
      setLoading(true);

      // Process:
      // 0. Load the hubs in (Supabase Query)
      // 1. Load the online devices for each hub (quick query)
      // 2. Load in the offline devices for each hub (slow query)

      // 0. Load the hubs in (Supabase Query)
      const hubs: Hub[] = await loadHubs();

      // Before proceeding, check if the component is unmounted (prevent memory leak)
      if (isCancelled) return;

      // Load all devices
      if (hubs.length <= 0) {
        setHubs([]);
        setLoading(false);
        return;
      }

      // Start should be 30 days ago
      const now = new Date();
      const startTime = now.getTime() / 1000 - 30 * 24 * 60 * 60;
      const endTime = now.getTime() / 1000;
      const timeStep = Math.max(1, Math.floor((endTime - startTime) / 10000));

      // Query last known device timestamp
      const result = await prometheus.queryRange(
        `max by (serial_number, hub) (timestamp(aerl_srx_information_serial_number{hub=~"${hubs
          .map((h) => h.hub_id)
          .join("|")}"}))`,
        startTime,
        endTime,
        timeStep,
      );

      // Map to device objects
      const devices: Device[] = result.data?.result.map((r: any) => {
        return {
          serial_no: r.metric.serial_number,
          model: serialToModel(r.metric.serial_number),
          location: r.metric.hub,
          last_seen: parseInt(r.values.slice(-1)[0][1]) * 1000, // Convert to millisecond epoch timestamp for js
        };
      });

      const hubsWithDevices = hubs.map((h) => {
        return {
          ...h,
          devices: devices?.filter((d) => d.location === h.hub_id),
        };
      });

      if (isCancelled) return;
      setHubs(hubsWithDevices);
      setLoading(false);
    };
    load();

    return () => {
      isCancelled = true;
    };
  }, [supabase]);

  return (
    <Layout {...props} titleSuffix="Devices">
      <Container gap={0.5}>
        <Row justify="flex-end">
          <Input
            contentRight={<Search />}
            bordered
            borderWeight="light"
            placeholder="Search"
            aria-label="search"
            {...search.bindings}
          />
        </Row>
        <Spacer y={1} />
        {!loading ? !hubs?.length ?
          <Card variant="bordered">
            <Card.Body css={{ px: "1.5em" }}>
              <Text>No devices found.</Text>
            </Card.Body>
          </Card>
          : hubs?.map((location) =>
            searchDevices(location) && (
              <>
                <LocationCard
                  key={location.name}
                  location={location}
                  loading={loading}
                />
                <Spacer y={2} />
              </>
            ))
          : <>
            <Spacer y={10} />
            <Row justify="center">
              <Loading color="currentColor" />
            </Row>
          </>}
      </Container>
    </Layout>
  );
}

const LocationCard = (props: { location: Hub; loading: boolean }) => {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>(props.location.devices);

  useEffect(() => {
    var isCancelled = false;

    const loadStatus = async () => {
      const start = new Date().getTime() / 1000 - 60 * 60 * 24 * 7;
      const end = new Date().getTime() / 1000;
      const step = Math.max(1, Math.floor((end - start) / 5000));

      if (isCancelled) return;
      const result = await prometheus.queryRange(
        `sum by (__name__, serial_number) ({__name__=~"aerl_srx_flag_.*", hub="${props.location.hub_id}"})`,
        start,
        end,
        step,
      );

      if (isCancelled) return;

      // Prometheus failed
      if (result.status != "success") {
        console.error("Error loading status");
        throw new Error("Error loading status");
      }

      // Mark devices as ok
      var deviceStatuses: Device[] = props.location.devices.map((d: Device) => {
        return {
          ...d,
          status: Array<[number, string]>(),
        };
      });

      // Set the most recently changed error flag for each device
      // This should hopefully redone.
      for (let i = 0; i < result.data.result.length; i++) {
        for (let j = 0; j < deviceStatuses.length; j++) {
          // Get a metric value
          const r = result.data.result[i];
          // Get the last state of that error value
          const latestErrorValue = r.values[r.values.length - 1];

          // If this status corresponds to this device AND the flag is high
          if (
            deviceStatuses[j].serial_no == r.metric.serial_number &&
            latestErrorValue[1] == 1
          ) {
            // Now, we have to see which flag most recently went high - that is the one we must display
            for (var k = 1; k < r.values.length; k++) {
              if (r.values[r.values.length - k][1] == "0") break;
            }
            deviceStatuses[j].status?.push([
              k,
              prettyPrintError(r.metric.__name__) ?? "Unknown Fault",
            ]);
          }
        }
      }

      // Sort the status by the most recent error
      deviceStatuses = deviceStatuses.map((d) => {
        return {
          ...d,
          status: d.status?.sort((a, b) => a[0] - b[0]),
        };
      });

      if (isCancelled) return;
      setDevices(deviceStatuses);
    };

    loadStatus().catch((e) => {
      // Currently we can just ignore the errors.
      console.error(e);
    });

    return () => {
      isCancelled = true;
    };
  }, [props.location]);

  const TableHeader: Array<JSXTableColumnProps> = [{
    label: "MODEL",
    value: "model",
  }, {
    label: "SERIAL #",
    value: "serial_no",
    css: { padding: '0', width: "10%" },
    component(serial_no) {
      return (<CopyButton text={serial_no} icon={false} />)
    }
  }, {
    label: "FW VERSION",
    value: "fw_version",
    css: { padding: '0', width: "15%" },
  }, {
    label: "LAST STATUS",
    value: "status",
    css: { padding: '0', width: "25%" },
    component(status) {
      return (<Text>{status?.at(0)?.at(1) ?? "OK"}</Text>);
    }
  }, {
    css: { width: "25%" },
    label: "CONNECTED",
    value: "last_seen",
    component(last_seen) {
      return (
        <Row align="center">
          <OnlineBadge timestamp={last_seen ?? null} />
        </Row>
      )
    }
  }]

  return (
    <>
      <Row align="center" css={{ paddingLeft: "$8" }}>
        <div style={{ marginBottom: "var(--nextui-space-5)" }}>
          <OnlineBadge timestamp={props.location.last_seen} hideText />
        </div>
        <Spacer x={0.3} />
        <Text h4>{props.location.name}</Text>
        <Spacer x={0.5} />
        <div style={{ marginBottom: "var(--nextui-space-5)" }}>
          {props.loading && <Loading color="currentColor" size="sm" />}
        </div>
      </Row>
      <JSXTable
        columns={TableHeader}
        data={devices.map((item: any) => ({ ...item, fw_version: "1.9.2" }))}
        pagination={{ perPage: 5 }}
      />
    </>
  );
};
