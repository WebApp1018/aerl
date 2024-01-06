const serialToModel = (serial_no: string): string => {
  const id = serial_no.slice(0, 2);

  switch (id) {
    case "91":
      return "SRX 600/55-48";
    case "92":
      return "SRX 600/30-120";
    case "93":
      return "SRX 600/70-48";
    case "94":
      return "SRX-R 600/60-48";
    case "95":
      return "SRX-R 600/60-48";
    case "96":
      return "SRX-R 600/30-120";
    case "46":
      return "EG-600";
    default:
      return "Unknown";
  }
};

export default serialToModel;
