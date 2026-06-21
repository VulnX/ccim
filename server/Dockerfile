FROM rust:1.94-slim AS builder
RUN apt-get update && apt-get install -y musl-tools build-essential && rm -rf /var/lib/apt/lists/*
RUN rustup target add x86_64-unknown-linux-musl
WORKDIR /app
COPY . .
ENV RUSTFLAGS="-C target-feature=+crt-static"
RUN cargo build --release --target x86_64-unknown-linux-musl

FROM scratch
WORKDIR /app
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/ccim-server ./server

EXPOSE 8080
ENTRYPOINT ["./server"]
