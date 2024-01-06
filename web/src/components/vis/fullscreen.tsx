import { Button, Tooltip } from "@nextui-org/react";
import { BarChart2 } from "react-feather";

export default function FullScreenToggle() {
  function toggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.body.requestFullscreen({ navigationUI: "hide" });
    }
  }

  return (
    <Tooltip content="Go full-screen" placement="bottom">
      <Button
        flat
        auto
        color="primary"
        css={{
          display: "none",
          padding: "0.75em",
          "@xs": { display: "inherit" },
        }}
        onPress={() => toggle()}
      >
        <BarChart2 />
      </Button>
    </Tooltip>
  );
}
