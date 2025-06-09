import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  count?: number;
  circle?: boolean;
  animated?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function SkeletonLoader({
  width = "100%",
  height = "1rem",
  count = 1,
  circle = false,
  animated = true,
  className,
  children,
}: SkeletonLoaderProps) {
  const skeletonStyle = {
    width: typeof width === "number" ? `${width}px` : width,
    height: typeof height === "number" ? `${height}px` : height,
  };

  const skeletonClasses = cn(
    "bg-gray-200 dark:bg-gray-700 inline-block",
    {
      "rounded-full": circle,
      "rounded-md": !circle,
      "animate-shimmer": animated,
    },
    className
  );

  // If children are provided, render them with skeleton overlay
  if (children) {
    return (
      <div 
        className="relative"
        role="status"
        aria-label="Loading content"
      >
        <div className="opacity-0 pointer-events-none">
          {children}
        </div>
        <div 
          className={cn(skeletonClasses, "absolute inset-0")}
          style={skeletonStyle}
        />
      </div>
    );
  }

  // Render multiple skeleton elements
  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={skeletonClasses}
      style={skeletonStyle}
      role="status"
      aria-label={`Loading item ${index + 1} of ${count}`}
    />
  ));

  // Single skeleton
  if (count === 1) {
    return skeletons[0];
  }

  // Multiple skeletons in a container
  return (
    <div 
      className="space-y-2"
      role="status"
      aria-label={`Loading ${count} items`}
    >
      {skeletons}
    </div>
  );
}

// Convenience components for common patterns
export function SkeletonText({ 
  lines = 3, 
  className,
  ...props 
}: Omit<SkeletonLoaderProps, 'count'> & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} role="status" aria-label={`Loading ${lines} lines of text`}>
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonLoader
          key={index}
          height="0.875rem"
          width={index === lines - 1 ? "75%" : "100%"}
          {...props}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ 
  className,
  showAvatar = false,
  ...props 
}: SkeletonLoaderProps & { showAvatar?: boolean }) {
  return (
    <div 
      className={cn("p-4 space-y-3", className)}
      role="status"
      aria-label="Loading card content"
    >
      {showAvatar && (
        <div className="flex items-center space-x-3">
          <SkeletonLoader circle width={40} height={40} {...props} />
          <div className="space-y-2 flex-1">
            <SkeletonLoader height="1rem" width="60%" {...props} />
            <SkeletonLoader height="0.75rem" width="40%" {...props} />
          </div>
        </div>
      )}
      <SkeletonText lines={3} {...props} />
    </div>
  );
}

export function SkeletonTable({ 
  rows = 5, 
  columns = 4,
  className,
  ...props 
}: Omit<SkeletonLoaderProps, 'count'> & { 
  rows?: number; 
  columns?: number; 
}) {
  return (
    <div 
      className={cn("space-y-3", className)}
      role="status"
      aria-label={`Loading table with ${rows} rows and ${columns} columns`}
    >
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }, (_, index) => (
          <SkeletonLoader key={`header-${index}`} height="1.25rem" {...props} />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className="grid gap-4" 
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }, (_, colIndex) => (
            <SkeletonLoader 
              key={`cell-${rowIndex}-${colIndex}`} 
              height="1rem" 
              {...props} 
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ 
  items = 5,
  showIcon = false,
  className,
  ...props 
}: Omit<SkeletonLoaderProps, 'count'> & { 
  items?: number; 
  showIcon?: boolean; 
}) {
  return (
    <div 
      className={cn("space-y-3", className)}
      role="status"
      aria-label={`Loading list with ${items} items`}
    >
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className="flex items-center space-x-3">
          {showIcon && (
            <SkeletonLoader circle width={24} height={24} {...props} />
          )}
          <div className="flex-1 space-y-2">
            <SkeletonLoader height="1rem" width="70%" {...props} />
            <SkeletonLoader height="0.75rem" width="50%" {...props} />
          </div>
        </div>
      ))}
    </div>
  );
}