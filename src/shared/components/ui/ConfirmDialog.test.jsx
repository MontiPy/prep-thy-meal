// src/shared/components/ui/ConfirmDialog.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: 'Test Title',
    message: 'Test message',
  };

  it('renders dialog when isOpen is true', () => {
    render(<ConfirmDialog {...defaultProps} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('does not render dialog when isOpen is false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('uses default title when not provided', () => {
    render(<ConfirmDialog {...defaultProps} title={undefined} />);

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm and onClose when confirm button is clicked', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByText('Confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays custom button text', () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmText="Delete"
        cancelText="Keep"
      />
    );

    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Keep')).toBeInTheDocument();
  });

  it('handles different variants', () => {
    const { rerender } = render(
      <ConfirmDialog {...defaultProps} variant="danger" />
    );

    // Verify dialog renders (variant affects button color, not text)
    expect(screen.getByText('Confirm')).toBeInTheDocument();

    rerender(<ConfirmDialog {...defaultProps} variant="warning" />);
    expect(screen.getByText('Confirm')).toBeInTheDocument();

    rerender(<ConfirmDialog {...defaultProps} variant="info" />);
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(<ConfirmDialog {...defaultProps} />);

    // Dialog should have aria-labelledby pointing to title
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'confirm-dialog-description');
  });
});
