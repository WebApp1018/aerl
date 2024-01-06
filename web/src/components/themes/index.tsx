import aerlTheme from "@/components/themes/aerl";
import redLightTheme from "@/components/themes/red_light";
import blueLightTheme from "@/components/themes/blue_light";
import blackLightTheme from "@/components/themes/black_light";
import greenLightTheme from "@/components/themes/green_light";
import { createContext } from "react";

// Change this in development to test different themes
const defaultDomain = "aerl.cloud";

/** Branded instance */
export interface Instance {
  company: string;
  theme: {
    light: string;
    dark: string;
    type: string;
  };
  logo: string;
}

/** Domain name */
type Domain = string;

/** Instance registry */
type Instances = Record<Domain, Instance>;

const instances: Instances = {
  "aerl.cloud": {
    company: "AERL",
    theme: aerlTheme,
    logo: "/logo.webp",
  },
  "ampcontrol.energy": {
    company: "Ampcontrol",
    theme: blackLightTheme,
    logo: "/logos/ampcontrol.png",
  },
  "aura.aerl.cloud": {
    company: "Aura",
    theme: blueLightTheme,
    logo: "/logos/aura.png",
  },
  "cdpower.cloud": {
    company: "CD Power",
    theme: greenLightTheme,
    logo: "/logos/cdpower.png",
  },
  "cet.live": {
    company: "CE+T",
    theme: redLightTheme,
    logo: "/logos/cet.svg",
  },
  "powerplus.online": {
    company: "PowerPlus",
    theme: blackLightTheme,
    logo: "/logos/powerplus.svg",
  },
  "redearth.aerl.cloud": {
    company: "RedEarth",
    theme: blackLightTheme,
    logo: "/logos/redearth.png",
  },
  "vaulta.aerl.cloud": {
    company: "Vaulta",
    theme: blackLightTheme,
    logo: "/logos/vaulta.svg",
  },
  "zekitek.cloud": {
    company: "ZekiTek",
    theme: blueLightTheme,
    logo: "/logos/zekitek.png",
  },
  "xess.cloud": {
    company: "XESS",
    theme: blackLightTheme,
    logo: "/logos/xess.png",
  },
};

//* Get instance from domain name */
export const getInstanceFromDomain = (domain?: string) => {
  console.log("Domain is", domain);
  // use default theme if not present
  if (!domain || !(domain in instances)) {
    domain = defaultDomain;
  }

  return instances[domain];
};


export const InstanceContext = createContext<Instance>(instances["aerl.cloud"]);