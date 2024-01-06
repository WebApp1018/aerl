FROM rust:1.72-bullseye as builder

# Install dependencies
RUN apt-get update
RUN apt-get install -y pkg-config libssl-dev protobuf-compiler

WORKDIR /usr/src/app
COPY . .
# Will build and cache the binary and dependent crates in release mode
RUN --mount=type=cache,target=/usr/local/cargo,from=rust:latest,source=/usr/local/cargo \
    --mount=type=cache,target=target \
    cargo build --release && mv ./target/release/cnsmr ./cnsmr

# Runtime image
FROM debian:bullseye-slim

# Update certificcates (fixes rustls)
RUN apt-get update && apt-get install -y \
    ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Run as "app" user
RUN useradd -ms /bin/bash app

USER app
WORKDIR /app

# Get compiled binaries from builder's cargo install directory
COPY --from=builder /usr/src/app/cnsmr /app/cnsmr

# Run the app
CMD ./cnsmr
