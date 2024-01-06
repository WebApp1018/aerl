#how-to #reference
# LEDs Validation and Test Procedure

## Setup

You have:

1. A hub with SoM installed, programmed and up to date.

## Test

1. SSH into the device.
2. Run the below script to flash all of the LEDs on the board.


```
while true; do
  gpioset gpiochip0 8=0
  sleep 0.1
  gpioset gpiochip0 8=1
  sleep 0.1
done
```
