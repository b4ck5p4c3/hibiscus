import { z } from 'zod'

/**
 * Connection status of a client for a DHCP lease.
 */
export enum OpnsenseLeaseStatus {
  Offline = 'offline',
  Online = 'online',
}

/**
 * Type of a DHCP lease.
 */
export enum OpnsenseLeaseType {
  Dynamic = 'dynamic',
  Static = 'static',
}

/**
 * DHCP lease information.
 */
export const OpnsenseLeaseSchema = z.object({
  address: z.string().ip(),
  binding: z.string().optional(),
  'client-hostname': z.string().optional(),
  cltt: z.number().optional(),
  descr: z.string().optional(),
  ends: z.string().optional(),
  hostname: z.string().optional(),
  if: z.string().nonempty(),
  if_descr: z.string().nonempty(),
  mac: z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/),
  man: z.string().optional(),
  starts: z.string().optional(),
  status: z.nativeEnum(OpnsenseLeaseStatus),
  tstp: z.number().optional(),
  type: z.nativeEnum(OpnsenseLeaseType),
  uid: z.string().optional(),
})

/**
 * Opnsense API response for the searchLease endpoint.
 */
export const Dhcpv4SearchLeaseResponseSchema = z.object({
  current: z.number(),
  interfaces: z.record(z.string()),
  rowCount: z.number(),
  rows: z.preprocess((leases, context) => {
    if (!Array.isArray(leases)) {
      context.addIssue({
        code: z.ZodIssueCode.invalid_type,
        expected: 'array',
        fatal: true,
        received: typeof leases,
      })

      return []
    }

    const result: z.infer<typeof OpnsenseLeaseSchema>[] = []
    for (const lease of leases) {
      const parsed = OpnsenseLeaseSchema.safeParse(lease)
      if (parsed.success) {
        result.push(parsed.data)
      }
    }

    return result
  }, OpnsenseLeaseSchema.array()),
  total: z.number(),
})

export type OpnsenseLease = z.infer<typeof OpnsenseLeaseSchema>
export type Dhcpv4SearchLeaseResponse = z.infer<typeof Dhcpv4SearchLeaseResponseSchema>
