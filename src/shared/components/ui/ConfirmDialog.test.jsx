// src/shared/components/ui/ConfirmDialog.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Test Title',
    message: 'Test message',
  };

  it('renders dialog when isOpen is true', async () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(await screen.findByText('Test Title')).toBeInTheDocument();
    expect(await screen.findByText('Test message')).toBeInTheDocument();
  });

  it('does not render dialog when isOpen is false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('uses default title when not provided', async () => {
    render(<ConfirmDialog {...defaultProps} title={undefined} />);

    expect(await screen.findByText('Confirm Action')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const onClose = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

    const user = userEvent.setup();
    await user.click(await screen.findByText('Cancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and onClose when confirm button is clicked', async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} onConfirm={onConfirm} />);

    const user = userEvent.setup();
    await user.click(await screen.findByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays custom button text', async () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmText="Delete"
        cancelText="Keep"
      />
    );

    expect(await screen.findByText('Delete')).toBeInTheDocument();
    expect(await screen.findByText('Keep')).toBeInTheDocument();
  });

  it('handles different variants', async () => {
    const { rerender } = render(
      <ConfirmDialog {...defaultProps} variant="danger" />
    );

    // Verify dialog renders (variant affects button color, not text)
    expect(await screen.findByText('Confirm')).toBeInTheDocument();

    rerender(<ConfirmDialog {...defaultProps} variant="warning" />);
    expect(await screen.findByText('Confirm')).toBeInTheDocument();

    rerender(<ConfirmDialog {...defaultProps} variant="info" />);
    expect(await screen.findByText('Confirm')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', async () => {
    render(<ConfirmDialog {...defaultProps} />);

    // Dialog should have aria-labelledby pointing to title
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'confirm-dialog-description');
  });
});
