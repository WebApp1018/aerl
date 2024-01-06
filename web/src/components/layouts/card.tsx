import Layout, { LayoutProps } from "@/components/layouts/main";
import Links from "./links";
import { Card, Image, Row, Spacer, Button } from "@nextui-org/react";
import { InstanceContext } from "../themes";
import { useContext } from "react";
import { ChevronLeft, Home } from "react-feather";
import { useRouter } from "next/router";

interface CardProps extends LayoutProps {}

export default function CardLayout(props: CardProps) {
  const instance = useContext(InstanceContext);
  const router = useRouter();

  return (
    <Layout {...(props as LayoutProps)} hideNav>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "90vh",
        }}
      >
        <Card
          variant="bordered"
          css={{
            p: "1em",
            borderColor: "$border",
            background: "$backgroundContrast",
            shadow: "$md",
            mw: "450px",
          }}
        >
          <Card.Body>
            <Image
              alt="Company logo"
              src={instance.logo}
              height="3em"
              showSkeleton={false}
            />
            <Spacer y={2} />
            {props.children}
          </Card.Body>
          <Card.Footer>
            <Row justify="flex-end">
              <Links />
            </Row>
          </Card.Footer>
        </Card>
      </div>
    </Layout>
  );
}
