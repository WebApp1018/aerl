import { createTheme } from "@nextui-org/react";

const lightTheme = createTheme({
  className: "green-light-theme",
  type: "light",
  theme: {
    colors: {
      text: "$green800",
      secondaryText: "#808080",
      background: "#FFF",
      backgroundContrast: "#F7F7F7",
      border: "#E1E1E1",

      link: "var(--nextui-colors-green800)",
      selection: "var(--nextui-colors-green300)",

      green900: "#0d190d",
      green800: "#1b3219",
      green700: "#284a26",
      green600: "#366332",
      green500: "#437C3F",
      green400: "#699665",
      green300: "#8eb08c",
      green200: "#b4cbb2",
      green100: "#d9e5d9",

      primary: "$green500",
      primaryLight: "$green200",
      primaryLightHover: "$green100",
      primaryLightContrast: "$green600",
      primaryLightActive: "$green300",
      primaryBorder: "$green500",
      primaryBorderHover: "$green600",
      primarySolidHover: "$green700",
      primarySolidContrast: "$black",
      primaryShadow: "$green500",
    },
    fonts: {
      sans: "Inter",
    },
  },
});

const theme = { light: lightTheme.className, dark: lightTheme.className, type: "light" };

export default theme;
