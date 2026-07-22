import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { Input, Field } from './Input.jsx';
import { api, apiError } from '../../lib/api.js';

/**
 * Ask the signed-in user to re-enter their password before a sensitive action.
 * On success, runs `onConfirm` (async). Does not call the action until verified.
 */
export function PasswordConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Confirm with password',
  description = 'Enter your account password to continue.',
  confirmLabel = 'Confirm',
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setPassword('');
      setError('');
      setLoading(false);
    }
  }, [open]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!password.trim()) {
      setError('Password is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-password', { password });
      await onConfirm?.();
      onClose?.();
    } catch (err) {
      const e = apiError(err);
      setError(e.message || 'Incorrect password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={submit} loading={loading}>
            <Lock className="h-3.5 w-3.5" />
            {confirmLabel}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        {error && (
          <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>
        )}
        <Field label="Password" required>
          <Input
            type="password"
            autoComplete="current-password"
            autoFocus
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            invalid={!!error}
          />
        </Field>
      </form>
    </Modal>
  );
}
