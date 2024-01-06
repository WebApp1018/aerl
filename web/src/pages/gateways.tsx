import Layout from "@/components/layouts/main";
import { Badge, Button, Row, Spacer, Text } from "@nextui-org/react";
import { useState } from "react";
import dynamic from "next/dynamic";
import EditDeviceModal from "@/components/modals/edit_location";
import { Tables } from "@/supabase/types";
import ConfirmDelete from "@/components/modals/confirm_model";
import { Trash, Edit, Plus } from "react-feather";
import OnlineBadge from "@/components/online_badge";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import JSXTable, { JSXTableColumnProps } from "@/components/JSXTable";

const LocationMap = dynamic(() => import("../components/location_map"), {
  ssr: false,
});

type Device = Tables<"device">;

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabase = createPagesServerClient(ctx);

  const { data } = await supabase.from("device").select("*").order("hub_id");

  return {
    props: {
      devices: data ?? [],
    },
  };
};

export default function Gateways({ devices }: { devices: Device[] }) {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const [modal, setModal] = useState(<></>);

  function editDevice(device: Device) {
    setModal(
      <EditDeviceModal
        device={device}
        onCancel={() => setModal(<></>)}
        onSave={() => setModal(<></>)}
        confirmButtonText="Save"
      />,
    );
  }

  function deleteDevice(device: Device) {
    setModal(
      <ConfirmDelete
        confirmButtonText="Delete"
        open={true}
        onConfirm={async () => {
          const { error } = await supabase
            .from("device")
            .delete()
            .eq("id", device.id);

          if (!error) {
            setModal(<></>);
          } else {
            console.error(error);
          }
        }}
        onCancel={() => setModal(<></>)}
        title="This action cannot be reversed without performing the device registration process again."
      />,
    );
  }

  function deviceIsNew(created_at: string) {
    let now = new Date();
    let created = new Date(created_at);

    let minutes = (now.getTime() - created.getTime()) / 60_000;

    return minutes <= 30;
  }

  const TableHeader: Array<JSXTableColumnProps> = [{
    label: "SERIAL NO",
    component(_, row) {
      return (
        <Row>
          <Text css={{ fontFamily: "$mono", display: "inline" }}>
            {row.hub_id}
          </Text>
          <Spacer x={0.5} />
          {deviceIsNew(row.created_at) && (
            <Badge color="primary" variant="flat">new</Badge>
          )}
        </Row>
      )
    }
  }, {
    label: "LOCATION",
    value: "name",
    component(name) {
      return (<Text>{name ?? "..."}</Text>)
    }
  }, {
    label: "STATUS",
    value: "last_seen",
    component(last_seen) {
      return (
        <Text>
          <OnlineBadge timestamp={last_seen} />
        </Text>
      )
    }
  }, {
    css: {
      textAlign: 'right',
    },
    label: "ACTIONS",
    component(_, row) {
      return (
        <Row justify="flex-end">
          <Button css={{ px: "0.5em" }} auto light onPress={() => row.editDevice(row)}>
            <Edit />
          </Button>
          <Button css={{ px: "0.5em" }} auto light onPress={() => row.deleteDevice(row)}>
            <Trash />
          </Button>
        </Row>
      )
    }
  }]

  return (
    <Layout titleSuffix="Locations">
      <Button auto flat icon={<Plus />} onPress={() => router.push("/setup")}>
        Add Gateway
      </Button>
      <Spacer y={1} />
      <JSXTable
        columns={TableHeader}
        data={devices.map((item: any) => ({ ...item, editDevice, deleteDevice }))}
        pagination={{ perPage: 10 }}
      />
      {modal}
    </Layout>
  );
}
