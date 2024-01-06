import { Callout } from "nextra/components";

export default function ElectricalWarningCallout() {
  return (
    <Callout type="warning" emoji="⚠️">
      Always disconnect the PV input and battery output before performing any
      work.
    </Callout>
  );
}
