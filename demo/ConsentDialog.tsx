import { useRef, type RefObject } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

interface ConsentDialogProps {
  open: boolean;
  returnFocusTo: RefObject<HTMLElement | null>;
  onAccept: () => void;
  onReject: () => void;
  onDismiss: () => void;
}

export function ConsentDialog({
  open,
  returnFocusTo,
  onAccept,
  onReject,
  onDismiss,
}: ConsentDialogProps) {
  const rejectRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onDismiss()}>
      <Dialog.Portal>
        <Dialog.Overlay className="consent-overlay" />
        <Dialog.Content
          className="consent"
          aria-modal="true"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            rejectRef.current?.focus();
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocusTo.current?.focus();
          }}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <div className="consent__text">
            <Dialog.Title className="consent__title">Cookies</Dialog.Title>
            <Dialog.Description className="consent__desc">
              We use cookies for analytics and advertising. Rejecting is as easy as
              accepting, and you can change your mind any time from Cookie settings.
            </Dialog.Description>
          </div>
          <div className="consent__actions">
            <button ref={rejectRef} type="button" className="btn btn--primary" onClick={onReject}>
              Reject
            </button>
            <button type="button" className="btn btn--primary" onClick={onAccept}>
              Accept
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
