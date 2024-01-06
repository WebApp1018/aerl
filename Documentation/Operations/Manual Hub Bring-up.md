#how-to

```shell
# Add the repository
echo "deb https://pkgs.aerl.cloud stable main" | sudo tee /etc/apt/sources.list.d/aerl-hub.list

# Add the signing key
curl -fsSL https://pkgs.aerl.cloud/dists/stable/Release.noarmor.gpg | sudo tee  /etc/apt/trusted.gpg.d/aerl-archive-keyring.gpg >/dev/null

# Install hubd
sudo apt-get update
sudo apt-get install hubd

# Get the machine id and machine key from this file.
# Remember to SHA256 hash the machine key
cat /var/lib/hubd/hubd.state
```
