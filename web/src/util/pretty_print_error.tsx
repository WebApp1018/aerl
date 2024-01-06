/**
  Convert error code to description string.
*/
export default function prettyPrintError(errorCode: string): string | null {
  const firstUnderscoreIndex = errorCode.indexOf("_");
  const secondUnderscoreIndex = errorCode.indexOf(
    "_",
    firstUnderscoreIndex + 1
  );

  if (firstUnderscoreIndex === -1) {
    // Return the original string if there is no underscore
    return null;
  }

  const deviceType = errorCode.substring(0, secondUnderscoreIndex);
  const errorFlag = errorCode.substring(
    secondUnderscoreIndex + 1,
    errorCode.length
  );

  switch (deviceType) {
    case "aerl_srx":
      return aerlSRXError(errorFlag);
    // Add other models here when needed
    default:
      return null;
  }
}

/**
  Convert an error flag to an error description.
*/
function aerlSRXError(flagCode: string): string | null {
  switch (flagCode) {
    case "flag_hardware_fault_generic":
      return "Hardware Fault (Generic) (-1)";
    case "flag_no_config_data":
      return "No Configuration Data Set (-26)";
    case "flag_config_data_out_of_range":
      return "Config Data Out of Range (-29)";
    case "flag_battery_sense_lost":
      return "Battery Sense Lost (-1159)";
    case "flag_can_master_lost":
      return "CAN Master Lost (-1303)";
    case "flag_vin_low_fault":
      return "Input Voltage Low (-1153)";
    case "flag_vout_low_fault":
      return "Output Voltage Low (-1151)";
    case "flag_vout_high_fault":
      return "Output Voltage High (-1154)";
    case "flag_vin_high_fault":
      return "Input Voltage High (-1152)";
    case "flag_over_temp_fault":
      return "Max Output Temp (-1100)";
    case "flag_active_cooling_fault":
      return "Fan Error (-1050)";
    case "flag_iout_high_fault":
      return "Output Current High (-1157)";
    case "flag_iin_high_fault":
      return "Input Current Too high (-1156)";
    case "flag_cross_check_fault":
      return "Crosscheck Failed (-400)";
    case "flag_temp_sensor_timeout":
      return "Temp Sensor Unresponsive (-1055)";
    case "flag_earth_fault":
      return "Earth Fault (-1400)";
    case "flag_no_output_fault":
      return "No Output Detected (-360)";
    case "flag_low_bat_temp_cutoff":
      return "Low Battery Temp (-1103)";
    case "flag_high_bat_temp_cutoff":
      return "High Battery Temp (-1102)";
    case "flag_current_flow_disrupted":
      return "Charging Interrupted (-1162)";
    case "flag_pre_charge_failure":
      return "Pre-charge Failure (-380)";
    default:
      return null; // Error code not found
  }
}
