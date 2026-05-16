import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteEmployee } from '../lib/api';
import { AlertTriangle } from 'lucide-react';

export default function DeleteModal({ open, onClose, employee }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteEmployee(employee.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      onClose();
    },
  });

  if (!open || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 fade-in"
        style={{
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />
      <div
        className="relative rounded-2xl w-full max-w-sm p-8 text-center fade-up"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div
          className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-5"
          style={{ backgroundColor: 'var(--danger-light)' }}
        >
          <AlertTriangle size={26} style={{ color: 'var(--danger)' }} />
        </div>
        <h2
          className="text-base font-bold mb-1"
          style={{ color: 'var(--text-primary)' }}
        >
          Delete Employee?
        </h2>
        <p className="text-sm mb-7" style={{ color: 'var(--text-secondary)' }}>
          <span
            className="font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {employee.full_name}
          </span>{' '}
          will be permanently removed.{' '}
          <span style={{ color: 'var(--text-muted)' }}>
            This cannot be undone.
          </span>
        </p>
        <div className="flex gap-3 justify-center">
          <button className="btn-secondary flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-danger flex-1"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
        {mutation.isError && (
          <p className="text-sm mt-4" style={{ color: 'var(--danger)' }}>
            Failed to delete. Try again.
          </p>
        )}
      </div>
    </div>
  );
}
