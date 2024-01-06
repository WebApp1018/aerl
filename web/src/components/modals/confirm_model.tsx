import { Button, Modal, PressEvent, Text, theme } from "@nextui-org/react";
import { useState } from "react";

export default function ConfirmModel({ open, onConfirm, onCancel, title, description, confirmButtonText }: {
  open?: boolean,
  onConfirm?: (e: PressEvent) => void;
  onCancel?: (e: PressEvent) => void;
  title?: string;
  description?: string | JSX.Element;
  confirmButtonText?: string;
}) {
  const [isOpen, setIsOpen] = useState(open ?? false)
  const [isLoading, setIsLoading] = useState(false);

  function cancel(e: PressEvent) {
    if (onCancel) {
      onCancel(e)
    }

    setIsOpen(false)
  }

  function confirm(e: PressEvent) {
    if (onConfirm) {
      setIsLoading(true);
      onConfirm(e)
      setIsLoading(false);
    }

    setIsOpen(false)
  }

  return (
    <Modal
      open={isOpen}
      preventClose
      aria-labelledby="modal-title"
    >
      <Modal.Header css={{ paddingTop: '50px' }}>
        <Text b size={18} id="modal-title">{title ? title : "Are you sure?"}</Text>
      </Modal.Header>
      <Modal.Body>
        <Text css={{ color: theme.colors.gray700, textAlign: "center" }}>{description ? description : ""}</Text>
      </Modal.Body>
      <Modal.Footer css={{ paddingBottom: '50px', display: 'flex', justifyContent: 'center' }}>
        <Button auto flat onPress={cancel}>Cancel</Button>
        <Button auto flat color="error" disabled={isLoading} onPress={confirm}>{confirmButtonText ? confirmButtonText : "Submit"}</Button>
      </Modal.Footer>
    </Modal>
  )
}
