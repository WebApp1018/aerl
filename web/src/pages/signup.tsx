import {
  Button,
  Input,
  Loading,
  Row,
  Spacer,
  Text,
  useInput,
} from "@nextui-org/react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useRouter } from "next/router";
import React, { useContext, useState } from "react";
import { Edit, Grid } from "react-feather";
import { Card as CardLayout } from "@/components/layouts";
import NextLink from "next/link";
import ReCAPTCHA from "react-google-recaptcha";
import { InstanceContext } from "../components/themes";
import AuthLayout from "../components/layouts/authLayout";

export default function SignUpForm() {
  const instance = useContext(InstanceContext);
  const supabase = useSupabaseClient();
  const name = useInput("");
  const email = useInput("");
  const phone = useInput("");
  const password = useInput("");
  const confirmPassword = useInput("");
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);
  const [recaptchaStatus, setRecaptchaStatus] = useState<string | null>("");
  const router = useRouter();

  async function signUpWithEmail() {
    if (
      !name.value ||
      !email.value ||
      !phone.value ||
      !password.value ||
      !confirmPassword.value
    ) {
      setErrorText("Please fill in all the required fields.");
      return;
    }
    if (password.value !== confirmPassword.value) {
      setErrorText("Hmm, your passwords don't seem to match.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      phone: phone.value,
      email: email.value,
      password: password.value,
      options: {
        data: {
          name: name.value,
        },
      },
    });
    if (error) {
      setErrorText(error.message);
      setLoading(false);
    } else {
      if (
        data?.user &&
        Array.isArray(data.user.identities) &&
        !(data.user.identities.length > 0)
      ) {
        setErrorText(
          "Oops! It looks like a user with that email address already exists."
        );
        setLoading(false);
      } else {
        router.push("/signup?complete");
      }
    }
  }

  return (
    <AuthLayout titleSuffix="Sign Up" hideNav>
      {router.query.complete === "" ? (
        <>
          <Text h3 css={{ textAlign: "center" }}>
            Thanks for signing up!
          </Text>
          <Text css={{textAlign: "center" }}>
            Check your inbox for a confirmation email.
          </Text>
          <Spacer y={2} />
          <div style={{ display: 'flex', justifyContent: 'center', width: "100%"}}>
          <NextLink href="/login">
            <Button flat>
              Return to Login
            </Button>
          </NextLink>
          </div>
        </>
      ) : (
        <>
          <Input
            type="text"
            label="Full Name"
            bordered
            borderWeight="light"
            {...name.bindings}
            css={{ px: '12px' }}
          />
          <Spacer y={0.8} />
          <Input
            type="email"
            label="Email"
            bordered
            borderWeight="light"
            {...email.bindings}
            css={{ px: '12px' }}
          />
          <Spacer y={0.8} />
          <Input
            type="text"
            label="Phone"
            bordered
            borderWeight="light"
            {...phone.bindings}
            css={{ px: '12px' }}
          />
          <Spacer y={0.8} />
          <Input.Password
            type="password"
            label="Password"
            bordered
            borderWeight="light"
            {...password.bindings}
            css={{ px: '12px' }}
          />
          <Spacer y={0.8} />
          <Input.Password
            type="password"
            label="Confirm Password"
            bordered
            borderWeight="light"
            {...confirmPassword.bindings}
            css={{ px: '12px' }}
          />
          <Text color="red" css={{ py: "0.5em", px: '12px' }}>
            {errorText}
          </Text>
          <Spacer y={1} />
          <Row css={{
            mb: 12,
          }}>
            <ReCAPTCHA
              theme={instance.theme.type as "dark" | "light"}
              className="recaptcha"
              sitekey={`6LeyLiApAAAAAPrUAXjoSgSyJ14HGJ3CnmkSpIPW`}
              onChange={(value: string | null) => setRecaptchaStatus(value)}
            />
          </Row>
          <Spacer y={1} />
          <Button
            onClick={() => signUpWithEmail()}
            auto
            flat
            icon={!loading && <Edit />}
            disabled={!recaptchaStatus}
            css={{ mx: '12px' }}
            className="signup-btn"
          >
            {!loading ? "Sign Up" : <Loading color="currentColor" size="sm" />}
          </Button>
          <Spacer y={1} />
          <Text css={{ textAlign: "right", px: '12px' }}>
            Already have an account?
            <Link href="/login"> Sign In</Link>
          </Text>
        </>
      )}
    </AuthLayout>
  );
}
