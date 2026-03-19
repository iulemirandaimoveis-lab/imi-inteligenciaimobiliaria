/**
 * Tests for PropertyCard and PropertyListRow components
 * Covers: rendering, missing data, score badge, status labels, favorites,
 *         compare mode, action buttons, bulk mode, list row variant
 */

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: any) => (
    <a href={href} {...rest}>{children}</a>
  ),
}))

// Mock IMIScoreBadge
jest.mock('@/features/properties/components/IMIScoreBadge', () => ({
  IMIScoreBadge: ({ score, size }: { score: number; size: string }) => (
    <div data-testid="imi-score-badge" data-score={score} data-size={size}>
      Score: {score}
    </div>
  ),
}))

import { PropertyCard, PropertyListRow } from '@/features/properties/components/PropertyCard'
import type { IMIProperty } from '@/features/properties/types'

// Minimal valid property factory
function makeProperty(overrides: Partial<any> = {}): any {
  return {
    id: 'prop-1',
    name: 'Residencial Alpha',
    price: 500000,
    price_per_sqm: 8000,
    area: 65,
    bedrooms: 3,
    bathrooms: 2,
    parking: 1,
    neighborhood: 'Boa Viagem',
    city: 'Recife',
    status: 'disponivel',
    imi_score: 82,
    market_delta_pct: -5.2,
    cover_image_url: 'https://example.com/img.jpg',
    yield_est: 7.5,
    roi_12m: 12.3,
    image_urls: [],
    images: [],
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('PropertyCard', () => {
  it('renders property name', () => {
    render(<PropertyCard property={makeProperty()} />)
    expect(screen.getByText('Residencial Alpha')).toBeInTheDocument()
  })

  it('renders formatted price', () => {
    render(<PropertyCard property={makeProperty({ price: 1500000 })} />)
    expect(screen.getByText('R$ 1,50M')).toBeInTheDocument()
  })

  it('renders price in thousands format', () => {
    render(<PropertyCard property={makeProperty({ price: 350000 })} />)
    expect(screen.getByText('R$ 350K')).toBeInTheDocument()
  })

  it('shows dash when price is null', () => {
    render(<PropertyCard property={makeProperty({ price: null })} />)
    // The fmt function returns '—' for null
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('renders the IMI Score badge with correct score', () => {
    render(<PropertyCard property={makeProperty({ imi_score: 92 })} />)
    const badge = screen.getByTestId('imi-score-badge')
    expect(badge).toHaveAttribute('data-score', '92')
  })

  it('renders score badge with 0 when imi_score is null', () => {
    render(<PropertyCard property={makeProperty({ imi_score: null })} />)
    const badge = screen.getByTestId('imi-score-badge')
    expect(badge).toHaveAttribute('data-score', '0')
  })

  it('shows "Disponivel" status label for disponivel status', () => {
    render(<PropertyCard property={makeProperty({ status: 'disponivel' })} />)
    expect(screen.getByText('Disponível')).toBeInTheDocument()
  })

  it('shows "Lancamento" status label for lancamento status', () => {
    render(<PropertyCard property={makeProperty({ status: 'lancamento' })} />)
    expect(screen.getByText('Lançamento')).toBeInTheDocument()
  })

  it('shows "Vendido" status label', () => {
    render(<PropertyCard property={makeProperty({ status: 'vendido' })} />)
    expect(screen.getByText('Vendido')).toBeInTheDocument()
  })

  it('shows the raw status when not in the known map', () => {
    render(<PropertyCard property={makeProperty({ status: 'custom_status' })} />)
    expect(screen.getByText('custom_status')).toBeInTheDocument()
  })

  it('renders neighborhood and city', () => {
    render(<PropertyCard property={makeProperty()} />)
    expect(screen.getByText('Boa Viagem · Recife')).toBeInTheDocument()
  })

  it('renders dash when no neighborhood or city', () => {
    render(<PropertyCard property={makeProperty({ neighborhood: null, city: null })} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBeGreaterThan(0)
  })

  it('displays property image when cover_image_url is provided', () => {
    render(<PropertyCard property={makeProperty()} />)
    const img = screen.getByAltText('Residencial Alpha')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg')
  })

  it('falls back to a placeholder SVG when no image URLs are provided', () => {
    render(
      <PropertyCard
        property={makeProperty({ cover_image_url: null, image_urls: [], images: [] })}
      />
    )
    // No <img> with alt text should exist
    expect(screen.queryByAltText('Residencial Alpha')).not.toBeInTheDocument()
  })

  it('renders favorite button and calls onFavorite', () => {
    const onFavorite = jest.fn()
    render(<PropertyCard property={makeProperty()} onFavorite={onFavorite} />)
    const favBtn = screen.getByLabelText('Favoritar imóvel')
    fireEvent.click(favBtn)
    expect(onFavorite).toHaveBeenCalledWith('prop-1')
  })

  it('renders "Remover dos favoritos" label when isFavorited', () => {
    render(
      <PropertyCard
        property={makeProperty()}
        onFavorite={jest.fn()}
        isFavorited={true}
      />
    )
    expect(screen.getByLabelText('Remover dos favoritos')).toBeInTheDocument()
  })

  it('renders compare button and calls onCompare', () => {
    const onCompare = jest.fn()
    render(<PropertyCard property={makeProperty()} onCompare={onCompare} />)
    const compareBtn = screen.getByLabelText('Comparar imóvel')
    fireEvent.click(compareBtn)
    expect(onCompare).toHaveBeenCalledWith('prop-1')
  })

  it('renders "Remover da comparacao" label when isComparing', () => {
    render(
      <PropertyCard
        property={makeProperty()}
        onCompare={jest.fn()}
        isComparing={true}
      />
    )
    expect(screen.getByLabelText('Remover da comparação')).toBeInTheDocument()
  })

  it('renders detail, QR, and content action buttons', () => {
    render(<PropertyCard property={makeProperty()} />)
    expect(screen.getByLabelText('Ver detalhes do imóvel')).toBeInTheDocument()
    expect(screen.getByLabelText('Gerar QR Code do imóvel')).toBeInTheDocument()
    expect(screen.getByLabelText('Gerar conteúdo para o imóvel')).toBeInTheDocument()
  })

  it('renders below-market indicator when market_delta_pct is positive', () => {
    render(<PropertyCard property={makeProperty({ market_delta_pct: 8.3 })} />)
    expect(screen.getByText('-8.3%')).toBeInTheDocument()
  })

  it('renders above-market indicator when market_delta_pct is negative', () => {
    render(<PropertyCard property={makeProperty({ market_delta_pct: -3.1 })} />)
    expect(screen.getByText('+3.1%')).toBeInTheDocument()
  })

  it('does not render market delta when it is 0', () => {
    render(<PropertyCard property={makeProperty({ market_delta_pct: 0 })} />)
    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })

  it('wraps card in a Link when not in bulkMode', () => {
    render(<PropertyCard property={makeProperty()} />)
    const link = screen.getByLabelText('Ver detalhes de Residencial Alpha')
    expect(link).toHaveAttribute('href', '/backoffice/imoveis/prop-1')
  })

  it('does NOT wrap card in a Link when bulkMode is true', () => {
    render(<PropertyCard property={makeProperty()} bulkMode={true} />)
    expect(screen.queryByLabelText('Ver detalhes de Residencial Alpha')).not.toBeInTheDocument()
  })
})

describe('PropertyListRow', () => {
  it('renders property name and location', () => {
    render(<PropertyListRow property={makeProperty()} />)
    expect(screen.getByText('Residencial Alpha')).toBeInTheDocument()
    expect(screen.getByText('Boa Viagem · Recife')).toBeInTheDocument()
  })

  it('renders the IMI Score badge', () => {
    render(<PropertyListRow property={makeProperty({ imi_score: 75 })} />)
    const badge = screen.getByTestId('imi-score-badge')
    expect(badge).toHaveAttribute('data-score', '75')
  })

  it('renders action buttons: details, QR, content', () => {
    render(<PropertyListRow property={makeProperty()} />)
    expect(screen.getByLabelText('Ver detalhes do imóvel')).toBeInTheDocument()
    expect(screen.getByLabelText('Gerar QR Code do imóvel')).toBeInTheDocument()
    expect(screen.getByLabelText('Gerar conteúdo para o imóvel')).toBeInTheDocument()
  })

  it('shows status label', () => {
    render(<PropertyListRow property={makeProperty({ status: 'em_construcao' })} />)
    expect(screen.getByText('Construção')).toBeInTheDocument()
  })
})
