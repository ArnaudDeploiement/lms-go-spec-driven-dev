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
      className: "border-[var(--accent-success)]/30 bg-[var(--accent-success)]/10",
      iconColor: "text-[var(--accent-success)]",
      textColor: "text-[var(--accent-success)]",
    },
    error: {
      icon: XCircle,
      className: "border-[var(--accent-error)]/30 bg-[var(--accent-error)]/10",
      iconColor: "text-[var(--accent-error)]",
      textColor: "text-[var(--accent-error)]",
    },
    warning: {
      icon: AlertCircle,
      className: "border-[var(--accent-warning)]/30 bg-[var(--accent-warning)]/10",
      iconColor: "text-[var(--accent-warning)]",
      textColor: "text-[var(--accent-warning)]",
    },
    info: {
      icon: Info,
      className: "border-[var(--accent-info)]/30 bg-[var(--accent-info)]/10",
      iconColor: "text-[var(--accent-info)]",
      textColor: "text-[var(--accent-info)]",
    },
  };

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
          <div className="text-sm text-[var(--text-secondary)]">{children}</div>
        </div>
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
