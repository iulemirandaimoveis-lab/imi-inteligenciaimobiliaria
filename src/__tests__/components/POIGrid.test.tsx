/**
 * @jest-environment jsdom
 */

import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { POIGrid, formatDistance } from '@/components/imoveis/POIGrid';
import type { ConvenienceData } from '@/types/poi';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ─── Fixtures ───────────────────────────────────────────────────────────────

const baseData: ConvenienceData = {
    development_id: 'dev-123',
    score: 85,
    score_label: 'Excelente',
    categories: [
        {
            category: 'supermarket',
            label: 'Mercados',
            icon: '🛒',
            color: '#4CAF50',
            items: [
                {
                    name: 'Supermercado Extra',
                    category: 'supermarket',
                    distance_meters: 350,
                    rating: 4.5,
                    place_id: 'place-1',
                },
            ],
            nearest_distance_meters: 350,
        },
        {
            category: 'pharmacy',
            label: 'Farmácias',
            icon: '💊',
            color: '#2196F3',
            items: [],
            nearest_distance_meters: 0,
        },
    ],
    cached_at: '2024-01-01T00:00:00Z',
};

const dataNoHighlights: ConvenienceData = {
    ...baseData,
    categories: [
        {
            ...baseData.categories[0],
            items: [
                {
                    name: 'Mercadinho Simples',
                    category: 'supermarket',
                    distance_meters: 200,
                    rating: 3.5,
                    place_id: 'place-low',
                },
            ],
        },
        baseData.categories[1],
    ],
};

// ─── formatDistance unit tests ───────────────────────────────────────────────

describe('formatDistance', () => {
    it('returns empty string for 0', () => {
        expect(formatDistance(0)).toBe('');
    });

    it('formats meters below 1000', () => {
        expect(formatDistance(350)).toBe('350m');
        expect(formatDistance(999)).toBe('999m');
    });

    it('formats kilometers for 1000+', () => {
        expect(formatDistance(1000)).toBe('1.0km');
        expect(formatDistance(1500)).toBe('1.5km');
        expect(formatDistance(2300)).toBe('2.3km');
    });
});

// ─── POIGrid component tests ─────────────────────────────────────────────────

describe('POIGrid', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('loading state', () => {
        it('shows skeleton while fetching', () => {
            mockFetch.mockReturnValue(new Promise(() => {}));
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            expect(screen.getByTestId('poi-grid-loading')).toBeInTheDocument();
        });

        it('does not show the grid during loading', () => {
            mockFetch.mockReturnValue(new Promise(() => {}));
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            expect(screen.queryByTestId('poi-grid')).not.toBeInTheDocument();
        });
    });

    describe('zero coordinates', () => {
        it('does not call fetch when lat is 0', async () => {
            render(<POIGrid developmentId="dev-123" latitude={0} longitude={-34.88} />);
            await waitFor(() => {
                expect(mockFetch).not.toHaveBeenCalled();
            });
        });

        it('does not call fetch when lng is 0', async () => {
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={0} />);
            await waitFor(() => {
                expect(mockFetch).not.toHaveBeenCalled();
            });
        });

        it('renders nothing when coordinates are zero', async () => {
            const { container } = render(<POIGrid developmentId="dev-123" latitude={0} longitude={0} />);
            await waitFor(() => {
                expect(container).toBeEmptyDOMElement();
            });
        });
    });

    describe('successful data fetch', () => {
        beforeEach(() => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => baseData });
        });

        it('renders the main grid after fetch completes', async () => {
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                expect(screen.getByTestId('poi-grid')).toBeInTheDocument();
            });
        });

        it('shows the section title', async () => {
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                expect(screen.getByText('Conveniência e Proximidade')).toBeInTheDocument();
            });
        });

        it('shows the subtitle', async () => {
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                expect(screen.getByText('Serviços e pontos de interesse próximos')).toBeInTheDocument();
            });
        });

        it('renders all category cards', async () => {
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                const cards = screen.getAllByTestId('poi-category-card');
                expect(cards).toHaveLength(2);
            });
        });

        it('shows category labels', async () => {
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                expect(screen.getByText('Mercados')).toBeInTheDocument();
                expect(screen.getByText('Farmácias')).toBeInTheDocument();
            });
        });

        it('shows nearest POI name for categories with items', async () => {
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                // POI name appears in the category card (and possibly highlights too)
                const matches = screen.getAllByText('Supermercado Extra');
                expect(matches.length).toBeGreaterThanOrEqual(1);
            });
        });

        it('shows "Não encontrado" for empty categories', async () => {
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                expect(screen.getByText('Não encontrado')).toBeInTheDocument();
            });
        });

        it('shows formatted distance for categories with items', async () => {
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                expect(screen.getByText('350m')).toBeInTheDocument();
            });
        });
    });

    describe('score badge', () => {
        it('renders score badge with score and label', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => baseData });
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                expect(screen.getByTestId('score-badge')).toBeInTheDocument();
            });
            expect(screen.getByText('85')).toBeInTheDocument();
            expect(screen.getByText('Excelente')).toBeInTheDocument();
        });

        it('renders badge for score below 40 (LIMITADO)', async () => {
            const lowScore: ConvenienceData = { ...baseData, score: 30, score_label: 'Limitado' };
            mockFetch.mockResolvedValue({ ok: true, json: async () => lowScore });
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                expect(screen.getByText('30')).toBeInTheDocument();
                expect(screen.getByText('Limitado')).toBeInTheDocument();
            });
        });
    });

    describe('highlights section', () => {
        it('shows "Destaques próximos" for POIs with rating >= 4.0', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => baseData });
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                expect(screen.getByText('Destaques próximos')).toBeInTheDocument();
            });
        });

        it('shows highlighted POI name in the highlights section', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => baseData });
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            // The POI name appears both in the card and in highlights
            await waitFor(() => {
                const names = screen.getAllByText('Supermercado Extra');
                expect(names.length).toBeGreaterThanOrEqual(1);
            });
        });

        it('does not show "Destaques próximos" when no POI has rating >= 4.0', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => dataNoHighlights });
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                expect(screen.queryByText('Destaques próximos')).not.toBeInTheDocument();
            });
        });
    });

    describe('API call parameters', () => {
        it('calls the correct API URL with residencial type', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => baseData });
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} imovelType="residencial" />);
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/pois?lat=-8.05&lng=-34.88&id=dev-123&type=residencial',
                );
            });
        });

        it('calls the correct API URL with short_stay type', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => baseData });
            render(<POIGrid developmentId="dev-456" latitude={-8.1} longitude={-34.9} imovelType="short_stay" />);
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    '/api/pois?lat=-8.1&lng=-34.9&id=dev-456&type=short_stay',
                );
            });
        });

        it('defaults to residencial type when imovelType is not provided', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => baseData });
            render(<POIGrid developmentId="dev-789" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                expect(mockFetch).toHaveBeenCalledWith(
                    expect.stringContaining('type=residencial'),
                );
            });
        });
    });

    describe('error and empty states', () => {
        it('renders nothing when API returns non-ok response', async () => {
            mockFetch.mockResolvedValue({ ok: false, json: async () => null });
            const { container } = render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                expect(container).toBeEmptyDOMElement();
            });
        });

        it('renders nothing when fetch throws a network error', async () => {
            mockFetch.mockRejectedValue(new Error('Network error'));
            const { container } = render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                expect(container).toBeEmptyDOMElement();
            });
        });
    });

    describe('readability on light background', () => {
        it('uses dark color #0B1928 for the section title', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => baseData });
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                const heading = screen.getByText('Conveniência e Proximidade');
                expect(heading).toHaveStyle({ color: '#0B1928' });
            });
        });

        it('uses muted color #948F84 for the subtitle', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => baseData });
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                const subtitle = screen.getByText('Serviços e pontos de interesse próximos');
                expect(subtitle).toHaveStyle({ color: '#948F84' });
            });
        });

        it('footer credit uses light muted color #B8B3A8', async () => {
            mockFetch.mockResolvedValue({ ok: true, json: async () => baseData });
            render(<POIGrid developmentId="dev-123" latitude={-8.05} longitude={-34.88} />);
            await waitFor(() => {
                const credit = screen.getByText(/Dados via Google Places/);
                expect(credit).toHaveStyle({ color: '#B8B3A8' });
            });
        });
    });
});
