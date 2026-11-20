import { createTheme } from "@mui/material/styles";

const getAppTheme = (mode = "light") =>
  createTheme({
    cssVariables: true,

    palette: {
      mode,

      primary: {
        main: "#2563EB",
        light: "#60A5FA",
        dark: "#1D4ED8",
        contrastText: "#FFFFFF",
      },

      customColors: {
        inputBorder: mode === "dark" ? "rgba(255, 255, 255, 0.18)" : "rgba(47, 51, 73, 0.22)",
        primaryHover: mode === "dark" ? "rgba(37, 99, 235, 0.15)" : "#EFF6FF",
        activeBackground: mode === "dark" ? "rgba(37, 99, 235, 0.18)" : "#D9EBFD",
        drawerShadow: mode === "dark" ? "0 10px 40px rgba(0, 0, 0, 0.55)" : "0 10px 40px rgba(0, 0, 0, 0.12)",
        headerBackground: mode === "dark" ? "#0F172A" : "#FFFFFF",
        headerText: mode === "dark" ? "#F8FAFC" : "#111827",
        headerSecondaryText: mode === "dark" ? "#E2E8F0" : "#374151",
        headerDivider: mode === "dark" ? "rgba(148,163,184,0.35)" : "#E5E7EB",
        calendarBackground: mode === "dark" ? "rgba(59,130,246,0.15)" : "#DBEAFE",
        calendarIcon: mode === "dark" ? "#93C5FD" : "#2563EB",
        clockBackground: mode === "dark" ? "rgba(34,197,94,0.15)" : "#DCFCE7",
        clockIcon: mode === "dark" ? "#86EFAC" : "#16A34A",
        cardShadow: mode === "dark" ? "0 10px 30px rgba(255, 255, 255, 0.12)" : "0 4px 15px rgba(0, 0, 0, 0.08)",
      },

      third: {
        main: mode === "dark" ? "#FFFFFF" : "#000000",
        50: mode === "dark" ? "#40474d" : "#F9FAFB",
        100: mode === "dark" ? "#6e7984" : "#F9FAFB",
        200: mode === "dark" ? "#E2E8F0" : "#E5E7EB",
        400: mode === "dark" ? "#9CA3AF" : "#99a1af",
        500: mode === "dark" ? "#D1D5DB" : "#6a7282",
        800: mode === "dark" ? "#F3F4F6" : "#1F2937",
        950: mode === "dark" ? "#FFFFFF" : "#000000",
        reverse: mode === "dark" ? "#000000" : "#FFFFFF",
      },

      background: {
        default: mode === "dark" ? "#0F172A" : "#F8F7FA",
        paper: mode === "dark" ? "#111827" : "#FFFFFF",
      },

      text: {
        primary: mode === "dark" ? "#F3F4F6" : "#2F3349",
        secondary: mode === "dark" ? "#9CA3AF" : "#6C6F82",
      },
    },

    typography: {
      fontFamily: '"Public Sans", sans-serif',
    },

    components: {
      MuiTypography: {
        styleOverrides: {
          root: {
            color: mode === "dark" ? "#E5E7EB" : "#6C6F82",
          },
        },
      },
    },
  });

export default getAppTheme;