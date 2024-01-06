#explanation
# Overview
Some customers would like to access other devices in their system securely without exposing them to the internet. Naturally a VPN is a good solution to this problem but it requires a separate gateway device to be installed, increasing the complexity of the system.

Our solution is to provide a managed virtual Tailscale node that can be configured to run on any device and accessed like it were a gateway.

# Stakeholder Expectations

## Needs, Goals and Objectives
- Securely connect to devices on a remote local network.
- Remote VPN configuration/setup via AERL Cloud platform command and control.
- Any failure of the customer VPN does not effect the availability of the infrastructure VPN connection.

## Constraints
- A slow or unstable internet connection is likely and may interrupt connectivity intermittently.

# Design

Tailscale is chosen because:
- It is built on WireGuard, a modern, secure VPN tunnel.
- Its mesh multipoint routing reduces connection latency.
- Requires no specific infrastructure to be maintained by AERL.
- Is already in use for internal access to devices in the field.
- It offers a variety of deployment methods.

# Requirements
- Configuration is made via the Cloud web portal.
- Failure of the customer Tailscale node doesn't cascade failure to our internal Tailscale node.
- A device re-registered to a new organization does not maintain its old connection.

# References
- [How Tailscale Works](https://tailscale.com/blog/how-tailscale-works/)
