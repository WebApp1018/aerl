# Pinout and Connectivity

## Power Input

| Pin | Function |
| --- | --- |
| 1 | 18-60V Input |
| 2 | Ground |

Notes:
1. The power input is galvanically isolated.

## CAN Bus

| Pin | Function |
| --- | --- |
| 4 | CAN Bus High |
| 5 | CAN Bus Low |
| 6 | Ground |

The CAN Bus connections support CAN FD (ISO 11898-1) with a data rate up to 5Mbps.

Notes:
1. Each CAN Bus connection is galvanically isolated.
2. Each CAN Bus connection has a permanent 120Ω termination.
3. All other pins are not connected.

## Modbus

| Pin | Function |
| --- | --- |
| 1 | Ground |
| 2 | Ground |
| 3 | RS485 A |
| 4 | Ground |
| 5 | Ground |
| 6 | RS485 B |
| 7 | Ground |
| 8 | Ground |

Notes:
1. Each Modbus connection is galvanically isolated.

## I/O

| Pin | Function |
| --- | --- |
| 1 | Relay 1+ |
| 2 | Relay 1- |
| 3 | Relay 2+ |
| 4 | Relay 2- |
| 5 | Digital Out 1 |
| 6 | Isolated Ground |
| 7 | Digital Out 2 |
| 8 | Isolated Ground |
| 9 | Digital In 1 |
| 10 | Isolated Ground |
| 11 | Digital In 2 |
| 12 | Isolated Ground |

Notes:
1. Each relay is fused at 3A with a non-resettable fuse.
2. The maximum voltage for each relay is 30VDC and 250VAC.
3. Each digital output is fused with a 1A non-resettable fuse.
3. The maximum voltage for each digital input is 30VDC.
