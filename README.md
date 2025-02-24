# Hibiscus

[![Made with Bun](https://img.shields.io/badge/Made%20with%20Bun-f471b5?logo=bun&style=for-the-badge)](https://bun.sh)

Hibiscus exports DHCPv4 leases from OPNsense to RFC1035-compliant zone files.

## Setup

### OPNsense API

You'll need an API token to access DHCP leases in OPNsense.

1. Log in to your OPNsense firewall.
2. Go to `System` -> `Access` -> `Users`.
3. Create a new user. Do not set any permissions yet, but check a `Generate a scrambled password` box.
4. Edit the user, and set `Effective Privileges` to `Status: DHCP leases` and `Status: DHCPv6 leases`.
5. Save the user.
6. On the same page, create a new API key for that user. It'll automatically download a credentials file.

### Production

Use `docker-compose` to run Hibiscus in production.
Please check the [example configuration](docker-compose.yml) for more information.

See [.env.example](.env.example) for a full list of configuration options.

### Development

For local development, you will need Bun.

```sh
# Install Bun if not yet
curl -fsSL https://bun.sh/install | bash

# Clone repo
git clone https://github.com/b4ck5p4c3/hibiscus
cd hibiscus

# Install deps
bun install

# Copy & adjust example configuration
cp .env.example .env

# Go!
bun run dev
```
