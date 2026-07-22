import { cn } from '../../lib/cn.js';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('card', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn('border-b border-border px-4 py-3', className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn('text-sm font-semibold text-fg', className)}>{children}</h3>;
}

export function CardBody({ className, children }) {
  return <div className={cn('p-4', className)}>{children}</div>;
}
