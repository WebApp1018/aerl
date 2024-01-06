import Layout from '@/components/layouts/card'
import { LayoutProps } from '@/components/layouts/main'
import { Input, Spacer, useInput, Text, Button, Loading } from '@nextui-org/react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function ChangePassword(props: LayoutProps) {
  const supabase = useSupabaseClient()
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState("")
  const [email, setEmail] = useState("")
  const password = useInput("")
  const confirmPassword = useInput("") 
  const router = useRouter()

  async function changePassword() {
    if (password.value !== confirmPassword.value) {
      setErrorText("Hmm, your passwords don't seem to match.")
      return;
    }

    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password: password.value })

    if (error) {
      setErrorText(error.message)
    } else {
      router.push('/')
    }

    setLoading(false)
  }

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.auth.getUser()

      if (error) {
        if (error.status == 401) {
          setErrorText("You must be logged in to change your password")
        } else {
          setErrorText(error.message)
        }

        return
      }

      setEmail(data.user.email ?? "")
    }

    load()
  }, [supabase])

  return (
    <Layout {...props}>
      <Text h3 css={{ textAlign: "center" }}>Update Password</Text>
      <Spacer y={1} />
      <Input.Password
        type='password'
        label="New Password"
        placeholder="••••••••"
        bordered
        borderWeight="light"
        {...password.bindings}
        onKeyDown={(e) => { if (e.key == 'Enter') changePassword() }}
      />
      <Spacer y={1} />
      <Input.Password
        type='password'
        label="Confirm New Password"
        placeholder="••••••••"
        bordered
        borderWeight="light"
        {...confirmPassword.bindings}  // Bind to the new state
        onKeyDown={(e) => { if (e.key == 'Enter') changePassword() }}
      />
      <Spacer y={1} />
      <Text color="error">{errorText}</Text>
      <Spacer y={1} />
      <Button
        auto
        flat
        onPress={() => changePassword()}
      >
        {!loading ? "Change Password" : <Loading color="currentColor" size="sm" />}
      </Button>
    </Layout>
  )
}
