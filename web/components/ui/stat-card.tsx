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
    default: "border-border/70",
    primary: "border-accent/40",
    success: "border-success/35",
    warning: "border-warning/35",
  } as const;

  const iconColors = {
    default: "text-muted-foreground",
    primary: "text-accent",
    success: "text-success",
    warning: "text-warning",
  } as const;

  return (
    <div className={`glass-card p-6 ${variantClasses[variant]}`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-label">{label}</p>
        {Icon && <Icon className={`h-5 w-5 ${iconColors[variant]}`} strokeWidth={2} />}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-3">
          <h3 className="text-3xl font-bold tracking-tight text-foreground">
            {value}
          </h3>
          {trend && (
            <span
              className={`text-sm font-semibold ${
                trend.isPositive ? "text-success" : "text-destructive"
              }`}
            >
              {trend.isPositive ? "+" : ""}
              {trend.value}%
            </span>
          )}
        </div>

        {description && (
          <p className="text-xs text-muted-foreground/80">{description}</p>
        )}
      </div>

      {action && <div className="mt-4 border-t border-border/70 pt-4">{action}</div>}
    </div>
  );
}
