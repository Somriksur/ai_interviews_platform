"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Clock, FileCheck } from "lucide-react";

interface SelectionStatusCardProps {
  status: {
    driveId: string;
    driveName: string;
    organizationName: string;
    status: 'pending' | 'selected' | 'rejected' | 'completed';
    notes?: string;
    date: any;
  };
  onClick?: () => void;
  className?: string;
}

export function SelectionStatusCard({
  status,
  onClick,
  className,
}: SelectionStatusCardProps) {
  const getStatusConfig = (statusType: string) => {
    const configs: Record<string, {
      icon: React.ReactNode;
      badge: string;
      badgeClass: string;
      label: string;
    }> = {
      selected: {
        icon: <CheckCircle2 className="h-6 w-6 text-green-600" />,
        badge: 'Selected',
        badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        label: '🎉 Congratulations!',
      },
      rejected: {
        icon: <XCircle className="h-6 w-6 text-gray-600" />,
        badge: 'Not Selected',
        badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
        label: 'Selection Update',
      },
      pending: {
        icon: <Clock className="h-6 w-6 text-yellow-600" />,
        badge: 'Pending',
        badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        label: 'Awaiting Decision',
      },
      completed: {
        icon: <FileCheck className="h-6 w-6 text-blue-600" />,
        badge: 'Completed',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        label: 'Interview Completed',
      },
    };
    return configs[statusType] || configs.pending;
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString();
  };

  const config = getStatusConfig(status.status);

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-all",
        status.status === 'selected' && "border-green-200 dark:border-green-800",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              {config.icon}
              <div>
                <p className="text-sm text-muted-foreground">{config.label}</p>
                <p className="font-semibold text-lg">{status.driveName}</p>
              </div>
            </div>

            <div className="space-y-2 ml-9">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Organization:</span> {status.organizationName}
              </p>

              {status.notes && (
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm font-medium mb-1">College Notes:</p>
                  <p className="text-sm text-muted-foreground">{status.notes}</p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {formatDate(status.date)}
              </p>
            </div>
          </div>

          <Badge className={config.badgeClass}>
            {config.badge}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
