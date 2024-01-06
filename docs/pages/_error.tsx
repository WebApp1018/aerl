import Error from "next/error";

function Page({ statusCode }: any) {
  return <Error statusCode={statusCode} />;
}

export async function getStaticProps({ res, err }: { res: any; err: any }) {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { props: { statusCode } };
}

export default Page;
