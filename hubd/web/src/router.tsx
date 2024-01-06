import { Navigate, createBrowserRouter } from "react-router-dom";
import Setup from "./pages/setup";
import SetupLayout from "./components/setup_layout";
import Ethernet from "./pages/setup/ethernet";
import Scan from "./pages/setup/wifi/scan";
import Connect from "./pages/setup/wifi/connect";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Navigate to={"/setup"} />
    ),
  },
  {
    path: "/setup",
    element: (
      <SetupLayout>
        <Setup />
      </SetupLayout>
    ),
  },
  {
    path: "/setup/ethernet",
    element: (
      <SetupLayout>
        <Ethernet />
      </SetupLayout>
    ),
  },
  {
    path: "/setup/wifi/scan",
    element: (
      <SetupLayout>
        <Scan />
      </SetupLayout>
    ),
  },
  {
    path: "/setup/wifi/connect/:ssid",
    element: (
      <SetupLayout>
        <Connect />
      </SetupLayout>
    ),
  },

]);
