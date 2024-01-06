#how-to #reference
# WiFi Validation and Test Procedure

## Setup

You have:

1. A hub with SoM installed, programmed and up to date.
2. A given WiFi antenna attached to the SoM.

## Test

1. SSH into the device.
2. Run `nmcli dev wifi` and observe which APs are visible and at what strength.


## Example Results

### `nmcli dev wifi` Without Antenna

```
IN-USE  BSSID              SSID                  MODE   CHAN  RATE        SIGNAL  BARS  SECURITY
        A6:C9:EB:E2:8B:3F  recharge              Infra  157   270 Mbit/s  74      ▂▄▆_  WPA2
        A2:C9:EB:E2:8B:3F  AERL                  Infra  157   270 Mbit/s  59      ▂▄▆_  WPA2
        9C:C9:EB:E2:8B:3F  --                    Infra  157   270 Mbit/s  59      ▂▄▆_  WPA2
...
```

### `nmcli dev wifi` With Molex 146153 Antenna

```
IN-USE  BSSID              SSID                  MODE   CHAN  RATE        SIGNAL  BARS  SECURITY
        A2:C9:EB:E2:8B:3E  AERL                  Infra  3     130 Mbit/s  100     ▂▄▆█  WPA2
        A2:C9:EB:E2:8B:3F  AERL                  Infra  157   270 Mbit/s  100     ▂▄▆█  WPA2
        A6:C9:EB:E2:8B:3F  recharge              Infra  157   270 Mbit/s  100     ▂▄▆█  WPA2
        9C:C9:EB:E2:8B:3F  --                    Infra  157   270 Mbit/s  100     ▂▄▆█  WPA2
...
```
