import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card as CardLayout, LayoutProps } from "@/components/layouts";
import {
  Button,
  Text,
  Input,
  Container,
  useInput,
  Spacer,
  Row,
  Loading,
  Grid,
} from "@nextui-org/react";
import Link from "next/link";
import { ArrowLeft, LogIn } from "react-feather";
import { Google, Microsoft } from "@/components/icons";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useSearchParams } from "next/navigation";

export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default function LoginForm(props: LayoutProps) {
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [activateText, setActivateText] = useState("");
  const [origin, setOrigin] = useState("");
  const email = useInput("");
  const password = useInput("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const redirect = searchParams.get("redirect");


  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostName = window.location.origin;
      setOrigin(hostName);
    }
    if (code) {
      setActivateText("Account activation was successful. You can now Login.");
      setTimeout(() => {
        setActivateText("");
      }, 3000);
    }
  }, []);

  async function signInWithEmail() {
    if (!email.value || !password.value) {
      setErrorText("Please fill in all the required fields.");
      return;
    }
    setLoading(true);

    const { error, data } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) {
      if (error.message === "Email not confirmed") {
        setErrorText(
          "Looks like your account hasn't been activated yet. We've resent your confirmation email just in case you missed it."
        );
        await resendMail(email.value);
      } else {
        setErrorText(
          "That email or password don't seem to match our records. Please try again."
        );
      }
      setLoading(false);
    } else {
      if (!data.session.user?.user_metadata?.org)
        router.push("/organization/switch");
      const { error, data: user_orgs } = await supabase
        .from("org_member")
        .select("*")
        .eq("user_id", data.user.id)
        .eq("org_id", data.session.user?.user_metadata?.org?.id);
      if (!error) {
        if (!user_orgs.length) {
          await supabase.auth.updateUser({ data: { org: null } });
          await supabase.auth.refreshSession();
          router.push("/organization/switch");
        } else
          router.push(redirect ? (redirect as string) : "/");
      }
    }
  }

  async function signInWithDemoAccount() {
    const { error } = await supabase.auth.signInWithPassword({
      email: "example@aerl.cloud",
      password: "example",
    });

    if (error) {
      setErrorText(error.message);
    } else {
      router.push("/?utm_campaign=demo");
    }
  }

  async function forgotPassword() {
    setErrorText("");

    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: "https://aerl.cloud/auth/change-password",
    });

    if (error) {
      setErrorText(
        "To reset your password, please ensure that an email has been entered above."
      );
      return;
    }

    router.push("/login?reset");
  }

  const resendMail = async (email: string) => {
    return await supabase.auth.resend({
      type: "signup",
      email: email,
    });
  };

  const showPasswordReset = router.query.reset == "";

  return (
    <CardLayout {...props} titleSuffix="Log In" hideNav>
      {!showPasswordReset ? (
        <>
          {origin === "https://aerl.cloud" ? (
            <>
              <Grid.Container gap={1} justify="center">
                <Grid sm={6} xs={12}>
                  <Link
                    href={`/api/auth/google?redirectTo=${origin}/api/auth/callback`}
                    style={{ minWidth: "100%", display: "flex", width: "100%" }}
                  >
                    <Button style={{ width: "100%" }} flat icon={<Google />} />
                  </Link>
                </Grid>
                <Grid sm={6} xs={12}>
                  <Link
                    href={`/api/auth/azure?redirectTo=${origin}/api/auth/callback`}
                    style={{ minWidth: "100%", display: "flex", width: "100%" }}
                  >
                    <Button style={{ width: "100%" }} flat icon={<Microsoft />} />
                  </Link>
                </Grid>
              </Grid.Container>
              <Spacer y={1} />
              <hr />
              <Spacer y={1} />
            </>
          ) : <></>}
          <Input
            type="email"
            label="Email"
            placeholder="your@email.com"
            bordered
            borderWeight="light"
            {...email.bindings}
          />
          <Spacer y={1} />
          <Input.Password
            type="password"
            label="Password"
            placeholder="••••••••"
            bordered
            borderWeight="light"
            {...password.bindings}
            onKeyDown={(e) => {
              if (e.key == "Enter") signInWithEmail();
            }}
          />
          <Text color="red" css={{ py: "0.5em" }}>
            {errorText}
          </Text>
          <Text color="green" css={{ py: "0.5em" }}>
            {activateText}
          </Text>
          <Container gap={0}>
            <Row justify="flex-end">
              <Text
                color="primary"
                onClick={forgotPassword}
                css={{ cursor: "pointer" }}
              >
                Forgot your password?
              </Text>
            </Row>
          </Container>
          <Spacer y={1} />
          <Button
            auto
            disabled={loading}
            flat
            onPress={() => signInWithEmail()}
            icon={!loading && <LogIn />}
          >
            {!loading ? "Sign In" : <Loading color="currentColor" size="sm" />}
          </Button>
          <Spacer y={1} />
          <Text css={{ textAlign: "right" }}>
            Don&apos;t have an account? <Link href="/signup">Sign Up</Link>
          </Text>
          <Spacer y={1} />
          <hr />
          <Spacer y={1.5} />
          <Button flat onPress={() => signInWithDemoAccount()}>
            View Demo
          </Button>
        </>
      ) : (
        <>
          <Text h3>Check Your Email</Text>
          <Text>
            We have sent you an email with instructions on how to reset your
            password.
          </Text>
          <Spacer y={1} />
          <Link href="/login">
            <Row align="center">
              <ArrowLeft />
              Back to Sign In
            </Row>
          </Link>
        </>
      )}
    </CardLayout>
  );
}
