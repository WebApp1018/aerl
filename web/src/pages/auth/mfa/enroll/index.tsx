import { LayoutProps } from "@/components/layouts";
import CardLayout from "@/components/layouts/card";
import {
  Button,
  Grid,
  Input,
  useInput,
  Text,
  Row,
  Link,
  Spacer,
  Image,
} from "@nextui-org/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { AuthMFAEnrollResponse } from "@supabase/supabase-js";
import CopyButton from "@/components/copy_button";
import NextLink from "next/link";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function EnrollMFA(props: LayoutProps) {
  const supabase = useSupabaseClient();
  const [factorId, setFactorId] = useState("");
  const [totpSecret, setTotpSecret] = useState<AuthMFAEnrollResponse["data"]>();
  const verifyCode = useInput("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [viewTotp, setViewTotp] = useState(false);
  const [loading, setLoading] = useState(true);

  const onEnableClicked = () => {
    setError("");
    (async () => {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) {
        setError(challenge.error.message);
        throw challenge.error;
      }

      const challengeId = challenge.data.id;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: verifyCode.value,
      });
      if (verify.error) {
        // TOTP could not be verified
        setError(verify.error.message);
        console.error(verify.error);
        return;
      } else {
        // TOTP verified
        router.push("/account");
      }
    })();
  };

  useEffect(() => {
    const getFactors = async () => {
      setLoading(true);

      // Check if user has already enrolled
      const auth = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (auth.error) {
        setLoading(false);
        setError(auth.error.message);
        throw auth.error;
      }

      if (auth.data.nextLevel === "aal2") {
        // User has already setup mfa
        router.push("/account");
        return;
      }

      const mfa = await supabase.auth.mfa.enroll({ factorType: "totp" });

      if (mfa.error) {
        console.error(mfa.error);
        setError(mfa.error.message);
        setLoading(false);
        return;
      }

      setFactorId(mfa.data.id);
      setTotpSecret(mfa.data);
      setLoading(false);
    };

    getFactors();
  }, [supabase]);

  return (
    <CardLayout {...props} titleSuffix="Enroll in MFA" hideNav>
      <Row justify="center">
        <Text h3>Enroll in MFA</Text>
      </Row>
      <Row justify="center">
        {/* The following link will be filled out once it exists in the docs */}
        <Text>
          Please scan the following QR code using your authenticator app. For
          more information, please refer to the{" "}
          <Link href="https://docs.aerl.cloud/cloud/help-and-support/multi-factor-authentication">
            documentation
          </Link>
          .
        </Text>
      </Row>
      <Image
        alt="TOTP QR code"
        css={{ mb: "-1rem" }}
        width="12em"
        height="12em"
        showSkeleton
        src={totpSecret?.totp.qr_code ?? ""}
      />
      {viewTotp ? (
        <>
          <Row justify="center">
            <CopyButton text={totpSecret?.totp.secret ?? ""} />
          </Row>
          <Spacer y={0.5} />
        </>
      ) : (
        <>
          <Button light color="primary" auto onPress={() => setViewTotp(true)}>
            Can&apos;t scan the code?
          </Button>
        </>
      )}

      {error && <Text color="error">{error}</Text>}

      <Input
        type="text"
        label="Authenticator Code"
        bordered
        borderWeight="light"
        {...verifyCode.bindings}
      />

      <Spacer y={1} />

      <Grid.Container gap={1} justify="center">
        <Grid xs={12} sm={6}>
          <NextLink href="/account" style={{ width: "100%" }}>
            <Button flat auto css={{ width: "100%" }}>
              Cancel
            </Button>
          </NextLink>
        </Grid>
        <Grid xs={12} sm={6}>
          <Button auto onPress={onEnableClicked} css={{ minWidth: "100%" }}>
            Enable
          </Button>
        </Grid>
      </Grid.Container>
    </CardLayout>
  );
}
