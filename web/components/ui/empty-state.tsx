import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="empty-state animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 blur-3xl opacity-20 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-full" />
        <Icon className="empty-state-icon relative" strokeWidth={1.5} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
