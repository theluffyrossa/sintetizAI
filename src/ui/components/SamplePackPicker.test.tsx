import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SamplePackPicker } from './SamplePackPicker';
import { SAMPLE_PACKS } from '@/constants/samplePacks';

function packButton(label: string): HTMLElement {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return screen.getByRole('button', { name: new RegExp(escaped) });
}

describe('SamplePackPicker', () => {
  it('renderiza todos os sample packs disponíveis', () => {
    render(<SamplePackPicker value={SAMPLE_PACKS[0]!.id} onChange={(): void => undefined} />);
    for (const pack of SAMPLE_PACKS) {
      expect(screen.getByText(pack.label)).toBeInTheDocument();
    }
  });

  it('marca o pack selecionado com aria-pressed', () => {
    const target = SAMPLE_PACKS[1]!;
    render(<SamplePackPicker value={target.id} onChange={(): void => undefined} />);
    expect(packButton(target.label)).toHaveAttribute('aria-pressed', 'true');
  });

  it('chama onChange com o id ao clicar em outro pack', () => {
    const onChange = vi.fn();
    const first = SAMPLE_PACKS[0]!;
    const second = SAMPLE_PACKS[1]!;
    render(<SamplePackPicker value={first.id} onChange={onChange} />);
    fireEvent.click(packButton(second.label));
    expect(onChange).toHaveBeenCalledWith(second.id);
  });

  it('desabilita todos os botões quando disabled=true', () => {
    render(<SamplePackPicker value={SAMPLE_PACKS[0]!.id} onChange={(): void => undefined} disabled />);
    for (const pack of SAMPLE_PACKS) {
      expect(packButton(pack.label)).toBeDisabled();
    }
  });
});
