import { WarningOctagon } from '@phosphor-icons/react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Delete', loading, tone = 'danger', children }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      icon={WarningOctagon}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children || <p className="text-sm leading-relaxed text-ink-600">This action cannot be undone.</p>}
    </Modal>
  );
}
