# Velocity — Self-hosted Internet Speed Test

A polished, responsive Ookla-inspired web app with real network testing. No paid services or npm dependencies needed.

## Requirements
- Node.js 18 or newer
- A server with sufficient bandwidth (VPS recommended for publicly meaningful results)

## Run locally

```bash
cd velocity-speedtest
npm start
```
Open http://localhost:3000 on your browser.

**Important:** If you test on the same computer running the server, you are measuring loopback/local networking, **not your ISP internet speed**. To test internet performance, deploy to a remote VPS and open its publicly accessible address on the client device. A server on your home LAN tests LAN capacity, not necessarily the WAN.

## Deploy to a VPS
1. Copy this folder to your Ubuntu/Linux VPS.
2. Install Node 18+.
3. Run `PORT=3000 SERVER_NAME='My Speed Server' node server.js`.
4. Allow the port through the firewall, or preferably set up a reverse proxy (Caddy / nginx) with HTTPS.
5. For production, put the Node process under systemd or a process manager and add rate limiting and traffic quotas at the reverse proxy.

## What it tests
- HTTP round-trip latency (12 requests; trimmed mean)
- Jitter (average consecutive HTTP RTT difference)
- Download and upload (real binary transfers, measured in decimal megabits/second)
- CSV export

## Limitations
- This is an MVP, **not** Ookla's official measurement algorithm.
- It uses sequential transfers, so extreme gigabit connections may be underreported; multiple parallel streams and more robust adaptive testing are next steps.
- HTTP RTT is **not** ICMP ping, and packet loss is **not** measured.
- Results depend on testing-server CPU/network bandwidth and proximity.
- Public deployments need bandwidth planning, abuse protection, privacy policy, and logging controls.
- No ISP lookup or geolocation is included.

## Security basics
- Download max 128 MiB per request, upload max 128 MiB per request.
- Protect public endpoints with proxy-side rate limiting and bandwidth allowances.
- Uses random binary sample bytes for download. No user files are uploaded.
