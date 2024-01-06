import { Card as CardLayout, LayoutProps } from "@/components/layouts";
import {
  Spacer,
  Row,
  Text,
  Input,
  Button,
  useInput,
  Loading,
} from "@nextui-org/react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Phone, AtSign, Briefcase } from "react-feather";

export default function LoginForm(props: LayoutProps) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const name = useInput("");
  const phone = useInput("");
  const email = useInput("");
  const abn = useInput("");

  const createOrg = async () => {
    const user_id = (await supabase.auth.getUser()).data?.user?.id;

    if (!user_id) {
      console.error("Error getting user id");
      return;
    }

    if (!name.value) {
      setErrorText("A business name must be entered.");
      return;
    }

    if (!phone.value) {
      setErrorText("A phone number must be entered.");
      return;
    }

    if (!email.value) {
      setErrorText("A billing email must be entered.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("org").insert({
      owner_id: user_id,
      instance_id: 1,
      name: name.value,
      billing_email: email.value,
      phone: phone.value,
      abn: abn.value != "" ? abn.value : null,
    });

    if (error) {
      if (error.code == "23514" && error.message.includes("org_abn_check")) {
        setErrorText(
          "ABN provided was not valid. Please correct this and try again.",
        );
      }

      console.error("Failed to create org", error);
    } else {
      router.push("/organization/switch");
    }

    setLoading(false);
  };

  return (
    <CardLayout {...props} titleSuffix="Organization Setup">
      <Row justify="space-around">
        <Text b size={18} id="modal-title">
          Create an Organization
        </Text>
      </Row>
      <Spacer y={1} />
      <Input
        type="text"
        label="Business Name *"
        required
        bordered
        borderWeight="light"
        {...name.bindings}
      />
      <Spacer y={1} />
      <Input
        type="tel"
        label="Billing Phone *"
        required
        labelLeft={<Phone size={20} />}
        bordered
        borderWeight="light"
        {...phone.bindings}
      />
      <Spacer y={1} />
      <Input
        type="email"
        label="Billing Email *"
        required
        labelLeft={<AtSign />}
        bordered
        borderWeight="light"
        {...email.bindings}
      />
      <Spacer y={1} />
      <Input
        type="text"
        label="ABN"
        labelLeft={<Briefcase />}
        helperText="Optional"
        bordered
        borderWeight="light"
        {...abn.bindings}
      />
      <Spacer y={2} />
      <Text color="error">{errorText}</Text>
      <Spacer y={1} />
      <Button flat css={{ width: "100%" }} onPress={createOrg}>
        {!loading ? "Create" : <Loading color="currentColor" size="sm" />}
      </Button>
      <Spacer y={1} />
      <Link href="/organization/switch">
        <Row align="center">
          <ArrowLeft />
          Back to Organizations
        </Row>
      </Link>
    </CardLayout>
  );
}
