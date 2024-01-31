#!/bin/bash

# Determine the system architecture
arch=$(uname -m)

# Set the download URL based on the architecture
download_url=""
if [ "$arch" = "x86_64" ]; then
    download_url="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
elif [ "$arch" = "i386" ]; then
    download_url="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-386"
elif [ "$arch" = "armv6l" ]; then
    download_url="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm"
elif [ "$arch" = "aarch64" ]; then
    download_url="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
elif [ "$(uname)" = "Darwin" ]; then
    download_url="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz"
fi

# Download cloudflared binary
if [ ! -z "$download_url" ]; then
    echo "Downloading cloudflared binary..."
    curl -L -o cloudflared/bin/cloudflared $download_url

    # If on macOS, extract and rename the binary
    if [ "$(uname)" = "Darwin" ]; then
        tar -xzf cloudflared/bin/cloudflared -C cloudflared/bin/ --strip-components 1
        mv cloudflared/bin/cloudflared cloudflared/bin/maccloudflared
    fi
else
    echo "Unsupported architecture: $arch"
fi
