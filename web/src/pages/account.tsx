import Layout from "@/components/layouts/main";
import { LayoutProps } from "@/components/layouts/main";
import { UserMetadata } from "@/supabase/supabase";
import {
  Button,
  Card,
  Container,
  Input,
  Loading,
  Spacer,
  Text,
  useInput,
} from "@nextui-org/react";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/toast";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { MFASettings } from "@/components/settings/auth/mfa_settings";

export default function Account(props: LayoutProps) {
  return (
    <Layout {...props} titleSuffix="Account Settings">
      <Container sm={true}>
        <Text h2>Account Settings</Text>
        <Spacer y={1} />
        <ContactDetails />
        <Spacer y={1} />
        <MFASettings />
      </Container>
    </Layout>
  );
}

function ContactDetails() {
  const supabase = useSupabaseClient();
  const [userMeta, setUserMeta] = useState<UserMetadata>();
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const name = useInput("");
  const email = useInput("");
  const phone = useInput("");
  const { add } = useToast();

  const save = async () => {
    setLoading(true);
    setErrorText("");

    // Get latest user data
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      setErrorText("Error setting user details");
      setLoading(false);
      console.error(error);
      return;
    }
    const metadata = data.user?.user_metadata as UserMetadata;

    // If metadata does not exist
    if (!metadata) {
      setErrorText("Error setting user details");
      console.error("Error retriveing metadata");
      setLoading(false);
      return;
    }
    const newMeta: UserMetadata = {
      ...metadata,
      full_name: name.value,
      phone: phone.value,
    };
    const updatedData = await supabase.auth.updateUser({ data: newMeta });
    // Handle errors
    if (updatedData.error) {
      setErrorText("Error setting user details");
      setLoading(false);
      return;
    }
    setUserMeta(updatedData?.data?.user?.user_metadata as UserMetadata);
    add({
      message: "Account Settings",
      description: "Account information updated successfully!",
      severity: "success",
    });
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (error) console.error(error);
      const metadata = data.user?.user_metadata as UserMetadata;
      if (metadata) setUserMeta(metadata);
      name.setValue(metadata?.full_name ?? "");
      email.setValue(metadata?.email ?? "");
      phone.setValue(metadata?.phone ?? "");
    };

    load();
  }, [supabase]);

  return (
    <Card
      variant="bordered"
      css={{
        background: "$backgroundContrast",
        borderColor: "$border",
        px: "0.5em",
      }}
    >
      <Card.Header>
        <Text h3>Contact Details</Text>
      </Card.Header>
      <Card.Body>
        {errorText && <Text color="red">{errorText}</Text>}

        <Input
          label="Full Name"
          initialValue=""
          type="text"
          bordered
          borderWeight="light"
          {...name.bindings}
        />
        <Spacer y={1} />
        <Input
          label="Email"
          type="email"
          disabled
          bordered
          borderWeight="light"
          {...email.bindings}
        />
        <Spacer y={1} />
        <Input
          label="Phone"
          type="tel"
          bordered
          borderWeight="light"
          {...phone.bindings}
        />
      </Card.Body>
      <Card.Footer css={{ pb: "1.5em" }}>
        {/* @ts-ignore */}
        <Button
          flat
          auto
          onPress={save}
          disabled={
            !(
              userMeta?.full_name !== name?.value ||
              userMeta?.phone !== phone?.value
            )
          }
        >
          {loading ? <Loading /> : "Save"}
        </Button>
      </Card.Footer>
    </Card>
  );
}
