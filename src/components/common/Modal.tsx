import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  headerClassName?: string;
  wide?: boolean;
  footer?: ReactNode;
}

export function Modal({ open, onClose, title, children, headerClassName, wide, footer }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal open" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-content ${wide ? 'modal-wide' : ''}`}>
        <div className={`modal-header ${headerClassName || ''}`}>
          <h2>{title}</h2>
          <span className="close" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
