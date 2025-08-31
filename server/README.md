# Compile

## x86-64

```
rustup target add x86_64-unknown-linux-musl

RUSTFLAGS="-C target-feature=+crt-static" cargo build --release --target x86_64-unknown-linux-musl
upx --best --lzma target/x86_64-unknown-linux-musl/release/ccim-server
```

## armv8

```
rustup target add aarch64-unknown-linux-musl

RUSTFLAGS="-C target-feature=+crt-static" cargo build --release --target aarch64-unknown-linux-musl
upx --best --lzma target/aarch64-unknown-linux-musl/release/ccim-server
```
