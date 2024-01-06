#how-to 

```
# Get serial number
cat /sys/bus/soc/devices/soc0/serial_number
# Get SoC identifier
cat /sys/bus/soc/devices/soc0/soc_id
# Get revision
cat /sys/bus/soc/devices/soc0/revision
```

# Example Hub Metadata

```
{
  "hardware": {
    "pcb": {
      "revision": "xxxyyy"
    },
    "som": {
      "serial_number": "xxxyyy",
      "revision": "xxxyyy",
      "soc_id": "xxxyyy"
    }
  }
}
```