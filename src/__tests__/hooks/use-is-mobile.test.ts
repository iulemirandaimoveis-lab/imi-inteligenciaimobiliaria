/**
 * Tests for useIsMobile hook
 * Covers: SSR default (false), mobile viewport, desktop viewport,
 *         custom breakpoint, event listener registration and cleanup
 */

import { renderHook, act } from '@testing-library/react'

// We need to mock useLayoutEffect because jsdom doesn't fully support it
// React falls back to useEffect in test environments, which works for us

let mockMatches = false
let changeHandler: ((e: MediaQueryListEvent) => void) | null = null

const mockAddEventListener = jest.fn((event: string, handler: any) => {
  changeHandler = handler
})
const mockRemoveEventListener = jest.fn()

const mockMatchMedia = jest.fn((query: string) => ({
  matches: mockMatches,
  media: query,
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  dispatchEvent: jest.fn(),
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

import { useIsMobile } from '@/hooks/use-is-mobile'

beforeEach(() => {
  jest.clearAllMocks()
  mockMatches = false
  changeHandler = null
})

describe('useIsMobile', () => {
  it('returns false by default (initial state)', () => {
    mockMatches = false
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('returns true when viewport matches mobile breakpoint', () => {
    mockMatches = true
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('returns false when viewport is above the breakpoint', () => {
    mockMatches = false
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it('uses the default breakpoint of 768', () => {
    renderHook(() => useIsMobile())
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 767px)')
  })

  it('accepts a custom breakpoint', () => {
    renderHook(() => useIsMobile(1024))
    expect(mockMatchMedia).toHaveBeenCalledWith('(max-width: 1023px)')
  })

  it('registers a change event listener', () => {
    renderHook(() => useIsMobile())
    expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('removes the event listener on unmount', () => {
    const { unmount } = renderHook(() => useIsMobile())
    unmount()
    expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })

  it('updates value when the media query changes', () => {
    mockMatches = false
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)

    // Simulate media query change
    act(() => {
      if (changeHandler) {
        changeHandler({ matches: true } as MediaQueryListEvent)
      }
    })
    expect(result.current).toBe(true)
  })
})
