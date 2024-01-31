@echo off

REM Determine the system architecture (32-bit or 64-bit)
set "arch=x64"
if "%PROCESSOR_ARCHITECTURE%"=="x86" set "arch=x86"
if "%PROCESSOR_ARCHITEW6432%"=="AMD64" set "arch=x64"

REM Set the download URL based on the architecture
set "download_url="
if "%arch%"=="x86" (
    set "download_url=https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-386.exe"
) else (
    set "download_url=https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
)

REM Download cloudflared binary
echo Downloading cloudflared binary...
curl -L -o cloudflared/bin/cloudflared.exe %download_url%
