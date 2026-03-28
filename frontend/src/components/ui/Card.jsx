import { cn } from '@/utils/cn'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-200',
        'dark:bg-gray-800 dark:border-gray-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-b border-gray-100 dark:border-gray-700',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn(
        'text-lg font-semibold text-gray-900 dark:text-white',
        className
      )}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p
      className={cn(
        'text-sm text-gray-500 dark:text-gray-400 mt-1',
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl',
        'dark:border-gray-700 dark:bg-gray-800/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}