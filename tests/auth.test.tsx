import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '@/app/backoffice/page';

// Mock do Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => ({
    createClientComponentClient: () => ({
        auth: {
            signInWithPassword: jest.fn()
        }
    })
}));

// Mock do next/navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        refresh: jest.fn()
    })
}));

describe('Login Page', () => {
    it('renders login form', () => {
        render(<LoginPage />);
        expect(screen.getByPlaceholderText(/seu@email.com/i)).toBeInTheDocument();
    });

    it('renders email input', () => {
        render(<LoginPage />);
        expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    });

    it('renders password input', () => {
        render(<LoginPage />);
        expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    });

    it('renders submit button', () => {
        render(<LoginPage />);
        expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });
});
