import { useState } from 'react'

import {
  ChevronRight,
  ChevronDown,
  FolderTree,
} from 'lucide-react'

export const CategoryTreeNode = ({
  node,
  level = 0,
}) => {

  const [open, setOpen] =
    useState(true)

  const hasChildren =
    node.children &&
    node.children.length > 0

  return (
    <div>

      <div
        className='flex items-center gap-2 h-9 rounded-lg px-2 hover:bg-muted/50 cursor-pointer'
        style={{
          paddingLeft: `${level * 18}px`,
        }}
        onClick={() => setOpen(!open)}
      >

        {hasChildren ? (
          open
            ? <ChevronDown className='h-4 w-4 text-muted-foreground' />
            : <ChevronRight className='h-4 w-4 text-muted-foreground' />
        ) : (
          <div className='w-4' />
        )}

        <FolderTree className='h-4 w-4 text-primary' />

        <span className='text-sm'>
          {node.name}
        </span>

      </div>

      {hasChildren && open && (

        <div className='space-y-1'>

          {node.children.map((child) => (

            <CategoryTreeNode
              key={child.id}
              node={child}
              level={level + 1}
            />

          ))}

        </div>

      )}

    </div>
  )
}