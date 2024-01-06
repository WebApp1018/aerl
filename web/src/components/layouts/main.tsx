import { Container, Spacer } from '@nextui-org/react'
import Navbar from './navbar'
import Links from './links'

export type LayoutProps = {
  children: React.ReactNode,
  hideNav?: boolean,
  titleSuffix?: string,
}

export default function Main(props: LayoutProps) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {!props.hideNav && <Navbar />}
      <main style={{ flexGrow: 1 }}>
        <Container gap={0.3}>
          <Spacer y={2} />
          {props.children}
        </Container>
      </main>
      {!props.hideNav && <footer>
        <Container>
          <Spacer y={1} />
          <Links />
          <Spacer y={1} />
        </Container>
      </footer>}
    </div>
  )
}
