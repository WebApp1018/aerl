# Hub Setup Procedure

## Install Debian Linux

### Boot into the bootloader and mount the internal flash

1. Connect the USB-C to your computer and the UART debug port to a serial adaptor.
2. Open the serial port (e.g. `screen /dev/ttyUSB0 115200`)
3. When the prompt appears, run `ums 0 mmc 0` to mount the internal mmc as a USB storage device.

Then you can use your favourite image writing tool to write the linux image.

## Change hostname

1. Edit `/etc/hostname`
2. Reboot.

## Install tailscale

```
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up --ssh
```

- Go to the admin console and disable key expiry.

## Add new device tree

1. Copy dts file to device.
2. Install dtc `sudo apt-get install -y device-tree-compiler`
2. Compile device tree to `dtc -O dtb -o imx93-var-som-symphony.dtb imx93-var-som-symphony.dts`.
3. Reboot.

## Install `hubd`

```shell
echo "deb https://pkgs.aerl.cloud stable main" | sudo tee /etc/apt/sources.list.d/aerl-hub.list
curl -fsSL https://pkgs.aerl.cloud/dists/stable/Release.noarmor.gpg | sudo tee  /etc/apt/trusted.gpg.d/aerl-archive-keyring.gpg >/dev/null
sudo apt-get update
sudo apt-get install -y hubd
```
