#how-to
# Process

0. Pre-built OS Image is loaded onto EMMC.
1. Device boots for the first time.
2. Bridge internet connection from host to hub device.
3. SSH connection is made to the device and:
	1. Software is loaded.
	2. It is added to the Tailscale network.
	3. It is added to the asset management database.

Once it has pushed its first data to the cloud it has passed integration testing and is ready to ship.

# Tools

Ansible is used to run install scripts on the host, taking the base OS image, installing our software and configuring the factory settings.

# Hostname Allocation

This makes individual hub devices easily 

`hub-<serial-no>`
e.g. `hub-9200123`
