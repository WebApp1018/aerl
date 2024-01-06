import { useRouter } from "next/router";

export default {
  logo: <img src="https://aerl.cloud/logo.webp" style={{ height: "2rem" }} />,
  primaryHue: 37, // match nextui warning color
  darkMode: false,
  nextThemes: {
    forcedTheme: "dark",
  },
  useNextSeoProps() {
    const { asPath } = useRouter();
    if (asPath !== "/") {
      return {
        titleTemplate: "%s · AERL Cloud",
      };
    }
  },
  head: (
    <>
      <script
        defer
        data-domain="docs.aerl.cloud"
        src="https://plausible.io/js/script.js"
      ></script>
    </>
  ),
  editLink: {
    text: "",
  },
  feedback: {
    content: "",
  },
  footer: {
    text: "AERL Pty. Ltd. © 2023",
  },
};
