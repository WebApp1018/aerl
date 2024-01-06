#how-to #reference
## Setup

You have:

1. A hub with SoM installed, programmed and up to date.
2. A power supply proving power to the USB port or 5V rail directly.

## Test

1. SSH into the device.
2. Run `cat /sys/bus/iio/devices/iio\:device0/in_voltage0_raw` to get a reading.


## Example Results

## Voltage Divider Ratio

```
4.7 / (10 + 4.7) = 0.319
```

```
Vin @ 5.000V = 3356 / 4096 = 0.819
Vin @ 4.900V = 3281 / 4096 = 0.801
Vin @ 4.800V = 3210 / 4096 = 0.783
Vin @ 4.700V = 3135 / 4096 = 0.765
Vin @ 4.600V = 3059 / 4096 = 0.746
Vin @ 4.500V = 2986 / 4096 = 0.729
```