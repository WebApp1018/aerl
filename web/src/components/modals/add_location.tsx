import { Button, Grid, Input, Loading, Modal, Spacer, Text, Textarea, useInput, Container, Row } from "@nextui-org/react";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import { useEffect, useState } from "react";
import { Position } from "@/components/location_selector";
import LocationSelector from "@/components/location_selector";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

export function AddLocationModal({ open, onClose }: {
  open?: boolean,
  onClose?: () => void,
}) {
  const supabase = useSupabaseClient()
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);

  const hubId = useInput("")
  const pinCode = useInput("")
  const name = useInput("")
  const notes = useInput("")
  const address = useInput("") // The address search input

  const [position, setPosition] = useState<Position>({
    lat: -27.555721821100985,
    lng: 152.95150683134483,
  }); // The map position
  // The map's zoom level
  const [zoom, setZoom] = useState(5);

  const [markerVisible, setMarkerVisible] = useState(false); // Whether the marker is visible

  async function add() {
    // handle no serial number
    if (hubId.value == "") {
      setErrorText("You must enter a valid serial number.")
      return;
    }

    // handle serial not a number
    if (/^\d+$/.test(hubId.value) == false) {
      setErrorText("The serial number must only contain numbers.")
      return;
    }

    // get currently registered devices
    const { data: devices, error: select_error } = await supabase
      .from('device')
      .select()
      .eq(
        "hub_id", hubId.value,
      )

    if (select_error) {
      setErrorText(select_error.message)
      return;
    }

    // handle already registered
    if (devices.length > 0) {
      setErrorText("This device is already registered with your account.")
      return;
    }

    // handle no pin code
    if (pinCode.value == "") {
      setErrorText("You must enter a valid pin code.")
      return;
    }

    // handle pin code not a number
    if (/^\d+$/.test(hubId.value) == false) {
      setErrorText("The pin code must only contain numbers.")
      return;
    }

    // add a device request
    const { error: insert_error } = await supabase
      .from('device_registration_request') // TODO: This table no longer exists, migrate to new schema
      .insert({
        hub_id: hubId.value,
        pin_code: pinCode.value,
        org_id: 3, // todo: get this from user data state
        name: name.value,
        notes: notes.value,
        coordinate: `(${position.lat}, ${position.lng})`,
      })

    if (insert_error) {
      setErrorText(insert_error.message)
      return;
    }

    // subscribe for registration being added
    const { } = supabase
      .channel('any')
      .on('postgres_changes', {
        event: "INSERT",
        schema: "public",
        table: "device_registration"
      }, handleAdded).subscribe()

    setLoading(true)
  }

  async function handleAdded() {
    setLoading(false)

    if (onClose) {
      onClose();
    }
  }

  // Debounce address search and update map position
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  useEffect(() => {
    // Ignore empty queries
    if (address.value == "") {
      return;
    }

    if (timer !== null) {
      clearTimeout(timer);
    }

    const processQuery = () => {
      // Search for location using leaflet-geosearch
      const provider = new OpenStreetMapProvider();
      provider.search({ query: address.value })
        .then((results) => {
          if (results.length == 0) {
            setErrorText("No results found for that address.")
            setMarkerVisible(true);
            return;
          }

          setErrorText("");
          // Set the new position from the search
          setPosition({ lat: results[0].y, lng: results[0].x });

          // Zoom map into position
          setZoom(15);

          // Show the marker at the new position
          setMarkerVisible(true);
        })
        .catch((error: any) => {
          setErrorText(error.message);
        });
    }

    setTimer(setTimeout(() => {
      processQuery();
    }, 500));

    return () => {
      clearTimeout(timer as NodeJS.Timeout);
    }
  }, [address.value, timer]);

  return (
    <Modal
      open={true}
      onClose={onClose}
      closeButton
      aria-label="Add Location"
      fullScreen
    >
      <Modal.Header>
        <Text b size={18} id="modal-title">Add Location</Text>
      </Modal.Header>
      <Modal.Body>
        <Container md>
          {errorText && <><Spacer y={1} /><Text color="error">Error: {errorText}</Text></>}
          <Grid.Container gap={2} justify="center" css={{ padding: "0" }}>
            <Grid sm={6} xs={12}>
              <Input
                type="text"
                label="Serial Number"
                aria-label="Serial Number"
                placeholder="00000000"
                bordered
                borderWeight="light"
                helperText="Required"
                width="100%"
                {...hubId.bindings}
              />
            </Grid>
            <Grid sm={6} xs={12}>
              <Input
                type="text"
                label="Pin Code"
                aria-label="Pin Code"
                placeholder="000000"
                bordered
                borderWeight="light"
                width="100%"
                helperText="Required"
                {...pinCode.bindings}
              />
            </Grid>
            <Grid xs={12}>
              <Input
                bordered
                borderWeight="light"
                label="Location Name"
                aria-label="Location Name"
                {...name.bindings}
                width="100%"
                helperText="Required"
              />
            </Grid>
            <Grid xs={12}>
              <Textarea
                bordered
                borderWeight="light"
                label="Notes"
                aria-label="notes"
                helperText={`${notes.value.length}/1000`}
                {...notes.bindings}
                width="100%"
              />
              <Text>{loading && "Now press the user button on your Hub."}</Text>
            </Grid>
            <Grid xs={12}>
              <Input
                bordered
                borderWeight="light"
                label="Address or Coordinates"
                aria-label="Location"
                {...address.bindings}
                width="100%"
                helperText="Required"
              />
            </Grid>
            <Grid xs={12}>
              {markerVisible && <>
                <Text>Drag the marker for fine-grain selection.</Text>
              </>}
            </Grid>
          </Grid.Container>
          <div style={{}}>
            <LocationSelector css={{ height: "40vh" }} position={position} setPosition={setPosition} markerVisible={markerVisible} />
          </div>
        </Container>
      </Modal.Body>
      <Modal.Footer css={{ pb: "1.5em" }}>
        <Button auto flat onPress={add}>
          {loading ? <Loading color="currentColor" size="sm" /> : "Add"}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default AddLocationModal;
