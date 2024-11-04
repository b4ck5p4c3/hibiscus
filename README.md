# Hibiscus

Hibiscus is a small Node.js daemon. It exports static DHCP leases from a OPNSense
firewall and exports them as a RFC 1035 compliant DNS zone file.

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

### Development

For local development, you will need Node.js 22 or later, and pnpm.

```sh
# Clone repo
git clone https://github.com/b4ck5p4c3/hibiscus
cd hibiscus

# Install dependencies
pnpm install

# Copy & adjust example configuration
cp .env.example .env

# Test
pnpm run dev
```
