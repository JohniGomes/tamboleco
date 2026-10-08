import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import clsx from "clsx";

export function Table({
  className,
  fit = false,
  ...props
}: HTMLAttributes<HTMLTableElement> & { fit?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table
        className={clsx(
          "w-full text-sm",
          fit ? "[&_td]:px-3 [&_th]:px-3" : "min-w-max",
          className
        )}
        {...props}
      />
    </div>
  );
}

export function Thead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={clsx("bg-tamboleco-950 text-white", className)} {...props} />;
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide", className)}
      {...props}
    />
  );
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={clsx("px-4 py-3 text-gray-700", className)} {...props} />;
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={clsx("border-b border-gray-100 last:border-0 hover:bg-gray-50", className)} {...props} />;
}
