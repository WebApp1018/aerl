import { Link, Row, Spacer } from '@nextui-org/react';

export default function Links() {
  return (
    <Row justify="flex-end">
      <Link
        href="https://status.aerl.cloud"
        target="_blank"
        color="inherit"
        isExternal
        css={{ opacity: 0.5 }}
      >
        System Status
      </Link>
      <Spacer x={1} />
      <Link
        href="https://docs.aerl.cloud"
        target="_blank"
        color="inherit"
        isExternal
        css={{ opacity: 0.5 }}
      >
        Help
      </Link>
    </Row>
  );
}
