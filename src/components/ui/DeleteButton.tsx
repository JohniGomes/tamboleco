"use client";

import { useTransition } from "react";

export function DeleteButton({
  onDelete,
  confirmMessage = "Tem certeza que deseja excluir este registro? Essa ação não pode ser desfeita.",
  title = "Excluir",
}: {
  onDelete: () => Promise<void>;
  confirmMessage?: string;
  title?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      title={title}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(() => onDelete());
      }}
      className="flex h-6 w-6 items-center justify-center rounded-full text-lg font-bold leading-none text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      ×
    </button>
  );
}
