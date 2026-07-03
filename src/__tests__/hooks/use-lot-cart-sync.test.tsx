/**
 * useLotCart — sincronização entre instâncias na MESMA página.
 *
 * Regressão do bug do FAB obsoleto: AltoBellevueMapExplorer mantém uma
 * instância do carrinho montada enquanto as vistas de mapa (Plano / Satélite +
 * Lotes) montam a própria instância. Antes, adicionar um lote numa vista não
 * refletia na outra até remount — o localStorage era compartilhado mas o
 * estado React não.
 */
import { renderHook, act } from '@testing-library/react'
import { useLotCart } from '@/hooks/useLotCart'

interface TestLot { id: string; price: number }

const SLUG = 'test-dev'
const KEY = `imi:lot-cart:${SLUG}:v1`

describe('useLotCart — sync entre instâncias', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('hidrata do localStorage existente', () => {
    window.localStorage.setItem(KEY, JSON.stringify([{ id: 'A-01', price: 100 }]))
    const { result } = renderHook(() => useLotCart<TestLot>(SLUG))
    expect(result.current.items).toEqual([{ id: 'A-01', price: 100 }])
    expect(result.current.has('A-01')).toBe(true)
  })

  it('add em uma instância aparece na outra (mesma página)', () => {
    const a = renderHook(() => useLotCart<TestLot>(SLUG))
    const b = renderHook(() => useLotCart<TestLot>(SLUG))

    act(() => {
      a.result.current.add({ id: 'B-07', price: 50000 })
    })

    expect(a.result.current.items).toHaveLength(1)
    expect(b.result.current.items).toHaveLength(1)
    expect(b.result.current.has('B-07')).toBe(true)
  })

  it('remove e clear também propagam', () => {
    const a = renderHook(() => useLotCart<TestLot>(SLUG))
    const b = renderHook(() => useLotCart<TestLot>(SLUG))

    act(() => {
      a.result.current.add({ id: 'C-01', price: 1 })
      a.result.current.add({ id: 'C-02', price: 2 })
    })
    expect(b.result.current.items).toHaveLength(2)

    act(() => {
      b.result.current.remove('C-01')
    })
    expect(a.result.current.items.map((l) => l.id)).toEqual(['C-02'])

    act(() => {
      a.result.current.clear()
    })
    expect(b.result.current.items).toEqual([])
  })

  it('não entra em loop de eventos (escrita estabiliza)', () => {
    const spy = jest.spyOn(window.localStorage.__proto__, 'setItem')
    const a = renderHook(() => useLotCart<TestLot>(SLUG))
    renderHook(() => useLotCart<TestLot>(SLUG))

    act(() => {
      a.result.current.add({ id: 'D-01', price: 10 })
    })
    const writes = spy.mock.calls.filter(([k]) => k === KEY).length
    // 1 escrita da hidratação inicial ("[]") + 1 do add — o eco do evento de
    // sync NÃO pode gerar escritas adicionais.
    expect(writes).toBeLessThanOrEqual(3)
    spy.mockRestore()
  })

  it('slugs diferentes não se misturam', () => {
    const a = renderHook(() => useLotCart<TestLot>('dev-a'))
    const b = renderHook(() => useLotCart<TestLot>('dev-b'))

    act(() => {
      a.result.current.add({ id: 'X-01', price: 5 })
    })
    expect(b.result.current.items).toEqual([])
  })

  it('storage corrompido não quebra — começa vazio', () => {
    window.localStorage.setItem(KEY, '{not-json')
    const { result } = renderHook(() => useLotCart<TestLot>(SLUG))
    expect(result.current.items).toEqual([])
    act(() => {
      result.current.add({ id: 'E-01', price: 9 })
    })
    expect(result.current.items).toHaveLength(1)
  })
})
