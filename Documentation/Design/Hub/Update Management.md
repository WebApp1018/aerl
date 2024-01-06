Whilst `hubd` is distributed via a package repository, automating updates via the `unattended-upgrades` upgrades package is not desirable for our use case.

# Constraints

- Data usage for devices on a mobile connection (Starlink, LTE, etc).
- Downtime caused by upgrades to system daemons that need to be restarted.

# Solution

`hubd` orchestrated package updates.