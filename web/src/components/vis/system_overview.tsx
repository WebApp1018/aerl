import { prometheus } from "@/api/prometheus";
import toFixedNumberString from "@/util/to_fixed_number_string";
import {
  BreakpointsValue,
  Card,
  Grid,
  Loading,
  Spacer,
  Text,
  Badge,
  Row,
} from "@nextui-org/react";
import { FC, useContext, useEffect, useState } from "react";
import { useCallback, CSSProperties } from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Handle,
  Position,
  NodeProps,
  useReactFlow,
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getSmoothStepPath,
} from "reactflow";
import "reactflow/dist/style.css";
import { Battery, Charger, Generator, Load, Solar } from "../icons";
import { TimeContext } from "./time_context";

const OverviewBadge = ({
  value,
  prefix,
  unit,
  loading,
}: {
  value: string;
  prefix: string;
  unit: string;
  loading: boolean;
}) => {
  if (!value || value == "0" || value == "0.0") {
    return <></>;
  }
  return (
    <Badge
      isSquared
      variant="flat"
      size="md"
      color="primary"
      css={{ bgBlur: "$primaryLight" }}
    >
      {loading ? (
        <Loading color="primary" size="xs" />
      ) : (
        <Text size="large" b color="primary">
          {value} {prefix}
          {unit}
        </Text>
      )}
    </Badge>
  );
};

const CustomNode: FC<NodeProps> = ({
  data,
  targetPosition = Position.Top,
  sourcePosition = Position.Bottom,
}: NodeProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [value, setValue] = useState<number>(0);
  const time = useContext(TimeContext);

  data.query = data.query ?? "";

  useEffect(() => {
    var cancelled = false;

    const executeLabelQuery = async () => {
      if (data.query == "") {
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await prometheus.query(data.query ?? "", time.end);

      if (response.error) {
        console.error(response.error);
        setLoading(true);
      }

      if (cancelled) return;

      if (response?.data?.result.length == 0) {
        setValue(0); // Device is offline => 0 kW
        setLoading(false);
      } else {
        const result = parseFloat(response?.data?.result[0].value[1]);
        setValue(!isNaN(result) ? result : 0);
        setLoading(false);
      }
    };

    executeLabelQuery();
    return () => {
      cancelled = true;
    };
  }, [time, data.query]);

  return (
    <>
      <Card variant="bordered" css={{ width: "8em", height: "8em" }}>
        <Handle
          style={{ visibility: "hidden" }}
          id="a"
          type="target"
          position={targetPosition}
        />
        {data.inverter && (
          <Handle
            style={{ visibility: "hidden" }}
            type="target"
            id="b"
            position={Position.Left}
          />
        )}
        <Card.Body css={{ pt: 0 }}>{data.icon}</Card.Body>
        <Card.Footer
          isBlurred={true}
          css={{
            position: "absolute",
            bgBlur: "#ffffff08",
            bottom: 0,
            zIndex: 0,
            py: 2.5,
          }}
        >
          <Row justify="space-around">
            <Text b>{data?.label}</Text>
          </Row>
        </Card.Footer>
        <Handle
          type="source"
          style={{ visibility: "hidden" }}
          position={sourcePosition}
        />
      </Card>
      {data.query != "" && (
        <div
          style={{
            paddingTop: "0.5em",
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          {/*Quick hack to make voltage have a decimal. Will have to change later */}
          <OverviewBadge
            value={value.toFixed(1)}
            prefix={""}
            loading={loading}
            unit={data.unit}
          />
        </div>
      )}
    </>
  );
};

const CustomEdge: FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 15,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [value, setValue] = useState<number>(0);
  const [active, setActive] = useState<boolean>(data.active ?? true);
  const time = useContext(TimeContext);

  data.query = data.query ?? "";
  data.showLabel = data.showLabel ?? false;
  const verticalLabelOffset = data?.horizontal ? "-100" : "-280";
  const processedValue = toFixedNumberString(value, 2);

  const activeStyles: CSSProperties = active
    ? { stroke: "var(--nextui-colors-primary)" }
    : { animation: "none", stroke: "#ccc", opacity: 0.5 };

  useEffect(() => {
    var cancelled = false;

    if (data.query == "") {
      setLoading(false);
      return;
    }

    setLoading(true);
    prometheus
      .query(data.query ?? "", time.end)
      .then((response) => {
        if (cancelled) return;
        if (response?.data?.result.length == 0) {
          setValue(0); // Device is offline => 0 kW
          setActive(false);
          setLoading(false);
        } else {
          const result = Math.round(response?.data?.result[0].value[1]);
          setValue(!isNaN(result) ? result : 0);
          setActive(!isNaN(result) ? true : false);
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error(error);
        setLoading(true); // If query fails, don't show label
      });

    return () => {
      cancelled = true;
    };
  }, [time, data.query]);

  return (
    <>
      <BaseEdge
        id={id}
        markerEnd={markerEnd}
        path={edgePath}
        style={{ ...activeStyles, strokeWidth: 4 }}
      />
      {data.showLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-175%, ${verticalLabelOffset}%) translate(${labelX}px,${labelY}px)`,
            }}
          >
            <OverviewBadge
              value={processedValue.value}
              prefix={processedValue.prefix}
              loading={loading}
              unit={"W"}
            />
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

const nodeTypes = {
  powerNode: CustomNode,
};

const edgeTypes = {
  label: CustomEdge,
};

export default function SystemOverview({
  xs,
  sm,
  md,
  lg,
  xl,
  labelQuery,
}: {
  xs?: BreakpointsValue;
  sm?: BreakpointsValue;
  md?: BreakpointsValue;
  lg?: BreakpointsValue;
  xl?: BreakpointsValue;
  labelQuery?: string;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const onConnect = useCallback(
    (params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const proOptions = { hideAttribution: true };

  const defaultEdgeOptions = {
    style: { strokeWidth: 4, stroke: "rgba(246, 173, 55, 0.4)" },
    type: "smoothstep",
  };

  // Listen for window resize events
  const [width, setWidth] = useState(0); // default width, detect on server.

  useEffect(() => {
    // Set nodes with updates queries
    setNodes([
      {
        id: "1",
        position: { x: 20, y: 100 },
        targetPosition: Position.Bottom,
        sourcePosition: Position.Bottom,
        type: "powerNode",
        data: {
          label: "Solar",
          icon: <Solar />,
        },
      },
      {
        id: "2",
        position: { x: 300, y: 320 },
        type: "powerNode",
        targetPosition: Position.Left,
        sourcePosition: Position.Top,
        data: {
          label: "Charger",
          icon: <Charger />,
        },
      },
      {
        id: "3",
        position: { x: 300 + 280, y: 100 },
        type: "powerNode",
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        data: {
          label: "Battery",
          icon: <Battery />,
          query: `avg(aerl_srx_output_voltage{${labelQuery}}) < 100000`,
          unit: "V",
        },
      },
      {
        id: "4",
        position: { x: 300 + 280, y: 320 },
        type: "powerNode",
        targetPosition: Position.Left,
        sourcePosition: Position.Right,
        data: {
          label: "Generator",
          icon: <Generator />,
        },
      },
      {
        id: "5",
        position: { x: 300 + 280 + 280, y: 320 },
        type: "powerNode",
        targetPosition: Position.Top,
        sourcePosition: Position.Right,
        data: {
          label: "Inverter",
          icon: <Charger />,
          inverter: true,
        },
      },
      {
        id: "6",
        position: { x: 280 + 280 + 280 + 280, y: 100 },
        type: "powerNode",
        targetPosition: Position.Bottom,
        sourcePosition: Position.Bottom,
        data: {
          label: "Load",
          icon: <Load />,
        },
      },
    ]);

    // On page load the labelquery is undefined, so don't set edges
    if (labelQuery?.includes("undefined")) return;

    // Set edges with updated queries
    setEdges([
      {
        id: "e1-2",
        source: "1",
        target: "2",
        animated: true,
        type: "label",
        data: {
          showLabel: true,
          active: false,
          query: `sum(aerl_srx_pv_voltage{${labelQuery}} * aerl_srx_pv_current)`,
        },
      },
      {
        id: "e1-3",
        source: "2",
        target: "3",
        animated: true,
        type: "label",
        data: {
          showLabel: false,
          active: false,
          query: `sum(aerl_srx_pv_voltage{${labelQuery}} * aerl_srx_pv_current)`,
        },
      },
      {
        id: "e1-4",
        source: "3",
        target: "5",
        animated: true,
        type: "label",
        data: {
          showLabel: false,
          query: `avg(aerl_srx_output_voltage{${labelQuery}}) < 100000`,
          active: false,
        },
      },
      {
        id: "e1-5",
        source: "5",
        target: "6",
        animated: true,
        type: "label",
        data: {
          showLabel: false,
          query: `avg(aerl_srx_output_voltage{${labelQuery}}) < 100000`,
          active: false,
        },
      },
      {
        id: "e1-6",
        source: "4",
        target: "5",
        animated: true,
        type: "label",
        targetHandle: "b",
        data: {
          showLabel: false,
          horizontal: true,
          active: false,
        },
      },
    ]);
  }, [labelQuery, setEdges, setNodes]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setWidth]);

  // If the window is resized, resize the graph to fit the new window size.
  const reactFlowInstance = useReactFlow();
  useEffect(() => {
    const timeout = setTimeout(() => {
      reactFlowInstance.fitView();
    }, 50);
    return () => clearTimeout(timeout);
  }, [reactFlowInstance, width]);

  return (
    <Grid
      xs={xs}
      sm={sm}
      md={md}
      lg={lg}
      xl={xl}
      css={{ position: "relative" }}
    >
      <ReactFlow
        style={{ minHeight: "24em", height: "100%", width: "100%" }}
        zoomOnScroll={false}
        zoomOnDoubleClick={false}
        zoomOnPinch={false}
        panOnScroll={false}
        panOnDrag={false}
        nodes={nodes}
        edges={edges}
        onConnect={onConnect}
        proOptions={proOptions}
        defaultEdgeOptions={defaultEdgeOptions}
        draggable={false}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        preventScrolling={false}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      ></ReactFlow>
    </Grid>
  );
}
