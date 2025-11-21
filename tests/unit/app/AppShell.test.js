import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/app/App';
import { AppProviders } from '@/app/providers';
describe('App shell', () => {
    it('renders Stage 3 dashboard cockpit', () => {
        render(_jsx(AppProviders, { children: _jsx(MemoryRouter, { children: _jsx(App, {}) }) }));
        expect(screen.getByText(/Personal Finance Desktop/i)).toBeVisible();
        expect(screen.getByText(/Financial cockpit/i)).toBeInTheDocument();
    });
});
