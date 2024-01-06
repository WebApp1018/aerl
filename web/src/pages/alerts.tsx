import Layout, { LayoutProps } from "@/components/layouts/main";
import {
  Button,
  Row,
  Spacer,
  Table,
  Text,
  useAsyncList,
  Dropdown,
} from "@nextui-org/react";
import { Enums } from "@/supabase/types";
import { AlertCircle, Info, Plus } from "react-feather";
import { Key, useEffect, useState } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export type Severity = Enums<"severity">;

export const severityIcon = (severity: Severity) => {
  switch (severity) {
    case "information":
      return <Info />;
    case "warning":
      return <AlertCircle color="var(--nextui-colors-warning)" />;
    case "error":
      return <AlertCircle color="var(--nextui-colors-error)" />;
  }
};

export default function Alerts(props: LayoutProps) {
  return (
    <Layout {...props} titleSuffix="Alerts">
      <Text h1>Alerts</Text>
      <Spacer y={1} />
      <AlertsTable />
      <Spacer y={1} />
      <AlertRulesTable />
      <Spacer y={1} />
      <Text h2>Receivers</Text>
      <Spacer y={1} />
      <Row>
        <Button flat auto iconRight={<Plus />}>
          Add a New Receiver
        </Button>
      </Row>
      <Spacer y={1} />
      <Table
        bordered
        borderWeight="light"
        shadow={false}
        css={{
          height: "auto",
          background: "$backgroundContrast",
        }}
      >
        <Table.Header>
          <Table.Column css={{ background: "$background" }}>NAME</Table.Column>
          <Table.Column css={{ background: "$background" }}>TYPE</Table.Column>
          <Table.Column css={{ background: "$background" }}>
            SEVERITY FILTER
          </Table.Column>
          <Table.Column css={{ background: "$background" }}>
            LABEL FILTER
          </Table.Column>
        </Table.Header>
        <Table.Body>{}</Table.Body>
      </Table>
    </Layout>
  );
}

function AlertsTable() {
  const supabase = useSupabaseClient();
  const [severityFilter, setSeverityFilter] = useState<Set<Key>>(new Set([]));

  const load = async () => {
    let query = supabase.from("alert").select("*");

    if (severityFilter.size > 0) {
      query.in("metadata->labels->>severity", Array.from(severityFilter));
    }

    query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error(error);
      return {
        items: [],
      };
    }

    return {
      items: data,
    };
  };

  const dateFormatter = Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const alerts = useAsyncList({ load });

  useEffect(() => {
    const subscription = supabase
      .channel("any")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alert" },
        alerts.reload
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, alerts.reload]);

  return (
    <>
      <Row>
        <Dropdown isBordered>
          <Dropdown.Button flat css={{ tt: "capitalize" }}>
            Severity: {severityFilter.size == 0 ? "All" : severityFilter}
          </Dropdown.Button>
          <Dropdown.Menu
            selectionMode="single"
            selectedKeys={severityFilter}
            onSelectionChange={(selection) => {
              if (selection != "all") setSeverityFilter(selection);
            }}
          >
            <Dropdown.Item key="information" icon={severityIcon("information")}>
              Information
            </Dropdown.Item>
            <Dropdown.Item key="warning" icon={severityIcon("warning")}>
              Warning
            </Dropdown.Item>
            <Dropdown.Item key="error" icon={severityIcon("error")}>
              Error
            </Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </Row>
      <Spacer y={1} />
      <Table
        bordered
        borderWeight="light"
        shadow={false}
        css={{
          background: "$backgroundContrast",
        }}
      >
        <Table.Header>
          <Table.Column css={{ background: "$background" }}>TIME</Table.Column>
          <Table.Column css={{ background: "$background" }}>
            SEVERITY
          </Table.Column>
          <Table.Column css={{ background: "$background" }}>
            DETAILS
          </Table.Column>
        </Table.Header>
        <Table.Body
          items={alerts.items}
          loadingState={alerts.loadingState}
          onLoadMore={alerts.loadMore}
        >
          {(alert) => (
            <Table.Row key={alert.id}>
              <Table.Cell>
                <Text>{dateFormatter.format(new Date(alert.created_at))}</Text>
              </Table.Cell>
              <Table.Cell>
                <Row align="center">
                  {severityIcon((alert.metadata as any).labels.severity)}
                  <Spacer x={0.5} />
                  <Text transform="capitalize">
                    {(alert.metadata as any).labels.severity}
                  </Text>
                </Row>
              </Table.Cell>
              <Table.Cell>
                <Text>{(alert.metadata as any).annotations.summary}</Text>
              </Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
        <Table.Pagination
          rowsPerPage={10}
          css={{
            "& .nextui-pagination-highlight--active": {
              backgroundColor: "$primaryLight",
            },
            display: "flex",
            justifyContent: "center",
            width: 'fit-content',
            margin: 'auto'
          }}
        />
      </Table>
    </>
  );
}

function AlertRulesTable() {
  const supabase = useSupabaseClient();

  const load = async () => {
    const { data, error } = await supabase
      .from("alert_rule")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return {
        items: [],
      };
    }

    return {
      items: data,
    };
  };

  const list = useAsyncList({ load });

  return (
    <>
      <Text h2>Rules</Text>
      <Spacer y={1} />
      <Row>
        <Button flat auto iconRight={<Plus />}>
          Add a New Rule
        </Button>
      </Row>
      <Spacer y={1} />
      <Table
        bordered
        borderWeight="light"
        shadow={false}
        css={{
          background: "$backgroundContrast",
        }}
      >
        <Table.Header>
          <Table.Column css={{ background: "$background" }}>NAME</Table.Column>
          <Table.Column css={{ background: "$background" }}>
            SEVERITY
          </Table.Column>
          <Table.Column css={{ background: "$background" }}>RULE</Table.Column>
          <Table.Column css={{ background: "$background" }}>FOR</Table.Column>
          <Table.Column css={{ background: "$background" }}>
            LABELS
          </Table.Column>
        </Table.Header>
        <Table.Body
          items={list.items}
          loadingState={list.loadingState}
          onLoadMore={list.loadMore}
        >
          {(rule) => (
            <Table.Row key={rule.id}>
              <Table.Cell>{(rule.rule as any).alert}</Table.Cell>
              <Table.Cell>{(rule.rule as any).labels.severity}</Table.Cell>
              <Table.Cell>{(rule.rule as any).expr}</Table.Cell>
              <Table.Cell>{(rule.rule as any).for}</Table.Cell>
              <Table.Cell>test</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
        <Table.Pagination
          align="center"
          rowsPerPage={5}
          css={{
            "& .nextui-pagination-highlight--active": {
              backgroundColor: "$primaryLight",
            },
            display: "flex", justifyContent: "center", width: 'fit-content', margin: 'auto'
          }}
        />
      </Table>
    </>
  );
}
