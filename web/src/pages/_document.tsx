import { CssBaseline } from "@nextui-org/react";
import { Html, Main, NextScript, Head } from "next/document";

export default function Document() {
  return (
    <Html lang="en" style={{ background: "$background" }}>
      <Head>
        {CssBaseline.flush()}
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:title" content="AERL Cloud" />
        <meta property="og:image" content="/opengraph.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
