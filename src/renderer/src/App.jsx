import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useMemo, useState } from "react";
import getAppTheme from "../../theme";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const [mode, setMode] = useState("light");
  const theme = useMemo(() => getAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRoutes mode={mode} onModeChange={setMode} />
    </ThemeProvider>
  );
}

export default App;