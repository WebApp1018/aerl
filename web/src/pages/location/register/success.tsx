import { LayoutProps } from "@/components/layouts";
import CardLayout from "@/components/layouts/card";
import { Button, Grid, Row, Spacer, Text } from '@nextui-org/react'
import { useRouter } from "next/router";

export default function Verify(props: LayoutProps) {

  const router = useRouter()
  return (
    <CardLayout {...props} titleSuffix="Sucessful registration" hideNav>
      <Grid.Container>
        <Grid xs={12}>
          <Row justify="center">
            <Text h3>Successful registration</Text>
          </Row>
        </Grid>
        <Spacer y={1} />
        <Grid xs={12}>
          <Row justify="center">
            <Text>Would you like to add your new NeXus to a location?</Text>
          </Row>
        </Grid>
        <Spacer y={1} />
        <Row>
          <Button
            flat
            onPress={() => { router.push('/locations') }}
          > Add a location </Button>
          <Spacer x={1} />
          <Button
            flat
            onPress={() => { router.push('/') }}
          > Home </Button>
        </Row>
      </Grid.Container>
    </CardLayout >
  )
}
