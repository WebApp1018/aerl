#explanation 

# Schema Storage

Unlike CAN Bus, Modbus does not have a common way of storing the register mappings. To store this information, we have developed an interface definition format that allows register maps and other Modbus device information to be represented as a JSON file.

The JSON Schema definition for this format is included in the hubd project.

### Example

```json
{
	"metadata": {
		"manufacturer": "aerl",
		"product": "srx",
		"revision": "39",
	},
	"defaults": {
		"slave_id": 20,
		"baud_rate": 9600,
	},
	"registers": [
		{ "address": 10001, "name": "generic_hardware_fault" },
		{ "address": 10002, "name": "device_not_configured" }
	]
}
```

# Metric Series Representation

From the JSON schema above, we transform registers into individual series using a combination of properties. The resulting series follow our [metric series naming convention](Metric Series Naming Convention.md).

