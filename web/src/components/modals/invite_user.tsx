import {
  Button,
  Dropdown,
  Input,
  Loading,
  Modal,
  Text,
  useInput,
} from "@nextui-org/react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { Mail } from "react-feather";
import { useToast } from "../../hooks/toast";
import { invitationRoles } from "../../util";

export function InviteUserModal({ list, onClose }: { list: any, onClose?: (isReload: boolean) => void, }) {
  const supabase = useSupabaseClient();
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);

  const email = useInput("");
  const [selectedRole, setSelectedRole] = useState<string>("")
  const toast = useToast();

  async function add() {
    // Old invitation code:
    // This code has an issue where it doesn't work if the user doesn't already
    // have an account.
    // Peter wants this disabled temporarily and replaced with a system where
    // you can only invite people who have accounts as a hotfix.
    /*
    // subscribe for registration being added
    supabase
      .channel("any")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "org_invite",
        },
        close,
      )
      .subscribe();

    const auth = await supabase.auth.getSession();
    if (auth.error) {
      console.error(auth.error);
      setErrorText(auth.error.message);
      return;
    }

    // add a device request
    const { error } = await supabase.from("org_invite").insert({
      org_id: auth.data.session?.user.user_metadata.org.id,
      email: email.value,
    });

    if (error) {
      console.error(error);
      switch (error.code) {
        case "23505":
          setErrorText(
            `The email "${email.value}" has already been invited to this organization.`,
          );
          break;
        case "23514":
          setErrorText(`The email "${email.value}" is not valid.`);
          break;
        default:
          setErrorText(error.message);
      }
      return;
    }

    setLoading(true);
    */

    // New code
    setLoading(true);
    setErrorText("");

    const auth = await supabase.auth.getSession();

    try {

      if (auth.error) {
        throw Error(auth.error.message);
      }

      const isEmailAvailable = list.find((user: { email: string }) => user.email === email.value)

      if (!email.value || !selectedRole) {
        throw Error("Please fill in all the required fields.");
      } else if (isEmailAvailable) {
        throw Error("This user is already a member of this organization")
      } else {
        const { data, error } = await supabase.functions.invoke("temp-invite", {
          body: {
            organisationId: auth.data.session?.user.user_metadata.org.id,
            email: email.value,
            role: selectedRole
          },
        });

        if (error) {
          throw Error("Error Contacting Server");
        }

        if (!data?.success) {
          throw Error(data?.error);
        } else {
          if (onClose) {
            onClose(true)
          }
          toast.add({
            message: "Invited Member",
            description: "Invitation request successfully sent!",
            severity: "success",
          });
        }
      }
    } catch (error: any) {
      setErrorText(error?.message);
      setLoading(false)
      return;
    }
    setLoading(false);
  }

  async function close() {
    setLoading(false);
    if (onClose) {
      onClose(false);
    }
  }

  return (
    <Modal
      open={true}
      onClose={close}
      closeButton
      aria-labelledby="modal-title"
    >
      <Modal.Header>
        <Text b size={18} id="modal-title">
          Invite a Member
        </Text>
      </Modal.Header>
      <Modal.Body>
        <Input
          type="email"
          placeholder="person@example.com"
          bordered
          autoFocus
          borderWeight="light"
          labelLeft={<Mail />}
          {...email.bindings}
        />
        <div className="invite-dropdown">
          <Dropdown isBordered borderWeight="light">
            <Dropdown.Button light css={{ tt: "capitalize", border: '1px solid #212121', width: '100%' }} >
              {selectedRole ? selectedRole : "Select User Role"}
            </Dropdown.Button>
            <Dropdown.Menu
              aria-label="Single selection actions"
              disallowEmptySelection
              selectionMode="single"
              selectedKeys={selectedRole ? new Set([selectedRole]) : undefined}
              style={{ minWidth: '100em', width: 'auto', maxWidth: '200em' }}
              css={{ height: "auto", background: "$backgroundContrast", width: 'auto' }}
              containerCss={{ borderColor: "$border" }}
              onAction={(role) => setSelectedRole(role as string)}
            >
              {invitationRoles.map((r) => (
                <Dropdown.Item key={r} >
                  <Text transform="capitalize">{r}</Text>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <Text color="error">{errorText}</Text>
      </Modal.Body>
      <Modal.Footer css={{ pb: "1.5em" }}>
        <Button auto flat disabled={loading} onPress={add}>
          {loading ? <Loading color="currentColor" size="sm" /> : "Add"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
