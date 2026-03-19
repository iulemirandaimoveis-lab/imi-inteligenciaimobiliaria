/**
 * @jest-environment node
 */

/**
 * Tests for GET/POST /api/contratos
 * Verifies: authentication, listing, contract creation, validation
 */

const mockGetUser = jest.fn()
const mockSelect = jest.fn()
const mockNot = jest.fn()
const mockOrder = jest.fn()
const mockRange = jest.fn()
const mockEq = jest.fn()
const mockSingleGet = jest.fn()
const mockInsert = jest.fn()
const mockSelectAfterInsert = jest.fn()
const mockSingleInsert = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(async () => ({
        auth: {
            getUser: mockGetUser,
        },
        from: jest.fn((table: string) => {
            if (table === 'contratos') {
                return {
                    select: mockSelect,
                    insert: mockInsert,
                    eq: mockEq,
                }
            }
            return {}
        }),
    })),
}))

jest.mock('@/lib/schemas', () => ({
    parseBody: jest.fn(),
}))

import { GET, POST } from '@/app/api/contratos/route'
import { parseBody } from '@/lib/schemas'
import { NextRequest } from 'next/server'

const mockedParseBody = parseBody as jest.MockedFunction<typeof parseBody>

function makeGetRequest(params = '') {
    return new NextRequest(`http://localhost:3000/api/contratos${params ? '?' + params : ''}`, {
        method: 'GET',
    })
}

function makePostRequest(body: object) {
    return new NextRequest('http://localhost:3000/api/contratos', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' },
    })
}

describe('GET /api/contratos', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        // Default: authenticated user
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
        })

        // Default chain: select -> order -> not -> range
        mockRange.mockResolvedValue({
            data: [
                { id: 'ctr-1', numero: 'CTR-001', categoria: 'locacao', status: 'rascunho' },
                { id: 'ctr-2', numero: 'CTR-002', categoria: 'venda', status: 'ativo' },
            ],
            error: null,
            count: 2,
        })
        mockNot.mockReturnValue({ range: mockRange })
        mockEq.mockReturnValue({ range: mockRange })
        mockOrder.mockReturnValue({ not: mockNot, eq: mockEq })
        mockSelect.mockReturnValue({ order: mockOrder })
    })

    it('returns 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

        const req = makeGetRequest()
        const res = await GET(req)
        const json = await res.json()

        expect(res.status).toBe(401)
        expect(json.error).toBe('Não autorizado')
    })

    it('returns paginated list of contracts', async () => {
        const req = makeGetRequest('page=1&limit=50')
        const res = await GET(req)
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.data).toHaveLength(2)
        expect(json.data[0].numero).toBe('CTR-001')
        expect(json.pagination).toBeDefined()
        expect(json.pagination.page).toBe(1)
        expect(json.pagination.total).toBe(2)
    })

    it('fetches a single contract by id', async () => {
        mockSingleGet.mockResolvedValue({
            data: { id: 'ctr-1', numero: 'CTR-001', categoria: 'locacao' },
            error: null,
        })
        const mockEqForSingle = jest.fn().mockReturnValue({ single: mockSingleGet })
        mockSelect.mockReturnValue({ eq: mockEqForSingle })

        const req = makeGetRequest('id=ctr-1')
        const res = await GET(req)
        const json = await res.json()

        expect(res.status).toBe(200)
        expect(json.id).toBe('ctr-1')
        expect(json.numero).toBe('CTR-001')
    })

    it('filters contracts by status', async () => {
        // chain: select -> order -> eq -> range
        // mockOrder already returns { not, eq } and mockEq returns { range }
        const req = makeGetRequest('status=ativo')
        const res = await GET(req)

        expect(res.status).toBe(200)
        expect(mockEq).toHaveBeenCalledWith('status', 'ativo')
    })

    it('returns 500 when database query fails', async () => {
        mockRange.mockResolvedValue({
            data: null,
            error: { message: 'Database connection error' },
            count: null,
        })

        const req = makeGetRequest()
        const res = await GET(req)
        const json = await res.json()

        expect(res.status).toBe(500)
        expect(json.error).toBeDefined()
    })
})

describe('POST /api/contratos', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-1' } },
            error: null,
        })

        mockSingleInsert.mockResolvedValue({
            data: { id: 'ctr-new', numero: 'CTR-1234567890', categoria: 'locacao', status: 'rascunho' },
            error: null,
        })
        mockSelectAfterInsert.mockReturnValue({ single: mockSingleInsert })
        mockInsert.mockReturnValue({ select: mockSelectAfterInsert })
    })

    it('returns 401 when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

        mockedParseBody.mockResolvedValue({ success: true, data: { categoria: 'locacao' } })

        const req = makePostRequest({ categoria: 'locacao' })
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(401)
        expect(json.error).toBe('Não autorizado')
    })

    it('returns 400 when validation fails', async () => {
        mockedParseBody.mockResolvedValue({
            success: false,
            error: { categoria: ['categoria ou modelo_nome é obrigatório'] },
        })

        const req = makePostRequest({})
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(400)
        expect(json.error).toBe('Dados inválidos')
        expect(json.details).toBeDefined()
    })

    it('creates a contract successfully', async () => {
        mockedParseBody.mockResolvedValue({
            success: true,
            data: {
                categoria: 'locacao',
                modelo_nome: 'Contrato de Locação',
                status: 'rascunho',
            },
        })

        const req = makePostRequest({ categoria: 'locacao', modelo_nome: 'Contrato de Locação' })
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(201)
        expect(json.data).toBeDefined()
        expect(json.data.id).toBe('ctr-new')
        expect(mockInsert).toHaveBeenCalledWith(
            expect.objectContaining({
                categoria: 'locacao',
                modelo_nome: 'Contrato de Locação',
                status: 'rascunho',
                criado_por: 'user-1',
            })
        )
    })

    it('returns 500 when database insert fails', async () => {
        mockedParseBody.mockResolvedValue({
            success: true,
            data: { categoria: 'venda' },
        })
        mockSingleInsert.mockResolvedValue({
            data: null,
            error: { message: 'Insert failed' },
        })

        const req = makePostRequest({ categoria: 'venda' })
        const res = await POST(req)
        const json = await res.json()

        expect(res.status).toBe(500)
        expect(json.error).toBeTruthy()
    })
})
