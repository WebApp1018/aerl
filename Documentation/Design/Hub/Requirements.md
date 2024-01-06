#explanation #reference

# Functional

1. Real-Time-Clock
    - The device shall feature a battery backed RTC with a service life of 10 years from manufacture.
2. WiFi Connectivity
    - The device shall feature dual-band WiFi.
3. LTE/4G Cellular Connectivity
    - The device shall feature 4G capable LTE connectivity.

# Performance

1. CPU Concurrency
    - The device shall feature an applications processor with at least 2 multi-processing cores.
1. Startup Time
    - From power-on to first telemetry packet shall be less than 30 seconds under normal operation conditions.
2. Internal Storage
    - The device shall contain at least 16GiB of flash storage.
    - This gives ample storage for buffering telemetry locally and storing software updates.
3. ESD/Surge Protection
    - Externally accessible contacts/connections/ports of the device shall be protected against over-voltage from ESD/surge events.
        - Where ESD protection is not naturally provided by the interface (e.g. Ethernet is an exception).
4. Operating Temperature
    - Under nominal operation, the applications processor core and flash storage temperature shall not rise more than 40degC above ambient.

# Interface

1. WiFi External Antenna
    - The device enclosure shall feature a female SMA connector.
        - The enclosure design should include "knock-out" style holes for the optional installation for this connector.
2. LTE External Antenna
    - The device enclosure shall feature a female SMA connector on cellular enabled SKUs.
        - The enclosure design should include "knock-out" style holes for the optional installation for this connector.
3. GPS External Antenna
    - The device enclosure shall feature a female SMA connector on cellular enabled SKUs.
        - The enclosure design should include "knock-out" style holes for the optional installation for this connector.
3. Ethernet
    - The device shall feature two ethernet connections capable of up to 100MBit/s data rates.
        - The 100MBit/s data rate is acceptable as we will require performance to be acceptable over LTE which is often slower.
6. Expandable Mass Storage
    - The device shall feature a microSD card connector to accept expandable storage.
        - The card connector must use a normally-open (NO) configuration for the card-detect contacts to maintain compatibility with development boards.
7. CAN Bus
    - The device shall feature two CAN-FD interfaces capable of bitrates up to 1MB/s
8. Modbus
    - The device shall feature a Modbus interface capable of data rates up to 15200 baud.
9. Isolated Signal Relay Outputs
    - The device shall feature two signal relay outputs.
        - Each relay output should be capable of driving a 2A load.
    - Each relay output shall feature an externally visible state indication LED.
10. Isolated Digital Inputs
    - The device shall feature two digital inputs.

# Operational

1. Power-on-Reset Visibility
    - A reset of the applications processor must be clear and visible in device telemetry.

# Safety

1. Relay Safe State
    - When power is removed from the hub, or a reset is triggered the output relays should default to a well defined state within a timely manner.
2. Isolated DC Input
    - The DC input shall be galvanically isolated from the grounded low-voltage components.
        - This is due to the PV-to-battery regulation typically not being isolated.
