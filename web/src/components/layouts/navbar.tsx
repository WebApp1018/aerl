import { Database } from "@/supabase/types";
import {
  Badge,
  Button,
  Container,
  Dropdown,
  Image,
  Navbar,
  Text,
} from "@nextui-org/react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState, Key, useContext } from "react";
import { EyeOff, LogOut, Bell, Settings, User, Users } from "react-feather";
import { InstanceContext } from "../themes";

export interface OrgMember {
  id: number,
  created_at: string,
  org_id: number,
  user_id: string,
  role: string
}

export default function Nav() {
  const supabase = useSupabaseClient();
  const instance = useContext(InstanceContext);
  const router = useRouter();
  const route = router.route.slice(1);
  const [orgMember, setOrgMember] = useState<OrgMember | {}>({})

  async function signOut() {
    await supabase.auth.signOut();
  }

  const items = [
    { name: "Dashboard", href: "/" },
    { name: "Locations", href: "/locations" },
    { name: "Gateways", href: "/gateways" },
  ];

  const onDropdownAction = async (key: Key) => {
    switch (key) {
      case "org-settings":
        router.push("/organization");
        break;
      case "account-settings":
        router.push("/account");
        break;
      case "org-switch":
        router.push("/organization/switch");
        break;
      case "sign-out":
        signOut();
        break;
    }
  };

  // For getting current LoggedIn Organization member Details
  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase.auth.getUser();
      const user_id = data.user?.id;
      const user_org_id = data.user?.user_metadata.org.id;
      if (user_id && user_org_id) {
        const org_Details = await supabase.from('org_member').select('*').eq('user_id', user_id).eq('org_id', user_org_id);
        setOrgMember(org_Details.data?.[0]);
      }
    }
    load();
  }, [supabase])

  return (
    <Container gap={1}>
      <Navbar
        variant="floating"
        isBordered
        disableShadow
        css={{ zIndex: 1000 }}
        maxWidth="xl"
        containerCss={{
          background: "$backgroundContrast !important",
          mx: "0 !important",
        }}
      >
        <Navbar.Brand>
          <Image
            css={{ maxWidth: "15em" }} // fixes position on safari
            alt="Company logo"
            src={instance.logo}
            height="2.5em"
            showSkeleton={false}
          />
        </Navbar.Brand>
        <Navbar.Content hideIn="xs" variant="highlight">
          {items.map((item) => (
            <Link href={item.href} key={item.href}>
              <Navbar.Item
                isActive={
                  item.href == "/" + route || (route == "" && item.href == "/")
                }
                activeColor="primary"
                variant="highlight"
              >
                {item.name}
              </Navbar.Item>
            </Link>
          ))}
        </Navbar.Content>
        <Navbar.Content hideIn="xs" gap={0} css={{ margin: "0" }}>
          <NotificationDropdown />
          <Dropdown isBordered placement="bottom-right" offset={6}>
            <Dropdown.Button
              icon={<User />}
              light
              size="lg"
              css={{ fontWeight: "normal", p: "0.75em" }}
            >
              Account
            </Dropdown.Button>
            <Dropdown.Menu
              containerCss={{
                background: "$backgroundContrast",
                borderColor: "$border",
              }}
              onAction={onDropdownAction}
            >
              <Dropdown.Item
                key="account-settings"
              >
                Account Settings
              </Dropdown.Item>
              {['admin', 'owner'].includes((orgMember as OrgMember)?.role as string) ? (
                <Dropdown.Item
                  key="org-settings"
                >
                  Organization Settings
                </Dropdown.Item>
              ) : null as any}
              <Dropdown.Section>
                <Dropdown.Item key="org-switch" icon={<Users />}>
                  Change Organization
                </Dropdown.Item>
                <Dropdown.Item key="sign-out" icon={<LogOut />}>
                  Sign Out
                </Dropdown.Item>
              </Dropdown.Section>
            </Dropdown.Menu>
          </Dropdown>
        </Navbar.Content>
        <Navbar.Toggle showIn="xs" css={{ pr: "1em" }} />
        <Navbar.Collapse>
          {items.map((item) => (
            <Navbar.CollapseItem key={item.href}>
              <Link href={item.href}>
                <Text size="larger">{item.name}</Text>
              </Link>
            </Navbar.CollapseItem>
          ))}
          <Navbar.CollapseItem>
            <Link href="/alerts">
              <Text size="larger">Notifications</Text>
            </Link>
          </Navbar.CollapseItem>
          <Navbar.CollapseItem>
            <Link href="/account">
              <Text size="larger">Account Settings</Text>
            </Link>
          </Navbar.CollapseItem>
          <Navbar.CollapseItem>
            <Link href="/organization/switch">
              <Text size="larger">Change Organization</Text>
            </Link>
          </Navbar.CollapseItem>
          <Navbar.CollapseItem>
            <Text
              size="larger"
              css={{ cursor: "pointer" }}
              role="button"
              onClick={() => signOut()}
            >
              Sign Out
            </Text>
          </Navbar.CollapseItem>
        </Navbar.Collapse>
      </Navbar>
    </Container>
  );
}

function NotificationDropdown() {
  type Notification = Database["public"]["Tables"]["notification"]["Row"];

  const router = useRouter();
  const supabase = useSupabaseClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from("notification")
      .select("*")
      .is("read_at", null);

    if (error) {
      console.error(error);
      return;
    }

    setNotifications(data as Notification[]);
  }, [supabase]);

  const clear = async () => {
    const { error } = await supabase
      .from("notification")
      .update({ read_at: new Date().toISOString() })
      .in(
        "id",
        notifications.map((n) => n.id),
      );

    if (error) {
      console.error(error);
    } else {
      fetch();
    }
  };

  const handleSelection = async (keys: "all" | Set<Key>) => {
    if (keys != "all") {
      let first = keys.values().next();

      switch (first.value) {
        case "settings":
          router.push("/alerts");
          break;
        case "clear":
          clear();
          break;
        default: {
          let link = notifications.find((n) => n.id == first.value)?.link;
          link && router.push(link);
        }
      }
    }
  };

  useEffect(() => {
    fetch();

    const channel = supabase
      .channel("any")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notification",
          filter: "read_at=is.null",
        },
        () => fetch(),
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [fetch, supabase]);

  const count = notifications ? notifications.length : 0;

  return (
    <Dropdown isBordered offset={6}>
      <Dropdown.Button
        light
        size="lg"
        css={{ fontWeight: "normal", p: "0.75em" }}
      >
        <Badge
          color="error"
          content={count}
          isInvisible={count == 0}
          disableAnimation
        >
          <Bell />
        </Badge>
      </Dropdown.Button>
      <Dropdown.Menu
        items={notifications ?? []}
        selectionMode="single"
        disabledKeys={["none", "overflow"]}
        onSelectionChange={handleSelection}
      >
        {count == 0 && (
          <Dropdown.Item key={"none"}>No unread notifications.</Dropdown.Item>
        )}
        {
          notifications?.slice(0, 5).map((item) => (
            <Dropdown.Item key={item.id} description={item.details ?? ""}>
              {item.title}
            </Dropdown.Item>
          )) as any
        }
        {notifications.length > 5 && (
          <Dropdown.Item key="overflow" variant="light">
            + {notifications.length - 5} more
          </Dropdown.Item>
        )}
        <Dropdown.Section>
          <Dropdown.Item
            key="clear"
            icon={<EyeOff />}
            css={{ display: count == 0 ? "none" : "flex" }}
          >
            Clear
          </Dropdown.Item>
          <Dropdown.Item key="settings" icon={<Settings />}>
            Notification Settings
          </Dropdown.Item>
        </Dropdown.Section>
      </Dropdown.Menu>
    </Dropdown>
  );
}
