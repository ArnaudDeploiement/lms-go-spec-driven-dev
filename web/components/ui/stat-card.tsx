import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  action?: ReactNode;
  variant?: "default" | "primary" | "success" | "warning";
}

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  trend,
  action,
  variant = "default",
}: StatCardProps) {
  const variantClasses = {
    default: "border-[var(--border-subtle)]",
    primary: "border-[var(--accent-primary)]/30 glow-primary",
    success: "border-[var(--accent-success)]/30 glow-success",
    warning: "border-[var(--accent-warning)]/30",
  };

  const iconColors = {
    default: "text-[var(--text-tertiary)]",
    primary: "text-[var(--accent-primary)]",
    success: "text-[var(--accent-success)]",
    warning: "text-[var(--accent-warning)]",
  };

  return (
    <div className={`glass-card p-6 ${variantClasses[variant]}`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-label">{label}</p>
        {Icon && <Icon className={`h-5 w-5 ${iconColors[variant]}`} strokeWidth={2} />}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-3">
          <h3 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            {value}
          </h3>
          {trend && (
            <span
              className={`text-sm font-semibold ${
                trend.isPositive ? "text-[var(--accent-success)]" : "text-[var(--accent-error)]"
              }`}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
          )}
        </div>

        {description && (
          <p className="text-xs text-[var(--text-tertiary)]">{description}</p>
        )}
      </div>

      {action && <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">{action}</div>}
    </div>
  );
}
