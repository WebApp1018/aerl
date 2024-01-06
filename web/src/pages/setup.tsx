import { LayoutProps } from "@/components/layouts";
import CardLayout from "@/components/layouts/card";
import {
  Input,
  Row,
  Text,
  Spacer,
  Button,
  Loading,
  Image,
  useInput,
} from "@nextui-org/react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useState, useCallback } from "react";

// Example url: localhost:3000/setup?serial=23230004&password=alchemy21toad99

export default function Setup(props: LayoutProps) {
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>();
  const supabase = useSupabaseClient();
  const searchParams = useSearchParams();
  const serial = useInput(searchParams.get("serial") ?? "");
  const password = useInput(searchParams.get("password") ?? "");
  const router = useRouter();

  const register = useCallback(async () => {
    setLoading(true);

    const auth = await supabase.auth.getSession();
    if (auth.error) {
      console.error(auth.error);
      setErrorText(auth.error.message);
      return;
    }

    // trim any whitespace
    let serial_value = serial.value.replaceAll(" ", "");

    const { error, data } = await supabase.rpc("add_device", {
      serial: serial_value,
      password: password.value,
      org_id: auth.data.session?.user.user_metadata.org.id,
    });

    if (error) {
      console.error(error);
      if (
        error.message ==
        'duplicate key value violates unique constraint "device_hub_id_key"'
      ) {
        setErrorText(
          "The hub with this serial number is already registered. Please contact support if think this is a mistake."
        );
      } else {
        setErrorText("An error occurred. Please try again.");
      }
      setLoading(false);
      return;
    }
    if (data == true) {
      router.push("/locations");
    } else {
      setErrorText("Failed to add device. Please try again.");
      setLoading(false);
      return;
    }
  }, [serial.value, password.value, supabase, router]);

  return (
    <CardLayout {...props} hideNav>
      <Row justify="center">
        <Text h3>Register your Gateway</Text>
      </Row>
      <Text>
        You can find the serial number and password on the back of your device.
      </Text>
      <Spacer y={1} />
      <Image
        alt="Nexus information label"
        src="/images/nexus-label.png"
        style={{ borderRadius: "0.5em" }}
      />
      <Spacer y={2} />
      <Input
        width="100%"
        labelLeft="Serial"
        bordered
        borderWeight="light"
        {...serial.bindings}
      />
      <Spacer y={1} />
      <Input.Password
        width="100%"
        labelLeft="Password"
        bordered
        borderWeight="light"
        {...password.bindings}
      />
      <Spacer y={1} />
      {errorText && <Text color="error">{errorText}</Text>}
      <Spacer y={1} />
      <Row justify="flex-end" css={{justifyContent:"space-between"}}>
        <NextLink href={"/gateways"}>
          <Button flat>Back</Button>
        </NextLink>
        <Button flat onPress={register}>
          {loading ? <Loading size="sm" /> : "Register"}
        </Button>
      </Row>
    </CardLayout>
  );
}
