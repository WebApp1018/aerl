import Layout from "@/components/layouts/main";
import { LayoutProps } from "@/components/layouts/main";
import { InviteUserModal } from "@/components/modals/invite_user";
import {
  Button,
  Dropdown,
  Row,
  Spacer,
  Text,
  useAsyncList
} from "@nextui-org/react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { Trash, Plus } from "react-feather";
import ConfirmModel from "../../components/modals/confirm_model";
import useCurrentUser from "../../hooks/useCurrentUser";
import { useToast } from "../../hooks/toast";
import { invitationRoles, roles } from "../../util";
import JSXTable, { JSXTableColumnProps } from "@/components/JSXTable";

const membersListCols: Array<JSXTableColumnProps> = [
  {
    label: "NAME",
    value: "name",
  },
  {
    label: "EMAIL",
    value: "email",
    css: {
      paddingLeft: '7px',
      width: '25%',
      padding: '0'
    }
  },
  {
    label: "ROLE",
    value: "role",
    css: {
      paddingLeft: '20px'
    },
    component(value, row) {
      const disableKeys = row.currentOrgUser?.role === "admin" ? ["owner", "admin"] : [];

      return (
        <Dropdown isBordered isDisabled={!row.isAdminOrOwner || row.isOwnRole(value)}>
          <Dropdown.Button disabled={!row.isAdminOrOwner || row.isOwnRole(value)} light css={{ textTransform: "capitalize" }}>
            {value}
          </Dropdown.Button>
          <Dropdown.Menu
            aria-label="update pendingInvitation user role menu"
            selectedKeys={value ? new Set([value]) : undefined}
            selectionMode="single"
            css={{ height: "auto", background: "$backgroundContrast", }}
            onAction={(role) => {
              if (role === "owner")
                row.onOwnerRoleSwitch(row.id, row.login_user_id, value, row.name)
              else
                row.updateUserRole(row.id, role as string)
            }}
            containerCss={{ borderColor: "$border" }}
            disabledKeys={disableKeys}
          >
            <Dropdown.Section title="Change role">
              {roles.map((r) => (
                <Dropdown.Item key={r} >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown>
      )
    }
  },
  {
    label: "ACTION",
    css: {
      textAlign: 'right',
    },
    component(_, row) {
      return (
        <Row justify="flex-end">
          <Button auto light css={{ paddingLeft: "0.5em", paddingRight: '0.9em' }} onPress={() => row.removeUser(row.id)} disabled={!row.isAdminOrOwner || row.isOwnRole(row.role)}>
            <Trash size={20} />
          </Button>
        </Row>
      )
    }
  }
];

const pendingMembersCols: Array<JSXTableColumnProps> = [
  {
    label: "EMAIL",
    value: "email",
  },
  {
    label: "ROLE",
    value: "role",
    component(value, row) {
      return (
        <Dropdown isBordered isDisabled={!row.isAdminOrOwner}>
          <Dropdown.Button disabled light css={{ textTransform: "capitalize" }} >
            {value}
          </Dropdown.Button>
          <Dropdown.Menu
            selectedKeys={(value ? new Set([value]) : undefined)}
            selectionMode="single"
            css={{ height: "auto", background: "$backgroundContrast", }}
            onAction={(role) => row.updateInvitedUserRole(row.id, role as string)}
            containerCss={{ borderColor: "$border" }}
            disabledKeys={row.currentOrgUser.role === "admin" ? ["owner", "admin"] : []}
          >
            <Dropdown.Section title="Change role">
              {invitationRoles.map((r) => (
                <Dropdown.Item key={r} >
                  <Text transform="capitalize">{r}</Text>
                </Dropdown.Item>
              ))}
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown>
      )
    }
  },
  {
    label: "ACTION",
    css: {
      textAlign: 'right',
    },
    rowCss: {
      paddingRight: '18px'
    },
    component(_, row) {
      return (
        <Row justify="flex-end">
          <Button
            auto
            light
            css={{ px: "0.5em" }}
            onPress={() => row.removeInvite(row.id)}
            disabled={!row.isAdminOrOwner}
          >
            <Trash size={20} />
          </Button>
        </Row>

      )
    }
  }
];

export default function Organization(props: LayoutProps) {
  const supabase = useSupabaseClient();
  const [modal, setModal] = useState(<></>);
  const { getCurrentOrgUser, user, isAdminOrOwner, isOwnRole, currentOrgUser } = useCurrentUser();
  const { add } = useToast()

  // for get the organization member data
  const load = async () => {
    const { data } = await supabase.rpc("get_org_users");
    await getCurrentOrgUser();
    return {
      items: data ?? [],
    };
  };

  // for get pending Invitation member data
  const inviteload = async () => {
    const { data, error } = await supabase.from("org_invite").select("*");
    await getCurrentOrgUser();
    if (error) console.error(error);

    return {
      items: data ?? [],
    };
  };

  const list = useAsyncList({ load });
  const Invitelist = useAsyncList({ load: inviteload });

  // subscribe event for org_member 
  useEffect(() => {
    const sub = supabase
      .channel("any")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "org_member",
        },
        list.reload
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [list.reload, supabase]);

  // subscribe event for org_invite 
  useEffect(() => {
    const sub = supabase
      .channel("any")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "org_invite",
        },
        Invitelist.reload
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [Invitelist.reload, supabase]);

  const openInvite = () => {
    setModal(<InviteUserModal list={list.items}
      onClose={(isReload) => {
        if (isReload) {
          Invitelist.reload();
        }
        setModal(<></>)
      }} />);
  };

  // for remove organization Member 
  const removeUser = async (id: string | null) => {
    setModal(
      <ConfirmModel
        open={true}
        confirmButtonText="Delete"
        onConfirm={async () => {
          const { error } = await supabase
            .from("org_member")
            .delete()
            .eq("user_id", id);

          if (!error) {
            setModal(<></>);
            list.reload()
            add({
              message: "Removed User",
              description: "User removed successfully!",
              severity: "success",
            });
          } else {
            add({
              message: "Removing User Failed",
              description: "User not removed!",
              severity: "error",
            });
          }
          return true;
        }}
        onCancel={() => { setModal(<></>) }}
      />,
    );
  };

  const onOwnerRoleSwitch = async (user_id: string, login_user_id: string, new_user_old_role: string, user_name: string) => {
    setModal(
      <ConfirmModel
        open={true}
        title="Transfer Ownership"
        description={`Are you sure you want to transfer ownership of ${user?.user_metadata.org.name} to ${user_name}?`}
        confirmButtonText="Transfer"
        onConfirm={async () => {
          try {
            const { error: owner_role_error }: any = await supabase
              .from('org_member')
              .update({ role: 'owner' })
              .eq('user_id', user_id);

            if (owner_role_error) throw Error();
            const { error: admin_role_error }: any = await supabase
              .from('org_member')
              .update({ role: 'admin' })
              .eq('user_id', login_user_id);
            if (admin_role_error) {
              await supabase
                .from('org_member')
                .update({ role: new_user_old_role || "viewer" })
                .eq('user_id', user_id);
              throw Error();
            }
            add({
              message: "Updated User Role",
              description: "The user's role has been updated successfully.",
              severity: "success",
            });
          } catch (error) {
            add({
              message: "Updated User Role",
              description: "Failed to update transfer ownership. Please try again.",
              severity: "error",
            });
          }
          setModal(<></>);
          list.reload()
          return true;
        }
        }
        onCancel={() => { setModal(<></>) }}
      />,
    );
  };

  // for remove pending invitation User Member 
  const removeInvite = async (id: string | null) => {
    if (!id) {
      console.error("Could not delete invite. No ID provided.");
    }

    setModal(
      <ConfirmModel
        open={true}
        description="Are you sure you want to cancel this invitation? Canceling the invitation will revoke access for the user, and they won't be able to join your organization"
        confirmButtonText="Delete"
        onConfirm={async () => {
          const { error } = await supabase.from("org_invite").delete().eq("id", id);
          if (!error) {
            setModal(<></>);
            Invitelist.reload()
            add({
              message: "Cancelled Invitation",
              description: "Invitation canceled successfully!",
              severity: "success",
            });
          } else {
            add({
              message: "Cancelling Invitation Failed",
              description: "Cancelling invitation failed. Please try again!",
              severity: "error",
            });
          }
        }}
        onCancel={() => { setModal(<></>) }}
      />,
    );
  };

  // Update Organization Member Role 
  const updateUserRole = async (id: string, role: string) => {
    try {
      const { error, data }: any = await supabase
        .from('org_member')
        .update({ role: role || 'viewer' })
        .eq('user_id', id);
      if (!error) {
        add({
          message: "Updated User Role",
          description: "The user's role has been updated successfully.",
          severity: "success",
        });
        list.reload()
      }
    }
    catch (error) {
      add({
        message: "Updated User Role",
        description: "Failed to update the user's role. Please try again.",
        severity: "error",
      });
    }
  }

  // Update Pending invitation Member Role 
  const updateInvitedUserRole = async (id: string, role: string) => {
    const { error, data } = await supabase
      .from('org_invite')
      .update({ role: role || 'viewer' })
      .eq('id', id);
    if (!error) {
      add({
        message: "Updated User Role",
        description: "The user's role has been updated successfully.",
        severity: "success",
      });
      Invitelist.reload()
    }
  }

  list.items.sort((a: any, b: any) => (a.name && b.name) ? a.name.localeCompare(b.name) : 0)
  return (
    <Layout {...props} titleSuffix="Organization Settings">
      <Text h1>Organization</Text>
      <Spacer y={1} />
      <Text h2>Members</Text>
      <Row justify="space-between">
        <Row>
          <Button flat auto iconRight={<Plus />} onPress={openInvite} disabled={!isAdminOrOwner}>Invite</Button>
        </Row>
        <Row justify="flex-end"></Row>
      </Row>
      <Spacer y={1} />
      <JSXTable
        columns={membersListCols}
        data={list.items.map((item: any) => ({
          currentOrgUser,
          isAdminOrOwner,
          login_user_email: user?.email,
          login_user_id: user?.id,
          isOwnRole,
          removeUser,
          updateUserRole,
          onOwnerRoleSwitch,
          ...item
        }))}
        isLoading={list.isLoading}
        pagination={{ perPage: 5 }}
      />
      <Spacer y={1} />
      <Text h2>Pending Invitations</Text>
      <JSXTable
        columns={pendingMembersCols}
        data={Invitelist.items.map((item: any) => ({
          isAdminOrOwner,
          currentOrgUser,
          isOwnRole,
          removeInvite,
          updateInvitedUserRole,
          ...item
        }))}
        isLoading={Invitelist.isLoading}
        pagination={{ perPage: 5 }}
      />
      <Spacer y={1} />
      {modal}
    </Layout>
  );
}