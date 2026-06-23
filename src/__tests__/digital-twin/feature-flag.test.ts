import { isDigitalTwinEnabled, DIGITAL_TWIN_FLAG } from '@/lib/digital-twin/feature-flag';

describe('digital-twin feature flag', () => {
  const original = process.env.NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN;
    else process.env.NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN = original;
  });

  it('expõe o nome canônico da flag', () => {
    expect(DIGITAL_TWIN_FLAG).toBe('NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN');
  });

  it('fica DESLIGADA por padrão (flag ausente) — produção/legado intactos', () => {
    delete process.env.NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN;
    expect(isDigitalTwinEnabled()).toBe(false);
  });

  it('liga somente quando o valor é exatamente "true"', () => {
    process.env.NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN = 'true';
    expect(isDigitalTwinEnabled()).toBe(true);
  });

  it('permanece desligada para valores ambíguos (rollback trivial)', () => {
    for (const v of ['1', 'TRUE', 'yes', '', 'false']) {
      process.env.NEXT_PUBLIC_ALTO_BELLEVUE_DIGITAL_TWIN = v;
      expect(isDigitalTwinEnabled()).toBe(false);
    }
  });
});
