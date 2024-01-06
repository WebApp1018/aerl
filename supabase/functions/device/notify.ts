import { service_client } from "../_shared/supabase.ts";

interface Body {
  machine_id: String;
}

export default async function handler(req: Request): Promise<Response> {
  const body = await req.json() as Body;

  console.info("Got request with machine id: ", body.machine_id);

  // get device information
  const { data: device, error: device_error } = await service_client
    .from("device")
    .select("id, serial_no, pin_code")
    .eq("machine_id", body.machine_id)
    .maybeSingle();

  if (device_error) throw device_error;

  if (!device) {
    throw Error("Could not find device with machine id: " + body.machine_id);
  }

  console.info(
    `Looking for registration with serial: ${device.serial_no} and pin: ${device.pin_code}`,
  );

  // find matching registration requests and use most recent
  const { data: request, error: reg_req_error } = await service_client
    .from("device_registration_request")
    .select("*")
    .eq("serial_no", device.serial_no)
    .eq("pin_code", device.pin_code)
    .order("created_at")
    .maybeSingle();

  if (reg_req_error) throw reg_req_error;

  if (!request) {
    throw Error("Could not find registration request.");
  }

  const { data: existing, error: existing_error } = await service_client.from(
    "device_registration",
  )
    .select("device_id, org_id")
    .eq("device_id", device.id)
    .eq("org_id", request.org_id);

  if (existing_error) {
    throw existing_error;
  }

  if (existing?.length == 0) {
    console.log("Registering device with id: " + device.id);

    // add device registration
    const { data, error } = await service_client
      .from("device_registration")
      .upsert({
        device_id: device.id,
        org_id: request.org_id,
      })
      .select();

    if (error) {
      throw error;
    }

    console.info("Registered device with key: " + data[0].key);
  } else {
    console.info("Device already registered with this organization");
  }

  return new Response("ok", {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
}
