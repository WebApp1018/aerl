import { createTheme } from "@nextui-org/react";

const lightTheme = createTheme({
  className: "black-light-theme",
  type: "light",
  theme: {
    colors: {
      secondaryText: "#808080",
      background: "#FFF",
      backgroundContrast: "#F7F7F7",
      border: "#E1E1E1",

      link: "var(--nextui-colors-blue600)",
      selection: "var(--nextui-colors-blue200)",

      primary: "$gray900",
      primaryLight: "$gray400",
      primaryLightHover: "$gray100",
      primaryLightContrast: "$gray900",
      primaryLightActive: "$gray300",
      primaryBorder: "$gray500",
      primaryBorderHover: "$gray600",
      primarySolidHover: "$gray700",
      primarySolidContrast: "$black",
      primaryShadow: "$gray600",
    },
    fonts: {
      sans: "Inter",
    },
  },
});

const theme = {
  light: lightTheme.className,
  dark: lightTheme.className,
  type: "light",
};

export default theme;
