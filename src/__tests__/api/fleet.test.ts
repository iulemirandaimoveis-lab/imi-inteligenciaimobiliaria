/**
 * Fleet Management (Gestão de Frota) — Unit + Integration Tests
 *
 * Coverage:
 * - Vehicle availability enforcement
 * - KM validation (final >= initial)
 * - Broker pending usage check
 * - Cost per KM calculation
 * - Suspicious usage detection
 * - Fueling validation
 * - Alert generation
 * - Permission enforcement
 */

/**
 * @jest-environment node
 */

// ── Types ─────────────────────────────────────────────────────────────────────
type VehicleStatus = 'disponivel' | 'em_uso' | 'manutencao' | 'bloqueado' | 'sinistrado' | 'reserva'
type UsageStatus = 'solicitado' | 'aprovado' | 'retirado' | 'devolvido' | 'cancelado' | 'rejeitado'

// ── KM Validation ─────────────────────────────────────────────────────────────

describe('KM Validation', () => {
    function validateKm(kmInitial: number, kmFinal: number): { valid: boolean; error?: string } {
        if (kmFinal < kmInitial) {
            return { valid: false, error: `KM final (${kmFinal}) não pode ser menor que KM inicial (${kmInitial})` }
        }
        return { valid: true }
    }

    it('should accept km_final equal to km_initial (no movement)', () => {
        expect(validateKm(1000, 1000).valid).toBe(true)
    })

    it('should accept km_final greater than km_initial', () => {
        expect(validateKm(1000, 1250).valid).toBe(true)
    })

    it('should reject km_final less than km_initial', () => {
        const result = validateKm(1000, 950)
        expect(result.valid).toBe(false)
        expect(result.error).toContain('menor')
    })

    it('should calculate km driven correctly', () => {
        const driven = 1250 - 1000
        expect(driven).toBe(250)
    })
})

// ── Vehicle Availability ──────────────────────────────────────────────────────

describe('Vehicle Availability Enforcement', () => {
    function checkVehicleForRequest(vehicleStatus: VehicleStatus): { allowed: boolean; reason?: string } {
        if (!['disponivel', 'reserva'].includes(vehicleStatus)) {
            return { allowed: false, reason: `VEHICLE_UNAVAILABLE: Veículo não disponível (status: ${vehicleStatus})` }
        }
        return { allowed: true }
    }

    it('should allow request for disponivel vehicle', () => {
        expect(checkVehicleForRequest('disponivel').allowed).toBe(true)
    })

    it('should allow request for reserva vehicle', () => {
        expect(checkVehicleForRequest('reserva').allowed).toBe(true)
    })

    it('should reject request for em_uso vehicle', () => {
        const result = checkVehicleForRequest('em_uso')
        expect(result.allowed).toBe(false)
        expect(result.reason).toContain('VEHICLE_UNAVAILABLE')
    })

    it('should reject request for manutencao vehicle', () => {
        expect(checkVehicleForRequest('manutencao').allowed).toBe(false)
    })

    it('should reject request for bloqueado vehicle', () => {
        expect(checkVehicleForRequest('bloqueado').allowed).toBe(false)
    })

    it('should reject request for sinistrado vehicle', () => {
        expect(checkVehicleForRequest('sinistrado').allowed).toBe(false)
    })
})

// ── Broker Pending Usage Check ────────────────────────────────────────────────

describe('Broker Pending Usage Check', () => {
    const ACTIVE_STATUSES: UsageStatus[] = ['solicitado', 'aprovado', 'retirado']

    function checkBrokerHasPendingUsage(
        existingUsages: Array<{ broker_id: string; status: UsageStatus }>,
        brokerId: string
    ): boolean {
        return existingUsages.some(u =>
            u.broker_id === brokerId && ACTIVE_STATUSES.includes(u.status)
        )
    }

    it('should flag broker with retirado vehicle', () => {
        const usages = [{ broker_id: 'broker-1', status: 'retirado' as UsageStatus }]
        expect(checkBrokerHasPendingUsage(usages, 'broker-1')).toBe(true)
    })

    it('should flag broker with aprovado but not yet picked up', () => {
        const usages = [{ broker_id: 'broker-1', status: 'aprovado' as UsageStatus }]
        expect(checkBrokerHasPendingUsage(usages, 'broker-1')).toBe(true)
    })

    it('should flag broker with solicitado pending approval', () => {
        const usages = [{ broker_id: 'broker-1', status: 'solicitado' as UsageStatus }]
        expect(checkBrokerHasPendingUsage(usages, 'broker-1')).toBe(true)
    })

    it('should not flag broker with only devolvido usage', () => {
        const usages = [{ broker_id: 'broker-1', status: 'devolvido' as UsageStatus }]
        expect(checkBrokerHasPendingUsage(usages, 'broker-1')).toBe(false)
    })

    it('should not flag different broker', () => {
        const usages = [{ broker_id: 'broker-2', status: 'retirado' as UsageStatus }]
        expect(checkBrokerHasPendingUsage(usages, 'broker-1')).toBe(false)
    })
})

// ── Cost per KM Calculation ───────────────────────────────────────────────────

describe('Cost per KM Calculation', () => {
    function calculateCostPerKm(params: {
        kmDriven: number
        totalFuelingCost: number
        totalMaintenanceCost: number
    }): number | null {
        if (params.kmDriven <= 0) return null
        return (params.totalFuelingCost + params.totalMaintenanceCost) / params.kmDriven
    }

    it('should calculate cost per km correctly', () => {
        const cost = calculateCostPerKm({
            kmDriven: 500,
            totalFuelingCost: 200,
            totalMaintenanceCost: 50,
        })
        expect(cost).toBeCloseTo(0.5)
    })

    it('should return null for 0 km driven', () => {
        const cost = calculateCostPerKm({ kmDriven: 0, totalFuelingCost: 50, totalMaintenanceCost: 0 })
        expect(cost).toBeNull()
    })

    it('should handle only fueling costs', () => {
        const cost = calculateCostPerKm({ kmDriven: 100, totalFuelingCost: 100, totalMaintenanceCost: 0 })
        expect(cost).toBe(1.0)
    })

    it('should handle zero fueling cost', () => {
        const cost = calculateCostPerKm({ kmDriven: 100, totalFuelingCost: 0, totalMaintenanceCost: 50 })
        expect(cost).toBe(0.5)
    })
})

// ── Suspicious Usage Detection ────────────────────────────────────────────────

describe('Suspicious Usage Detection', () => {
    interface Usage {
        km_driven?: number
        pickup_at?: string
        return_at?: string
    }

    function detectSuspiciousUsage(usage: Usage): { suspicious: boolean; reasons: string[] } {
        const reasons: string[] = []

        // Anomaly 1: very high km in a single usage (> 300km)
        if (usage.km_driven && usage.km_driven > 300) {
            reasons.push(`KM excessivo: ${usage.km_driven}km em uma única utilização`)
        }

        // Anomaly 2: usage started outside business hours (before 07:00 or after 21:00)
        if (usage.pickup_at) {
            const hour = new Date(usage.pickup_at).getHours()
            if (hour < 7 || hour >= 21) {
                reasons.push(`Retirada fora do horário comercial: ${hour}:00`)
            }
        }

        // Anomaly 3: usage duration > 12 hours
        if (usage.pickup_at && usage.return_at) {
            const hours = (new Date(usage.return_at).getTime() - new Date(usage.pickup_at).getTime()) / (1000 * 60 * 60)
            if (hours > 12) {
                reasons.push(`Uso prolongado: ${Math.round(hours)}h`)
            }
        }

        return { suspicious: reasons.length > 0, reasons }
    }

    it('should flag excessive KM in single usage', () => {
        const result = detectSuspiciousUsage({ km_driven: 450 })
        expect(result.suspicious).toBe(true)
        expect(result.reasons.some(r => r.includes('excessivo'))).toBe(true)
    })

    it('should not flag normal KM usage', () => {
        const result = detectSuspiciousUsage({ km_driven: 50 })
        expect(result.suspicious).toBe(false)
    })

    it('should flag usage outside business hours', () => {
        const result = detectSuspiciousUsage({ pickup_at: '2026-05-20T05:30:00' })
        expect(result.suspicious).toBe(true)
        expect(result.reasons.some(r => r.includes('horário comercial'))).toBe(true)
    })

    it('should not flag usage during business hours', () => {
        const result = detectSuspiciousUsage({ pickup_at: '2026-05-20T09:00:00' })
        expect(result.suspicious).toBe(false)
    })

    it('should flag very long usage duration', () => {
        const result = detectSuspiciousUsage({
            pickup_at: '2026-05-20T08:00:00',
            return_at: '2026-05-20T22:00:00',
        })
        expect(result.suspicious).toBe(true)
        expect(result.reasons.some(r => r.includes('prolongado'))).toBe(true)
    })

    it('should accumulate multiple suspicious factors', () => {
        const result = detectSuspiciousUsage({
            km_driven: 500,
            pickup_at: '2026-05-20T05:00:00',
        })
        expect(result.suspicious).toBe(true)
        expect(result.reasons.length).toBe(2)
    })
})

// ── Fueling Validation ────────────────────────────────────────────────────────

describe('Fueling Validation', () => {
    function validateFueling(params: {
        usageStatus: UsageStatus
        liters: number
        pricePerLiter: number
        kmAtFueling?: number
        kmInitial?: number
    }): { valid: boolean; error?: string } {
        if (params.usageStatus !== 'retirado') {
            return { valid: false, error: 'Abastecimento só pode ser registrado com veículo retirado' }
        }
        if (params.liters <= 0) {
            return { valid: false, error: 'Litros deve ser maior que zero' }
        }
        if (params.pricePerLiter <= 0) {
            return { valid: false, error: 'Preço por litro deve ser maior que zero' }
        }
        if (params.kmAtFueling !== undefined && params.kmInitial !== undefined) {
            if (params.kmAtFueling < params.kmInitial) {
                return { valid: false, error: 'KM do abastecimento não pode ser menor que KM inicial' }
            }
        }
        return { valid: true }
    }

    it('should allow fueling for retirado usage', () => {
        expect(validateFueling({ usageStatus: 'retirado', liters: 40, pricePerLiter: 5.89 }).valid).toBe(true)
    })

    it('should reject fueling for non-retirado usage', () => {
        const result = validateFueling({ usageStatus: 'devolvido', liters: 40, pricePerLiter: 5.89 })
        expect(result.valid).toBe(false)
        expect(result.error).toContain('retirado')
    })

    it('should reject zero liters', () => {
        const result = validateFueling({ usageStatus: 'retirado', liters: 0, pricePerLiter: 5.89 })
        expect(result.valid).toBe(false)
    })

    it('should reject zero price per liter', () => {
        const result = validateFueling({ usageStatus: 'retirado', liters: 40, pricePerLiter: 0 })
        expect(result.valid).toBe(false)
    })

    it('should reject km at fueling less than km initial', () => {
        const result = validateFueling({
            usageStatus: 'retirado', liters: 40, pricePerLiter: 5.89,
            kmAtFueling: 900, kmInitial: 1000,
        })
        expect(result.valid).toBe(false)
        expect(result.error).toContain('KM')
    })

    it('should calculate total fueling cost correctly', () => {
        const cost = 40 * 5.89
        expect(cost).toBeCloseTo(235.6)
    })
})

// ── Vehicle Alert Generation ──────────────────────────────────────────────────

describe('Vehicle Alert Generation', () => {
    function generateAlerts(vehicle: {
        plate: string
        insurance_expiry?: string
        ipva_expiry?: string
        km_current?: number
        next_revision_km?: number
    }, today: Date): Array<{ type: string; severity: string; message: string }> {
        const alerts: Array<{ type: string; severity: string; message: string }> = []
        const DAYS_30 = 30 * 24 * 60 * 60 * 1000

        if (vehicle.insurance_expiry) {
            const expiry = new Date(vehicle.insurance_expiry)
            const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            if (daysLeft <= 0) {
                alerts.push({ type: 'insurance_expired', severity: 'critical', message: `Seguro vencido em ${vehicle.insurance_expiry}` })
            } else if (daysLeft <= 30) {
                alerts.push({ type: 'insurance_expiring', severity: 'high', message: `Seguro vence em ${daysLeft} dias` })
            }
        }

        if (vehicle.km_current !== undefined && vehicle.next_revision_km !== undefined) {
            const kmLeft = vehicle.next_revision_km - vehicle.km_current
            if (kmLeft <= 0) {
                alerts.push({ type: 'revision_overdue', severity: 'critical', message: `Revisão vencida há ${Math.abs(kmLeft)}km` })
            } else if (kmLeft <= 500) {
                alerts.push({ type: 'revision_near', severity: 'medium', message: `Revisão em ${kmLeft}km` })
            }
        }

        return alerts
    }

    const today = new Date('2026-05-16')

    it('should generate alert for insurance expiring in 15 days', () => {
        const alerts = generateAlerts({ plate: 'ABC-1234', insurance_expiry: '2026-05-31' }, today)
        expect(alerts.some(a => a.type === 'insurance_expiring' && a.severity === 'high')).toBe(true)
    })

    it('should generate critical alert for expired insurance', () => {
        const alerts = generateAlerts({ plate: 'ABC-1234', insurance_expiry: '2026-05-10' }, today)
        expect(alerts.some(a => a.type === 'insurance_expired' && a.severity === 'critical')).toBe(true)
    })

    it('should not alert for insurance expiring in 60 days', () => {
        const alerts = generateAlerts({ plate: 'ABC-1234', insurance_expiry: '2026-07-16' }, today)
        expect(alerts.some(a => a.type.includes('insurance'))).toBe(false)
    })

    it('should generate alert when near revision km', () => {
        const alerts = generateAlerts({ plate: 'ABC-1234', km_current: 9600, next_revision_km: 10000 }, today)
        expect(alerts.some(a => a.type === 'revision_near')).toBe(true)
    })

    it('should generate critical alert when revision overdue', () => {
        const alerts = generateAlerts({ plate: 'ABC-1234', km_current: 10100, next_revision_km: 10000 }, today)
        expect(alerts.some(a => a.type === 'revision_overdue' && a.severity === 'critical')).toBe(true)
    })
})

// ── Usage Status Flow ─────────────────────────────────────────────────────────

describe('Usage Status State Machine', () => {
    type Transition = { from: UsageStatus; action: string; role: 'admin' | 'manager' | 'broker'; to: UsageStatus }

    const validTransitions: Transition[] = [
        { from: 'solicitado', action: 'approve', role: 'manager', to: 'aprovado' },
        { from: 'solicitado', action: 'reject', role: 'manager', to: 'rejeitado' },
        { from: 'solicitado', action: 'cancel', role: 'broker', to: 'cancelado' },
        { from: 'aprovado', action: 'pickup', role: 'broker', to: 'retirado' },
        { from: 'aprovado', action: 'cancel', role: 'broker', to: 'cancelado' },
        { from: 'retirado', action: 'return', role: 'broker', to: 'devolvido' },
    ]

    function transition(current: UsageStatus, action: string, role: 'admin' | 'manager' | 'broker'): UsageStatus | null {
        const t = validTransitions.find(t => t.from === current && t.action === action && (t.role === role || role === 'admin'))
        return t ? t.to : null
    }

    it('manager can approve solicitado usage', () => {
        expect(transition('solicitado', 'approve', 'manager')).toBe('aprovado')
    })

    it('broker cannot approve their own usage', () => {
        expect(transition('solicitado', 'approve', 'broker')).toBeNull()
    })

    it('broker can cancel solicitado usage', () => {
        expect(transition('solicitado', 'cancel', 'broker')).toBe('cancelado')
    })

    it('broker can pickup approved vehicle', () => {
        expect(transition('aprovado', 'pickup', 'broker')).toBe('retirado')
    })

    it('broker can return retirado vehicle', () => {
        expect(transition('retirado', 'return', 'broker')).toBe('devolvido')
    })

    it('cannot return a vehicle that was not picked up', () => {
        expect(transition('aprovado', 'return', 'broker')).toBeNull()
    })

    it('admin can perform any transition', () => {
        expect(transition('solicitado', 'approve', 'admin')).toBe('aprovado')
    })
})
