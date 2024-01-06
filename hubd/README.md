# Deployable Telemetry Agent (hubd)

This is a device agent designed to be deployed onto embedded devices in the
field. It is packaged and deployed as a Debian archive.

## Development

To run the application with some log messages being emitted:

```shell
RUST_LOG=info cargo run -- --state-path=./
```

To build on MacOS or Windows, use the `--no-default-features` flag to disable the canbus module as it relies on SocketCAN (part of the Linux kernel).

### Cross Compilation

```shell
# install the cross compilation helper tool
cargo install cross
# if on macOS, run the following to fix a bug in version cross 0.2.5
export CROSS_CONTAINER_OPTS="--platform linux/amd64"
# build the project for a given target
cross build --release --target=aarch64-unknown-linux-musl
```

### Creating a Debian package

```shell
# cross-build for release
cross build --release --target=aarch64-unknown-linux-musl
# package up
cross deb --no-build  --target=aarch64-unknown-linux-musl
```

Taking a long time to build? Check what CPU resource limits your docker daemon has set. On macOS they can be quite low.

### Compiling device tree

```shell
dtc -O dtb -o imx93-var-som-symphony.dtb imx93-var-som-symphony.dts
```
