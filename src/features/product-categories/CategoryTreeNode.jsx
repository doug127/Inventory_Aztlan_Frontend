import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
} from "lucide-react";

export const CategoryTreeNode = ({
  node,
  level = 0,
  selectedId,
  onSelect,
}) => {
  // Solo los nodos raíz abiertos por defecto
  const [open, setOpen] = useState(false);

  const hasChildren = node.children && node.children.length > 0;

  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={`
          flex items-center gap-2 rounded-lg py-1 transition-colors
          ${
            isSelected
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-gray-100"
          }
        `}
        style={{
          paddingLeft: `${level * 18 + 8}px`,
        }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((prev) => !prev);
            }}
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-gray-200"
          >
            {open ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        <button
          type="button"
          onClick={() => onSelect(node)}
          className="flex flex-1 items-center gap-2 py-1 text-left"
        >
          <FolderTree
            className={`h-4 w-4 ${
              isSelected
                ? "text-blue-600"
                : "text-gray-500"
            }`}
          />

          <span className="truncate text-sm">
            {node.name}
          </span>
        </button>
      </div>

      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};