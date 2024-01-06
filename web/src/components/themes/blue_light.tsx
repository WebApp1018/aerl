import { createTheme } from "@nextui-org/react";

const lightTheme = createTheme({
  className: "blue-light-theme",
  type: "light",
  theme: {
    colors: {
      secondaryText: "#808080",
      background: "#FFF",
      backgroundContrast: "#F7F7F7",
      border: "#E1E1E1",

      link: "var(--nextui-colors-blue600)",
      selection: "var(--nextui-colors-blue200)",

      primary: "$blue500",
      primaryLight: "$blue100",
      primaryLightHover: "$blue100",
      primaryLightContrast: "$blue600",
      primaryLightActive: "$blue300",
      primaryBorder: "$blue500",
      primaryBorderHover: "$blue600",
      primarySolidHover: "$blue700",
      primarySolidContrast: "$black",
      primaryShadow: "$blue500",
    },
    fonts: {
      sans: "Inter",
    },
  },
});

const theme = { light: lightTheme.className, dark: lightTheme.className, type: "light"};

export default theme;
