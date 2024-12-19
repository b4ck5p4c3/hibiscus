import { type AbstractZone, type DefaultZone, type ReverseZone, ZoneType } from '@/parser/interface'
import { LeaseType } from '@/providers/interface'
import { describe, expect, test } from 'bun:test'

import { Zonefile } from '.'

const ZONE_TEMPLATE: AbstractZone = {
  domain: 'example.com.',
  interface: 'internal',
  key: 'INT',
  origin: 'example.com',
  outFile: '/tmp/zonefile',
  soa: {
    nameServers: ['ns1.example.com.'],
    person: 'hostmaster.example.com.',
    primaryNs: 'ns1.example.com.',
  },
  staticOnly: false,
  ttl: 300,
  type: ZoneType.Default as ZoneType,
}

describe('Zonefile', () => {
  test('replaceSerial', () => {
    expect(Zonefile['replaceSerial']('300   ; Serial', '1000223344')).toBe('1000223344  ; Serial')
    expect(Zonefile['replaceSerial']('1111223300 ; Serial', '1000223344')).toBe('1000223344  ; Serial')
    expect(Zonefile['replaceSerial']('300123 ; Serial', '1000223344')).toBe('1000223344  ; Serial')
  })

  test('toString', () => {
    const zone: DefaultZone = {
      ...structuredClone(ZONE_TEMPLATE),
      records: {
        hostname: true,
        mac: true,
      },
      type: ZoneType.Default,
    }
    const zonefile = new Zonefile(zone)

    zonefile.setLeases([
      { hostname: 'server1', interface: 'internal', ipv4: '10.0.0.1', mac: 'AA:BB:CC:DD:EE:FF', type: LeaseType.Static },
    ])

    const contents = zonefile.toString('1000223344')
    expect(contents).toContain('@   IN  SOA   ns1.example.com. hostmaster.example.com.')
    expect(contents).toContain('1000223344  ; Serial')
    expect(contents).toContain('server1            IN  A  10.0.0.1')
    expect(contents).toContain('aa-bb-cc-dd-ee-ff  IN  A  10.0.0.1')
  })

  test('PTR', () => {
    const zone: ReverseZone = {
      ...structuredClone(ZONE_TEMPLATE),
      ptrSubnet: '10.0.',
      type: ZoneType.RDNS,
    }

    const zonefile = new Zonefile(zone)
    zonefile.setLeases([
      { hostname: 'server1', interface: 'internal', ipv4: '10.0.0.1', mac: '00:11:22:33:44:51', type: LeaseType.Dynamic },
      { hostname: 'server2', interface: 'internal', ipv4: '10.0.0.4', mac: '00:11:22:33:44:52', type: LeaseType.Dynamic },
      { hostname: 'server3', interface: 'internal', ipv4: '172.16.0.1', mac: '00:11:22:33:44:53', type: LeaseType.Dynamic },
    ])

    expect(zonefile.records.map(r => r.name)).toEqual(['1.0', '4.0'])
  })

  describe('ambiguity resolver', () => {
    test('prefers static over dynamic', () => {
      const zone: DefaultZone = {
        ...structuredClone(ZONE_TEMPLATE),
        records: {
          hostname: true,
          mac: true,
        },
        type: ZoneType.Default,
      }
      const zonefile = new Zonefile(zone)

      zonefile.setLeases([
        { hostname: 'server1', interface: 'internal', ipv4: '10.0.0.1', mac: 'AA:BB:CC:DD:EE:FF', type: LeaseType.Static },
        { hostname: 'server1', interface: 'internal', ipv4: '10.0.0.2', mac: 'AA:BB:CC:DD:EE:FF', type: LeaseType.Dynamic },
      ])

      expect(zonefile.records.map(r => r.value)).toEqual(['10.0.0.1', '10.0.0.1'])
    })

    test('skips ambiguous hostnames', () => {
      const zone: DefaultZone = {
        ...structuredClone(ZONE_TEMPLATE),
        records: {
          hostname: true,
          mac: false,
        },
        type: ZoneType.Default,
      }
      const zonefile = new Zonefile(zone)

      zonefile.setLeases([
        { hostname: 'server1', interface: 'internal', ipv4: '10.0.0.1', mac: 'AA:BB:CC:DD:EE:FF', type: LeaseType.Dynamic },
        { hostname: 'server1', interface: 'internal', ipv4: '10.0.0.2', mac: 'AA:BB:CC:DD:EE:FF', type: LeaseType.Dynamic },
      ])

      expect(zonefile.records).toHaveLength(0)
    })

    test('resolves ambiguous leases for a single MAC', () => {
      const zone: DefaultZone = {
        ...structuredClone(ZONE_TEMPLATE),
        records: {
          hostname: false,
          mac: true,
        },
        type: ZoneType.Default,
      }
      const zonefile = new Zonefile(zone)

      zonefile.setLeases([
        { hostname: 'server1', interface: 'internal', ipv4: '10.0.0.1', mac: 'AA:BB:CC:DD:EE:FF', type: LeaseType.Static },
        { hostname: 'server1', interface: 'internal', ipv4: '10.0.0.2', mac: 'AA:BB:CC:DD:EE:FF', type: LeaseType.Static },
        { hostname: 'server1', interface: 'internal', ipv4: '10.0.0.3', mac: 'AA:BB:CC:DD:EE:FF', type: LeaseType.Dynamic },
      ])

      expect(zonefile.records.map(r => r.value)).not.toContain('10.0.0.3')
    })

    test('resolves ambiguous leases for a single hostname', () => {
      const zone: DefaultZone = {
        ...structuredClone(ZONE_TEMPLATE),
        records: {
          hostname: true,
          mac: false,
        },
        type: ZoneType.Default,
      }
      const zonefile = new Zonefile(zone)

      // Multiple static leases should be ignored
      zonefile.setLeases([
        { hostname: 'server1', interface: 'internal', ipv4: '10.0.0.1', mac: 'AA:BB:CC:DD:EE:F1', type: LeaseType.Static },
        { hostname: 'server1', interface: 'internal', ipv4: '10.0.0.2', mac: 'AA:BB:CC:DD:EE:F2', type: LeaseType.Static },
        { hostname: 'server1', interface: 'internal', ipv4: '10.0.0.3', mac: 'AA:BB:CC:DD:EE:F2', type: LeaseType.Dynamic },
      ])
      expect(zonefile.records).toHaveLength(0)

      // Multiple dynamic leases should be ignored
      zonefile.setLeases([
        { hostname: 'server1', interface: 'internal', ipv4: '10.0.0.1', mac: 'AA:BB:CC:DD:EE:F1', type: LeaseType.Dynamic },
        { hostname: 'server1', interface: 'internal', ipv4: '10.0.0.2', mac: 'AA:BB:CC:DD:EE:F2', type: LeaseType.Dynamic },
      ])
      expect(zonefile.records).toHaveLength(0)
    })
  })
})
