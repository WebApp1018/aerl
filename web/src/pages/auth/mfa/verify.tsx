import { LayoutProps } from "@/components/layouts";
import CardLayout from "@/components/layouts/card";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
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
import { Key } from "react-feather";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

type AuthMethod = { id: string; status: string };
export default function Verify(props: LayoutProps) {
  const supabase = useSupabaseClient();
  const [error, setError] = useState("");
  const router = useRouter();
  const totpCode = useInput("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then((response) => {
      if (response.data?.currentLevel == "aal2") {
        router.push("/");
        return;
      }

      if (response.data?.nextLevel == "aal1") {
        router.push("/");
        return;
      }
    });

    supabase.auth.mfa.listFactors().then((response) => {
      if (!response.data?.totp[0]) router.push("/auth/mfa/enroll");
    });

    setLoading(false);
  }, []);

  const verifyOTP = async () => {
    const submitOTP = async () => {
      const factors = await supabase.auth.mfa.listFactors();
      if (factors.error) {
        throw factors.error;
      }

      const totpFactor = factors.data.totp[0];

      if (!totpFactor) {
        console.error("No TOTP factors found! Redirecting to enroll.");
        router.push("/auth/mfa/enroll");
      }

      const factorId = totpFactor.id;

      const challenge = await supabase.auth.mfa.challenge({ factorId });

      if (challenge.error) {
        throw challenge.error;
      }

      const challengeId = challenge.data.id;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: totpCode.value,
      });

      if (verify.error) {
        throw verify.error;
      } else {
        router.push("/");
      }
    };

    setLoading(true);
    setError("");
    await submitOTP().catch((error) => {
      setError(error.message);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (totpCode.value.length == 6) verifyOTP();
  }, [totpCode.value]);

  return (
    <CardLayout {...props} titleSuffix="Sign Up" hideNav>
      <Grid.Container>
        <Grid xs={12}>
          <Row justify="center">
            <Text h3>Welcome Back</Text>
          </Row>
        </Grid>

        {loading && (
          <>
            <Spacer y={1} />
            <Row justify="center">
              <Loading color="currentColor" size="sm" />
            </Row>
          </>
        )}

        {!loading && (
          <>
            <Grid xs={12}>
              <Row justify="center">
                <Text>Please enter the code from your authenticator app.</Text>
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

            <Grid xs={12}>
              <Input
                css={{ width: "100%" }}
                size="xl"
                bordered
                {...totpCode.bindings}
              />
            </Grid>
            <Spacer y={1} />

            <Grid xs={12}>
              <Button flat onPress={verifyOTP} css={{ width: "100%" }}>
                Submit
              </Button>
            </Grid>
          </>
        )}
      </Grid.Container>
    </CardLayout>
  );
}
