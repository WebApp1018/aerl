#how-to #reference
# Bluetooth Validation and Test Procedure

## Setup

You have:

1. A hub with SoM installed, programmed and up to date.
2. A given WiFi.Bluetooth antenna attached to the SoM.

## Test

1. SSH into the device.
2. Run `bluetoothctl -- discoverable on` and observe which APs are visible and at what strength.
3. Check the device is visible on a phone or laptop. The name will be the hostname of the hub.
3. Run `bluetoothctl -- discoverable off` to hide the bluetooth device again.
4. Run `bluetoothctl -- scan` to see other devices.

## Example Results

### Scan result

```
Discovery started
[CHG] Controller C0:EE:40:AE:4C:A0 Discovering: yes
[NEW] Device 65:08:96:19:2F:9F 65-08-96-19-2F-9F
[NEW] Device 67:43:CE:2B:A8:0E 67-43-CE-2B-A8-0E
[NEW] Device 0B:F5:E5:39:5B:81 0B-F5-E5-39-5B-81
[NEW] Device 5A:26:33:98:37:B6 5A-26-33-98-37-B6
[NEW] Device 2F:19:20:B6:F8:63 2F-19-20-B6-F8-63
[NEW] Device 7C:96:1F:C6:70:8E 7C-96-1F-C6-70-8E
[NEW] Device 4E:06:28:53:CB:D8 4E-06-28-53-CB-D8
[NEW] Device 59:99:DD:59:87:97 59-99-DD-59-87-97
[NEW] Device 67:9C:92:A8:EF:D4 67-9C-92-A8-EF-D4
```
