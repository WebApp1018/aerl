import { Link, Row, Spacer, Tooltip, Text } from "@nextui-org/react";
import { Copy } from "./icons";
import { useState } from "react";

const CopyButton = ({ text, copyText, icon }: { text: string, copyText?: string, icon?: boolean }) => {
  const [copied, setCopying] = useState(false);
  var copyTimeout: NodeJS.Timeout;
  const clipboardText: string = copyText ?? text;
  icon = icon ?? true;

  const handleCopy = () => {
    // Copy to clipboard
    if ('clipboard' in navigator) {
      navigator.clipboard.writeText(clipboardText);
    } else {
      // Legacy browsers
      document.execCommand('copy', true, clipboardText);
    }

    // Change text to copied
    setCopying(true);

    // Remove any existing copy timeout
    clearTimeout(copyTimeout);

    // create new copy timeout
    copyTimeout = (setTimeout(() => {
      setCopying(false);
    }, 2000));
  }

  return (
    <Tooltip content={copied ? "Copied!" : "Copy"} enterDelay={250} onPointerLeave={() => {
      setTimeout(() => {
        setCopying(false)
      }, 300);
    }} placement='right'>
      <Link
        target="_blank">
        <span onClick={handleCopy}>
          <Row align="center">
            <Text css={{ fontFamily: "$mono" }}>{clipboardText}</Text>
            {icon && <>
              <Spacer x={0.1} />
              <Copy size={16} color='$secondaryText' />
            </>
            }
          </Row>
        </span>
      </Link>
    </Tooltip>
  )
}

export default CopyButton;
