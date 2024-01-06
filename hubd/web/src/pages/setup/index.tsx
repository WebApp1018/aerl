import { Button } from "@nextui-org/react";
import { Ethernet, Wifi } from "../../components/icons";
import { useNavigate } from "react-router-dom";

export default function Setup() {

  const navigate = useNavigate()

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col justify-center p-5">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <img
            className="mx-auto h-10 w-auto"
            src="/logo.webp"
            alt="AERL"
          />
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-black dark:text-white">
            Welcome To The Cloud.
          </h2>
          <p className="text-center text-black dark:text-white">To begin using your Nexus, you must first connect it to the Internet. Please select one of the following options:</p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <Button onPress={() => navigate("/setup/wifi/scan")} size="lg" color="primary" className="w-full mb-2" endContent={<div className="ml-1"><Wifi /></div>}>
              Connect using Wifi
            </Button>
            <Button onPress={() => {navigate("/setup/ethernet")}} size="lg" color="primary" className="w-full my-2" endContent={<Ethernet />}>
              Connect using Ethernet
            </Button>

        </div>
      </div>

    </>
  );
}
