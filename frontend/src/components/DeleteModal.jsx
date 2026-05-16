import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteEmployee } from "../lib/api";
import { AlertTriangle } from "lucide-react";

export default function DeleteModal({ open, onClose, employee }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteEmployee(employee.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["employees"] }); onClose(); },
  });

  if (!open || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 rounded-full p-3">
            <AlertTriangle className="text-red-600" size={28} />
          </div>
        </div>
        <h2 className="text-lg font-semibold mb-1">Delete Employee?</h2>
        <p className="text-gray-500 text-sm mb-6">
          <span className="font-medium text-gray-800">{employee.full_name}</span> will be
          permanently removed. This cannot be undone.
        </p>
        <div className="flex gap-3 justify-center">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-danger"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
        {mutation.isError && (
          <p className="text-red-500 text-sm mt-3">Failed to delete. Try again.</p>
        )}
      </div>
    </div>
  );
}