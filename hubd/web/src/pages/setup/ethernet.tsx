import { Button } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";

export default function Ethernet() {

    const navigate = useNavigate()

    return <>
    <div className="flex min-h-full flex-1 flex-col justify-center p-5">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-black dark:text-white">
            Please plug a cable in using the ethernet jack.
          </h2>
          <p className="text-center text-black dark:text-white">To connect a Nexus via ethernet, all you have to do is plug an ethernet cable into the port on the rear of the device. Once the device has detected a connection it will begin operating.</p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <Button onPress={() => {navigate("/setup")}} size="lg" color="primary" className="w-full">
                    Back
                </Button>
        </div>
      </div>

    </>
}