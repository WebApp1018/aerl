#how-to #reference
# SD Card Validation and Test Procedure

## Setup

You have:

1. A hub with SoM installed, programmed and up to date.
2. A newly formatted micro SD card inserted into the slot.

## Test

1. SSH into the device.
2. Run `lsblk` to look for the partition of the SD card.
3. Run `mkdir /mnt/test` to create a mount point.
4. Run `mount /dev/mmcblk1p1 /mnt/test` to mount the partition to the mount point.
5. Run `sync && dd if=/dev/random of=/mnt/test/test.tmp bs=100M count=1 oflag=dsync && sync` to test the write speed.
6. Run `sync && dd if=/mnt/test/test.tmp of=/dev/null bs=100M count=1 iflag=dsync && sync`


## Example Results

### Write Performance

```
104857600 bytes (105 MB, 100 MiB) copied, 7.44128 s, 14.1 MB/s
```

This appears slow compared to read performance but is expected.

### Read Performance

```
104857600 bytes (105 MB, 100 MiB) copied, 0.100722 s, 1.0 GB/s
```
