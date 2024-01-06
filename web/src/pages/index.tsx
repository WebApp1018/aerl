import { prometheus } from "@/api/prometheus";
import Layout from "@/components/layouts/main";
import Chart from "@/components/vis/chart";
import FullScreenToggle from "@/components/vis/fullscreen";
import Total from "@/components/vis/total";
import KWH from "@/components/vis/kwh";
import { Tables } from "@/supabase/types";
import serialToModel from "@/util/serial_to_model";
import { Dropdown, Grid, Row, Spacer } from "@nextui-org/react";
import { Key, useCallback, useEffect, useState } from "react";
import { MapPin, Server, Grid as DeviceIcon, Clock } from "react-feather";
import getTimeOptions, { timeOptions } from "@/util/time_options";
import SystemOverview from "@/components/vis/system_overview";
import { ReactFlowProvider } from "reactflow";
import TimeContextProvider from "@/components/vis/time_context";
import { GetServerSidePropsContext } from "next";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { getLocalStorageData, setLocalStorageData } from "../util";

type Device = { hub_id: any; name: any };
type Location = {
  id: number;
  name: string;
  devices: Device[];
  org_id: number | null
};

type storedLocation = {
  locationId: number;
  LocationName: string;
  org_id: number
}
export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabase = createPagesServerClient(ctx);
  try {
    let { data: location, error } = await supabase
      .from("location")
      .select("id, name,org_id,devices:device(hub_id, name)")
      .order("name");

    if (!location || !location.length) {
      const response = await supabase
        .from("device")
        .select("hub_id, name")
        .order("hub_id");

      error = error || response.error;
      location = [
        {
          id: -1,
          name: "All Locations",
          devices: response.data || [],
          org_id: null,
        },
      ];
    }

    if (error) throw error;

    return { props: { locations: location } };
  } catch (error) {
    console.error(error);
    return { props: { locations: [] } };
  }
};

export default function Home({ locations }: { locations: Location[] }) {
  const [time, setTime] = useState(getTimeOptions("today"));
  const [location, setLocation] = useState<number | null>(locations[0]?.id);
  const [selectedHubs, setSelectedHubs] = useState<Set<string>>(
    new Set(
      locations[0]?.devices.map((h) => {
        return h.hub_id;
      })
    )
  );
  const [device, setDevice] = useState<string>("all");

  const update = useCallback(() => {
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
      console.error(error);
    }
  }, [time.start, time.end]);

  useEffect(() => {
    const interval = setInterval(update, 30_000);

    return () => clearInterval(interval);
  }, [update]);

  let labelQuery = `hub=~"${[...selectedHubs].join("|")}"`;
  if (device != "all") labelQuery += `,serial_number=~"${device}"`;

  return (
    <Layout>
      <Row gap={0.5} justify="space-between">
        <Row wrap="wrap">
          <LocationDropdown
            locations={locations}
            onAction={(id) => setLocation(id as number)}
          />
          <Spacer x={0.5} />
          <HubDropdown
            hubs={locations?.find((d) => d.id == location)?.devices ?? []}
            selected={selectedHubs}
            setSelected={setSelectedHubs}
          />
          <Spacer x={0.5} />
          <DeviceDropdown
            hubs={selectedHubs}
            time={time}
            onAction={(serial) => setDevice(serial)}
          />
          <Spacer x={0.5} />
          <Dropdown isBordered>
            <Dropdown.Button flat css={{ mb: 14 }}>
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
                  if (window)
                    localStorage.setItem("dashboard-time", newTime.uid);
                  setTime(newTime);
                }
              }}
            >
              {timeOptions.map(({ uid, name }) => {
                return <Dropdown.Item key={uid}>{name}</Dropdown.Item>;
              })}
            </Dropdown.Menu>
          </Dropdown>
        </Row>
        <FullScreenToggle />
        <Spacer x={0.5} />
      </Row>
      <TimeContextProvider
        value={{ start: time.start / 1000, end: time.end / 1000 }}
      >
        <Spacer y={0.5} />
        <Grid.Container gap={1} justify="center">
          <KWH
            xs={12}
            md={4}
            measurement={"Power Generated"}
            labelQuery={labelQuery}
            unit={"Wh"}
          />
          <Total
            xs={12}
            md={4}
            measurement={"Realtime Power"}
            query={
              selectedHubs.size > 0
                ? `sum(aerl_srx_pv_voltage{${labelQuery}} * aerl_srx_pv_current)`
                : undefined
            }
            unit={"W"}
          />
          <Total
            xs={12}
            md={4}
            measurement={"Battery Current"}
            query={
              selectedHubs.size > 0
                ? `sum(aerl_srx_output_current{${labelQuery}})`
                : undefined
            }
            unit={"A"}
          />
        </Grid.Container>
        <Grid.Container gap={1} justify="center">
          <ReactFlowProvider>
            <SystemOverview xs={0} md={12} labelQuery={labelQuery} />
          </ReactFlowProvider>
        </Grid.Container>
        <Spacer y={0.5} />
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

function LocationDropdown({
  locations,
  onAction,
}: {
  locations: Location[];
  onAction: (key: Key) => void;
}) {

  const [selection, setSelection] = useState<string>("");
  const OrgId = locations.find((location) => location)?.org_id;

  const changeSelection = async (key: Key) => {
    // Get the corresponding location Id to selected location
    const keyId = locations.find((d) => d.name == key)?.id;
    let updatedLocation = [];
    if (keyId) {
      const org_Location: storedLocation[] = await JSON.parse(getLocalStorageData("org_location") ?? "[]");
      const isOrgExist = org_Location.find((org: storedLocation) => org.org_id === OrgId);
      if (isOrgExist) {
        updatedLocation = org_Location.map((item: storedLocation) => item.org_id === OrgId ? ({ locationId: keyId, LocationName: key || "", org_id: isOrgExist.org_id }) : item);
      } else {
        updatedLocation = [...(org_Location || []), { locationId: keyId, LocationName: key, org_id: OrgId }];
      }
      setLocalStorageData("org_location", JSON.stringify(updatedLocation));
      setSelection(key as string);
      onAction(keyId);
    }
  };

  const truncate = (str: string, n: number) => {
    return str.length > n ? str.slice(0, n - 1) + "…" : str;
  };

  // Retrieve the selected location from localStorage on component mount
  useEffect(() => {
    const fetchLocationData = async () => {
      const storedLocation: storedLocation[] = await JSON.parse(getLocalStorageData("org_location") ?? "[]");
      const currentOrgLocationData = storedLocation.find((location: storedLocation) => location.org_id === OrgId);
      if (currentOrgLocationData) {
        const locationData = locations.find((d) => d.id === currentOrgLocationData?.locationId)
        setSelection(locationData?.name ?? (locations[0]?.name ?? ""));
        onAction(locationData?.id as number)
      } else {
        setSelection(locations[0]?.name ?? "");
      }
    }
    fetchLocationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [OrgId, locations, selection])

  return (
    <Dropdown isBordered>
      <Dropdown.Button flat disabled={locations.length <= 1} css={{ mb: 14 }}>
        <MapPin />
        <Spacer x={0.3} />
        {locations.find((d) => d.name == selection)?.name ?? "No Gateways"}
      </Dropdown.Button>
      <Dropdown.Menu
        selectionMode="single"
        selectedKeys={selection ? new Set([selection]) : undefined}
        onAction={changeSelection}
        css={{ maxWidth: 400 }}
      >
        <Dropdown.Section title="Location" items={locations}>
          {(location) => (
            <Dropdown.Item
              key={location.name}
              description={`${location.devices.length} gateway${location.devices.length > 1 ? "s" : ""
                }`}
            >
              {truncate(location.name ?? "", 30)}
            </Dropdown.Item>
          )}
        </Dropdown.Section>
      </Dropdown.Menu>
    </Dropdown>
  );
}

function HubDropdown({
  hubs,
  selected,
  setSelected,
}: {
  hubs: Device[];
  selected: any; // Have to do this bullshit for NextUI. Fucking fix your typing.
  setSelected: any;
}) {
  // When the location changes, default to all hubs being selected.
  useEffect(() => {
    setSelected(
      new Set(
        hubs.map((h) => {
          return h.hub_id;
        })
      )
    );
  }, [hubs]);

  const truncate = (str: string, n: number) => {
    return str.length > n ? str.slice(0, n - 1) + "…" : str;
  };

  return (
    <Dropdown isBordered>
      <Dropdown.Button flat disabled={hubs.length == 0} css={{ mb: 14 }}>
        <Server />
        <Spacer x={0.3} />
        {selected.size == hubs.length ? "All Gateways" : "Select Gateways"}
      </Dropdown.Button>
      <Dropdown.Menu
        aria-label="Gateways"
        disallowEmptySelection
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}
        css={{ maxWidth: 400 }}
      >
        <Dropdown.Section title="Gateway" items={hubs}>
          {(device) => (
            <Dropdown.Item key={device.hub_id} description={device.hub_id}>
              {truncate(device.name ?? "", 30)}
            </Dropdown.Item>
          )}
        </Dropdown.Section>
      </Dropdown.Menu>
    </Dropdown>
  );
}

function DeviceDropdown({
  hubs,
  time,
  onAction,
}: {
  hubs: Set<string>;
  time?: any;
  onAction?: (key: string) => void;
}) {
  const [devices, setDevices] = useState<Set<string>>(new Set([]));
  const [selection, setSelection] = useState<string>("all");

  const changeSelection = (key: Key) => {
    const newSelection = key as string;
    setSelection(newSelection);
    // callback
    if (onAction) onAction(newSelection);
  };

  // Loads all seen devices in timeWindow (seconds)
  let load = useCallback(async () => {
    const start = time.start
      ? time.start / 1000
      : new Date().getTime() / 1000 - 60 * 60 * 24;
    const end = time.end / 1000;

    const result = await prometheus.series(
      [`aerl_srx_information_serial_number{hub=~"${[...hubs].join("|")}"}`],
      start,
      end
    );

    const newDevices = result.data?.map((r) => r.serial_number);

    setDevices(new Set(newDevices));
  }, [hubs, time]);

  // Update devices with timescale
  useEffect(() => {
    if (hubs && time) {
      setSelection("all");
      load();
    }
  }, [hubs, time, load]);

  const deviceTitle = () => {
    if (selection == "all") {
      if (devices.size == 0) {
        return "No Devices";
      } else {
        return "All Devices";
      }
    } else {
      return serialToModel(selection);
    }
  };

  return (
    <Dropdown isBordered>
      <Dropdown.Button flat disabled={devices.size == 0} css={{ mb: 14 }}>
        <DeviceIcon />
        <Spacer x={0.3} />
        {deviceTitle()}
      </Dropdown.Button>
      <Dropdown.Menu
        selectionMode="single"
        selectedKeys={new Set([selection])}
        onAction={changeSelection}
      >
        <Dropdown.Section title="Device">
          <Dropdown.Item key="all">All Devices</Dropdown.Item>
        </Dropdown.Section>
        <Dropdown.Section
          items={[...devices].map((d) => ({ serial_number: d }))}
        >
          {(device) => (
            <Dropdown.Item
              key={device.serial_number}
              description={device.serial_number}
            >
              {serialToModel(device.serial_number)}
            </Dropdown.Item>
          )}
        </Dropdown.Section>
      </Dropdown.Menu>
    </Dropdown>
  );
}
