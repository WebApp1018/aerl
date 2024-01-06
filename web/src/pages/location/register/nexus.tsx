import { LayoutProps } from "@/components/layouts";
import CardLayout from "@/components/layouts/card";
import { useState } from "react";
import {
  Button,
  Grid,
  Input,
  Loading,
  Row,
  Spacer,
  Text,
  useInput,
} from "@nextui-org/react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useSearchParams } from "next/navigation";

export default function Verify(props: LayoutProps) {
  const supabase = useSupabaseClient();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pinCode = useInput("");
  const name = useInput("");
  const searchParams = useSearchParams();

  const register = async () => {
    setLoading(true);

    const hub_id = searchParams.get("hub");

    const { data, error } = await supabase.functions.invoke("register/nexus", {
      body: {
        hub_id: hub_id,
        pin: pinCode.value,
        name: name.value,
      },
    });

    console.log(data, error);
    setLoading(false);
  };

  return (
    <CardLayout
      {...props}
      titleSuffix="Register Nexus"
      hideNav
    >
      <Grid.Container>
        <Grid xs={12}>
          <Row justify="center">
            <Text h3>Register your NeXus</Text>
          </Row>
        </Grid>
        <Spacer y={1} />

        <Grid xs={12}>
          {error && (
            <Text b color="error">
              {error}
            </Text>
          )}
        </Grid>
        {error && <Spacer y={1} />}

        {!loading && (
          <>
            <Grid xs={12}>
              <Input
                css={{ width: "100%" }}
                placeholder="Name your NeXus"
                aria-label="NeXus name"
                bordered
                {...pinCode.bindings}
              />
            </Grid>

            <Spacer y={1} />
            <Text>
              Please enter the pin-code on the sticker on the side of your NeXus
            </Text>
            <Spacer y={0.5} />
            <Grid xs={12}>
              <Input
                css={{ width: "100%" }}
                placeholder="Pin Code"
                aria-label="Pin code"
                bordered
                {...pinCode.bindings}
              />
            </Grid>
            <Spacer y={1} />

            <Grid xs={12}>
              <Button onPress={register} css={{ width: "100%" }}>
                Register
              </Button>
            </Grid>
          </>
        )}

        {loading && (
          <>
            <Spacer y={1} />
            <Row justify="center">
              <Loading color="currentColor" size="lg" />
            </Row>
          </>
        )}
        <Spacer y={1} />
      </Grid.Container>
    </CardLayout>
  );
}
