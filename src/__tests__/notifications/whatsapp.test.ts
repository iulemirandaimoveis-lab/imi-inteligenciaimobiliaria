import { toChatId } from '@/lib/notifications/whatsapp'

describe('notifications · whatsapp · toChatId', () => {
  it('formats a national BR number with default DDI', () => {
    expect(toChatId('81 98614-1487')).toBe('5581986141487@c.us')
  })

  it('keeps an already-international number untouched', () => {
    expect(toChatId('+55 81 98614-1487')).toBe('5581986141487@c.us')
  })

  it('strips a leading national-dial zero', () => {
    expect(toChatId('081 98614-1487')).toBe('5581986141487@c.us')
  })

  it('honours a custom DDI', () => {
    expect(toChatId('912345678', '351')).toBe('351912345678@c.us')
  })

  it('returns null for empty or too-short input', () => {
    expect(toChatId('')).toBeNull()
    expect(toChatId(null)).toBeNull()
    expect(toChatId(undefined)).toBeNull()
    expect(toChatId('123')).toBeNull()
  })
})
