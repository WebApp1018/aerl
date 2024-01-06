#explanation 

The goal is that we normalise every ingested data point into well-defined structured series names. This means both Modbus and CAN bus telemetry is identical once it is ingested into the TSDB.

# Series Name

Otherwise known as the `__name__` label.

```
<oem>_<product>_<group>_<message>

examples
aerl_srx_output_current
aerl_srx_input_voltage
cet_bravo_line_power
```

# Labels

## `interface`

Contains the interface type and identifier as a colon separated path.

Examples:
- `canbus,iface,can0` - a SocketCAN device.
- `canbus,ser,ttyUSB0` - a CAN over serial (SLCAN) interface.
- `modbus,rtu,ttyUSB1` - a Modbus RTU (serial) interface.
- `modbus,tcp,192.168.0.1:502` - a Modbus TCP/IP interface.

As of writing, only SocketCAN and Modbus RTU is implemented.

## `canbus_device_id`

Used to identify a unique device across multiple messages. On startup the SRX and EarthGuard devices will use the id 62 until they self-assign a device starting from 10 based on what other devices they see on the network.

## `modbus_slave_id`

Used to identify a unique modbus device on the network. This is set in the device configuration and should not change between restarts. The default for the SRX devices is 20.
