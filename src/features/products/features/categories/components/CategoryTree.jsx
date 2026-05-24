import { CategoryTreeNode } from './CategoryTreeNode'

export const CategoryTree = ({
  categories = [],
}) => {

  return (
    <div className='space-y-1'>

      {categories.map((category) => (

        <CategoryTreeNode
          key={category.id}
          node={category}
          level={0}
        />

      ))}

    </div>
  )
}