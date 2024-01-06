import { createTheme } from "@nextui-org/react";

const lightTheme = createTheme({
  className: "red-light-theme",
  type: "light",
  theme: {
    colors: {
      secondaryText: "#808080",
      background: "#FFF",
      backgroundContrast: "#F7F7F7",
      border: "#E1E1E1",

      link: "var(--nextui-colors-red600)",
      selection: "var(--nextui-colors-red200)",

      red900: "#2e0706",
      red800: "#5c0e0c",
      red700: "#891511",
      red600: "#b71c17",
      red500: "#e5231d",
      red400: "#ea4f4a",
      red300: "#ef7b77",
      red200: "#f5a7a5",
      red100: "#fad3d2",

      primary: "$red500",
      primaryLight: "$red100",
      primaryLightHover: "$red200",
      primaryLightContrast: "$red600",
      primaryLightActive: "$red300",
      primaryBorder: "$red400",
      primaryBorderHover: "$red600",
      primarySolidHover: "$red700",
      primarySolidContrast: "$black",
      primaryShadow: "$red600",

      gradient:
        "linear-gradient(112deg, var(--nextui-colors-cyan600) -63.59%, var(--nextui-colors-red600) -20.3%, var(--nextui-colors-red600) 70.46%)",
    },
    fonts: {
      sans: "Inter",
    },
  },
});

const theme = { light: lightTheme.className, dark: lightTheme.className, type: "light" };

export default theme;
