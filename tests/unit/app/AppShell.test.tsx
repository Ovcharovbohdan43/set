import { render, screen } from '@testing-library/react';
import React from 'react';
import App from '@/app/App';
import { AppProviders } from '@/app/providers';

describe('App shell', () => {
  it('renders Stage 2 transactions workspace', () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>
    );

    expect(screen.getByText(/Personal Finance Desktop/i)).toBeVisible();
    expect(screen.getByText(/Transactions workspace/i)).toBeInTheDocument();
  });
});

