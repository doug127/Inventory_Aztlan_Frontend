import { cn } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  actions,
  className,
  actionsClassName,
  actionsPosition = 'center',
}) {
  const actionItems = Array.isArray(actions) ? actions : actions ? [actions] : []

  const positionClass = {
    top: 'self-start',
    center: 'self-center',
    bottom: 'self-end',
  }[actionsPosition] || 'self-center'

  return (
    <div className={cn('flex justify-between gap-4 mb-6', className)}>
      <div>
        <h1 className='text-xl font-semibold text-foreground'>{title}</h1>
        {description && <p className='mt-1 text-sm text-muted-foreground'>{description}</p>}
      </div>

      {actionItems.length > 0 && (
        <div className={cn('flex items-center gap-2 shrink-0', positionClass, actionsClassName)}>
          {actionItems.map((action, index) => (
            <div key={index}>{action}</div>
          ))}
        </div>
      )}
    </div>
  )
}
