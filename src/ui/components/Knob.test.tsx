import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Knob } from './Knob';

describe('Knob', () => {
  it('renderiza com label e valor formatado', () => {
    render(<Knob label="Cutoff" value={1200} min={200} max={8000} unit="Hz" />);
    expect(screen.getByText('Cutoff')).toBeInTheDocument();
    expect(screen.getByText(/1200\s?Hz/)).toBeInTheDocument();
  });

  it('faz clamp do valor exibido aos limites', () => {
    render(<Knob label="X" value={9000} min={200} max={8000} unit="Hz" />);
    expect(screen.getByText(/8000\s?Hz/)).toBeInTheDocument();
  });
});
