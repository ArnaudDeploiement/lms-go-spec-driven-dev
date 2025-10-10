"use client";

import { AlertCircle, CheckCircle, Info, XCircle, X } from "lucide-react";
import { ReactNode, useState } from "react";

interface AlertProps {
  variant: "success" | "error" | "warning" | "info";
  title?: string;
  children: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function Alert({
  variant,
  title,
  children,
  dismissible = false,
  onDismiss,
}: AlertProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const variants = {
    success: {
      icon: CheckCircle,
      className: "border-success/30 bg-success/10",
      iconColor: "text-success",
      textColor: "text-success",
    },
    error: {
      icon: XCircle,
      className: "border-destructive/30 bg-destructive/10",
      iconColor: "text-destructive",
      textColor: "text-destructive",
    },
    warning: {
      icon: AlertCircle,
      className: "border-warning/30 bg-warning/10",
      iconColor: "text-warning",
      textColor: "text-warning",
    },
    info: {
      icon: Info,
      className: "border-accent/30 bg-accent-muted/40",
      iconColor: "text-accent",
      textColor: "text-accent",
    },
  } as const;

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      className={`glass-card p-4 animate-slide-in ${config.className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 flex-shrink-0 ${config.iconColor}`} />
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`text-sm font-semibold mb-1 ${config.textColor}`}>
              {title}
            </h4>
          )}
          <div className="text-sm text-muted-foreground">{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
