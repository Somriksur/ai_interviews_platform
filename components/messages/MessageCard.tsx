"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Mail, Users, TrendingUp } from "lucide-react";

interface MessageCardProps {
  message: {
    id: string;
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high';
    targetType: 'all' | 'specific';
    totalRecipients: number;
    readCount: number;
    createdAt: any;
  };
  onClick?: () => void;
  className?: string;
}

export function MessageCard({ message, onClick, className }: MessageCardProps) {
  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      high: {
        label: 'HIGH',
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      },
      medium: {
        label: 'MEDIUM',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      },
      low: {
        label: 'LOW',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
    };
    return variants[priority] || variants.medium;
  };

  const getReadRate = () => {
    if (message.totalRecipients === 0) return 0;
    return Math.round((message.readCount / message.totalRecipients) * 100);
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleString();
  };

  const priorityBadge = getPriorityBadge(message.priority);
  const readRate = getReadRate();

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-lg">{message.title}</CardTitle>
              <Badge className={priorityBadge.className}>
                {priorityBadge.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(message.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{readRate}%</div>
            <p className="text-xs text-muted-foreground">Read Rate</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4 line-clamp-2">{message.content}</p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{message.totalRecipients} recipients</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            <span>{message.readCount} reads</span>
          </div>
          <Badge variant="outline">
            {message.targetType === 'all' ? 'All Students' : 'Specific Students'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
