import { Button, ButtonProps } from "@nextui-org/react";
import { useEffect, useState } from "react";

interface ConfirmButtonProps extends ButtonProps {
  confirmationmessage: string;
  onPress: () => void;
}

export function ConfirmButton(props: ConfirmButtonProps) {
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (setClicked) {
      timeoutId = setTimeout(() => {
        setClicked(false);
      }, 5000);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [clicked]);

  const primaryButton = (
    <Button
      {...props}
      onPress={() => {
        setClicked(true);
      }}
    />
  );

  const confButton = <Button {...props}>{props.confirmationmessage}</Button>;

  return clicked ? confButton : primaryButton;
}
