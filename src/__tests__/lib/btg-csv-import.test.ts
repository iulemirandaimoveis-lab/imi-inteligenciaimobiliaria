/**
 * @jest-environment node
 */
import { parseStatementCsv, StatementCsvError } from '@/lib/btg/csv-import'

describe('parseStatementCsv', () => {
    it('parses a semicolon-delimited BR statement with comma decimals', () => {
        const csv = [
            'Data;Descrição;Valor;Tipo',
            '05/07/2026;PIX RECEBIDO - MANO IMOVEIS;1.234,56;Credito',
            '06/07/2026;TARIFA MANUTENCAO;-29,90;Debito',
        ].join('\n')

        const { transactions, warnings } = parseStatementCsv(csv)
        expect(warnings).toEqual([])
        expect(transactions).toHaveLength(2)
        expect(transactions[0]).toMatchObject({
            date: '2026-07-05',
            amount: 1234.56,
            type: 'credito',
        })
        expect(transactions[1]).toMatchObject({
            date: '2026-07-06',
            amount: 29.90,
            type: 'debito',
        })
    })

    it('parses a comma-delimited CSV with dot decimals', () => {
        const csv = [
            'Data,Descricao,Valor',
            '2026-07-01,Deposito,500.00',
        ].join('\n')
        const { transactions } = parseStatementCsv(csv)
        expect(transactions[0].amount).toBe(500)
        expect(transactions[0].date).toBe('2026-07-01')
    })

    it('infers credit/debit from the amount sign when no Tipo column exists', () => {
        const csv = ['Data;Valor', '01/01/2026;-50,00'].join('\n')
        const { transactions } = parseStatementCsv(csv)
        expect(transactions[0].type).toBe('debito')
        expect(transactions[0].amount).toBe(50)
    })

    it('collects a warning for an unparsable row instead of throwing', () => {
        const csv = [
            'Data;Valor',
            '31/13/2026;100,00',
            '01/01/2026;200,00',
        ].join('\n')
        const { transactions, warnings } = parseStatementCsv(csv)
        expect(transactions).toHaveLength(1)
        expect(warnings).toHaveLength(1)
    })

    it('throws when the header has no recognizable date/amount columns', () => {
        const csv = ['Foo;Bar', '1;2'].join('\n')
        expect(() => parseStatementCsv(csv)).toThrow(StatementCsvError)
    })

    it('throws on an empty or header-only CSV', () => {
        expect(() => parseStatementCsv('Data;Valor')).toThrow(StatementCsvError)
    })
})
