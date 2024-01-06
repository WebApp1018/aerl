import { Database } from "@/supabase/types";
import { Button, Input, Modal, PressEvent, Spacer, Text, Textarea, useInput } from "@nextui-org/react";
import { Position } from "../location_selector";
import { useState } from "react";
import dynamic from "next/dynamic";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

const LocationSelector = dynamic(() => import('@/components/location_selector'), {
  ssr: false,
})

export default function EditLocationModal({ device, open, onSave, onCancel, confirmButtonText }: {
  device: Database['public']['Tables']['device']['Row']
  open?: boolean,
  onSave?: (e: PressEvent) => void,
  onCancel?: () => void,
  confirmButtonText: string
}) {
  const supabase = useSupabaseClient()
  const notes = useInput(device.notes ?? "");
  const name = useInput(device.name ?? "");

  const [position, setPosition] = useState<Position>(parseCoordinates(device.coordinate as string ?? ""));

  const update = async () => {
    const { error } = await supabase
      .from('device')
      .update({ name: name.value, notes: notes.value, coordinate: `(${position.lat},${position.lng})` })
      .eq('id', device.id);

    if (error) {
      console.error(error)
    }
  }

  const save = async (e: PressEvent) => {
    await update()
    if (onSave) onSave(e)
  }

  return (
    <Modal
      open={open ?? true}
      closeButton
      onClose={() => { onCancel && onCancel() }}
      aria-labelledby="modal-title"
    >
      <Modal.Header>
        <Text b size={18} id="modal-title">Edit Gateway</Text>
      </Modal.Header>
      <Modal.Body>
        <Input
          bordered
          borderWeight="light"
          label="Name"
          aria-label="notes"
          {...name.bindings}
        />
        <Textarea
          bordered
          borderWeight="light"
          label="Notes"
          aria-label="notes"
          helperText={`${notes.value.length}/1000`}
          {...notes.bindings}
        />
        <Spacer y={0} />
        Location
        <Spacer y={0.35} />

        <LocationSelector position={position} setPosition={setPosition} css={{ height: "20vh" }} />

      </Modal.Body>
      <Modal.Footer css={{ pb: "1.5em" }}>
        <Button auto flat onPress={save}>{confirmButtonText ? confirmButtonText : "Save changes"}</Button>
      </Modal.Footer>
    </Modal>
  )
}

// Return a Position type
const parseCoordinates = (coords: string) => {
  const regex = /\((-?\d+\.\d+),(-?\d+\.\d+)\)/;
  const matches = coords.match(regex);

  // Handle invalid coordinates
  if (!matches) return { lat: 0, lng: 0 };

  const latitude = parseFloat(matches[1]);
  const longitude = parseFloat(matches[2]);
  return { lat: latitude, lng: longitude };
}
