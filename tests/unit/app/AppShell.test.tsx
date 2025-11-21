import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import App from '@/app/App';
import { AppProviders } from '@/app/providers';

describe('App shell', () => {
  it('renders Stage 3 dashboard cockpit', () => {
    render(
      <AppProviders>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </AppProviders>
    );

    expect(screen.getByText(/Personal Finance Desktop/i)).toBeVisible();
    expect(screen.getByText(/Financial cockpit/i)).toBeInTheDocument();
  });
});

