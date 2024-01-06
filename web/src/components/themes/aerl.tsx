import { createTheme } from "@nextui-org/react";

const darkTheme = createTheme({
  className: "aerl-dark-theme",
  type: "dark",
  theme: {
    colors: {
      secondaryText: "#808080",
      background: "#111",
      backgroundContrast: "#181818",
      border: "#212121",

      link: "var(--nextui-colors-yellow600)",
      selection: "var(--nextui-colors-yellow100)",

      primary: "$yellow600",
      primaryLight: "#2E281B",
      primaryLightHover: "#393222",
      primaryLightActive: "$yellow200",
      primaryLightContrast: "$yellow700",
      primaryBorder: "$yellow500",
      primaryBorderHover: "$yellow600",
      primarySolidHover: "$yellow700",
      primarySolidContrast: "#fff",
      primaryShadow: "$yellow500",

      gradient:
        "linear-gradient(112deg, var(--nextui-colors-cyan600) -63.59%, var(--nextui-colors-red600) -20.3%, var(--nextui-colors-yellow600) 70.46%)",
    },
    fonts: {
      sans: "Inter",
    },
  },
});

const theme = { light: darkTheme.className, dark: darkTheme.className, type:"dark" };
export default theme;
