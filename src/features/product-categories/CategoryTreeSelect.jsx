import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  FolderTree,
  Search,
} from "lucide-react";

import { CategoryTreeNode } from "./CategoryTreeNode";

export const CategoryTreeSelect = ({
  disabled = false,
  tree = [],
  value = null,
  onChange,
  placeholder = "Seleccionar categoría",
}) => {
  const [open, setOpen] = useState(false);

  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        ref.current &&
        !ref.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  return (
    <div
      ref={ref}
      className="relative w-full"
    >
      <button
        type="button"
        onClick={() => {
          if (disabled) return;
          setOpen(!open);
        }}
        className={`
          flex w-full items-center justify-between
          rounded-lg border border-gray-300
          bg-white px-3 py-2.5
          text-left
          shadow-sm
          hover:border-gray-400
          focus:outline-none
          focus:ring-2
          focus:ring-gray-200
          ${disabled
            ? "cursor-not-allowed bg-gray-100 opacity-60"
            : ""
          }
        `}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <FolderTree className="h-4 w-4 text-gray-500" />

          <span
            className={`truncate ${
              value
                ? "text-gray-900"
                : "text-gray-400"
            }`}
          >
            {value?.name ?? placeholder}
          </span>
        </div>

        <ChevronDown
          className={`h-4 w-4 transition-transform ${
            open
              ? "rotate-180"
              : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="
            absolute left-0 right-0 z-50 mt-2
            overflow-hidden
            rounded-xl
            border border-gray-200
            bg-white
            shadow-xl
          "
        >
          <div className="max-h-80 overflow-y-auto p-2">
            {tree.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-400">
                No hay categorías
              </div>
            ) : (
              tree.map((node) => (
                <CategoryTreeNode
                  key={node.id}
                  node={node}
                  selectedId={value?.id}
                  onSelect={(category) => {
                    onChange(category);
                    setOpen(false);
                  }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};