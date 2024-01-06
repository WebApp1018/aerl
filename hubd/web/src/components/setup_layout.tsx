import { ReactNode } from "react";
import { Card, CardBody } from "@nextui-org/react";

export default function SetupLayout(props: { children: ReactNode }) {
  return (
    <div className="h-screen w-full">

      {/* Desktop */}
      <div className="h-full hidden sm:block">
      <div className="flex justify-center h-full py-32 max-h-[64rem]">
        <Card className="w-[32rem] h-full">
          <CardBody>{props.children}</CardBody>
        </Card>
      </div>
    </div>

    {/* Mobile */}
    <div className="h-full w-full block sm:hidden">
        {props.children}
      </div>
    </div>
  );
}
