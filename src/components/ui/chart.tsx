"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config?: {
      [key: string]: {
        label?: string;
        icon?: React.ComponentType<{ className?: string }>;
        color?: string;
      };
    };
  }
>(({ className, config, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "w-full h-full [&_.recharts-tooltip-item-separator]:w-full",
      className
    )}
    {...props}
  >
    {children}
    {config && (
      <ChartLegend config={config} />
    )}
  </div>
));
ChartContainer.displayName = "ChartContainer";

const ChartTooltip = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    active?: boolean;
    payload?: Array<{
      color?: string;
      value?: number | string;
      name?: string;
      payload?: any;
      dataKey?: string;
    }>;
    label?: string;
  }
>(({ className, active, payload, label, ...props }, ref) => {
  if (!active) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "grid min-w-[8rem] gap-1 rounded-md border bg-background p-2 text-xs shadow-md",
        className
      )}
      {...props}
    >
      {label && <div className="text-muted-foreground">{label}</div>}
      {payload?.map((item, index) => (
        <div key={index} className="flex gap-1 items-center">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="font-medium">{item.dataKey || item.name}</span>:{" "}
          <span className="font-mono font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  );
});
ChartTooltip.displayName = "ChartTooltip";

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
ChartTooltipContent.displayName = "ChartTooltipContent";

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config?: {
      [key: string]: {
        label?: string;
        icon?: React.ComponentType<{ className?: string }>;
        color?: string;
      };
    };
  }
>(({ className, config, ...props }, ref) => {
  if (!config) return null;

  return (
    <div
      ref={ref}
      className={cn("flex flex-wrap gap-4", className)}
      {...props}
    >
      {Object.entries(config).map(([key, item]) => (
        <div key={key} className="flex items-center gap-1.5">
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-muted-foreground">{item.label || key}</span>
        </div>
      ))}
    </div>
  );
});
ChartLegend.displayName = "ChartLegend";

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
ChartLegendContent.displayName = "ChartLegendContent";

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent };