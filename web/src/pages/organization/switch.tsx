import { useRouter } from "next/router";
import { Card as CardLayout } from "@/components/layouts";
import {
  Spacer,
  Row,
  Text,
  Button,
  Grid,
  Card,
  Loading,
  Table,
  Pagination,
} from "@nextui-org/react";
import { Database } from "@/supabase/types";
import { ChevronRight, LogOut } from "react-feather";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import React, { useEffect, useState } from "react";

type Org = Database["public"]["Tables"]["org"]["Row"];

export default function LoginForm({ orgs, isLoading }: { orgs: Org[], isLoading: boolean }) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [paginatedOrgs, setPaginatedOrgs] = useState<Array<Org>>([]);
  const [pagination, setPagination] = useState<{ page: number, perPage: number }>({ page: 1, perPage: 5 });
  const totalPages = Math.ceil(orgs.length / pagination.perPage);

  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  useEffect(() => {
    setPaginatedOrgs(orgs.slice(0, pagination.perPage));
  }, [orgs])

  const onChangePage = (pageNumber: number) => {
    if (!pagination) return 0;
    const startFrom = pageNumber * pagination.perPage - pagination.perPage;
    const endWith = pageNumber * pagination.perPage;
    setPagination({ ...pagination, page: pageNumber });
    setPaginatedOrgs(orgs.slice(startFrom, endWith));
  }

  return (
    <CardLayout titleSuffix="Change Organization" hideNav>
      <Grid.Container gap={1}>
        <div style={{ width: "100%" }}>
          <Table
            aria-label="Select Organization Table"
            width={100}
            css={{
              padding: "0",
            }}
            shadow={false}
          >
            <Table.Header>
              <Table.Column
                css={{ textAlign: "center", background: "none", paddingBottom: "16px" }}
              >
                <Text b size={18} id="modal-title">
                  Select an Organization
                </Text>
              </Table.Column>
            </Table.Header>
            <Table.Body items={paginatedOrgs}>
              {(org) => (
                <Table.Row key={org.id}>
                  <Table.Cell css={{ padding: "0 6px !important" }}>
                    <OrgButton org={org} />
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
          <Grid css={{ display: "flex", justifyContent: "center" }}>
            {isLoading ? <Loading size="sm" /> : orgs.length && orgs.length > pagination.perPage ? <Pagination
              css={{
                display: 'flex',
                justifyContent: "center",
                width: 'fit-content',
                margin: "20px auto 0",
                '& .nextui-c-cAbbLF': {
                  backgroundColor: '$primaryLight',
                },
              }} page={pagination.page} total={totalPages} onChange={onChangePage} /> : !orgs.length ? <Text color="var(--nextui-colors-textLight)">No Organization Found</Text> : <></>}
          </Grid>
        </div>
        <Grid xs={12} direction="column">
          <Spacer y={0.5} />
          <Button flat onPress={() => router.push("/organization/create")}>
            Create an Organization
          </Button>
          <Spacer y={0.5} />
          <Button
            light
            auto
            icon={<LogOut />}
            onPress={async () => {
              await supabase.auth.signOut();
              return router.push("/login");
            }}
          >
            Sign Out
          </Button>
        </Grid>
      </Grid.Container>
    </CardLayout>
  );
}

function OrgButton({ org }: { org: Org }) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const changeOrg = async (org: Org) => {
    setLoading(true);

    const { error, data } = await supabase.auth.updateUser({ data: { org: org } });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    await supabase.auth.refreshSession();
    setTimeout(() => {
      window.location.pathname = "/"; // go home
    });
  };

  return (
    <Card
      isPressable
      variant="bordered"
      onPress={() => changeOrg(org)}
      css={{ cursor: "pointer", background: "none", marginBottom: "12px" }}
    >
      <Card.Body css={{ p: 10 }}>
        <Row justify="space-between" align="center">
          <Text css={{ px: 10 }} b>
            {org.name}
          </Text>
          <Button
            flat
            auto
            css={{ padding: "0.7em" }}
            onPress={() =>
              changeOrg(org)
            } /* this is required as the button will capture any event */
          >
            {loading ? <Loading size="xs" css={{ p: 4 }} /> : <ChevronRight />}
          </Button>
        </Row>
      </Card.Body>
    </Card>
  );
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabase = createPagesServerClient(ctx);

  let isLoading = true;
  const { data } = await supabase.from("org").select("*");
  isLoading = false;

  const sortedOrgs = data
    ? [...data].sort((a, b) => (a?.name ?? "").localeCompare(b?.name ?? ""))
    : [];

  return {
    props: {
      orgs: sortedOrgs,
      isLoading
    },
  };
};
