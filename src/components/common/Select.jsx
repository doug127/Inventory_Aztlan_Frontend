import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

export const Select = forwardRef(
  (
    {
      error,
      className = "",
      options = [],
      placeholder = "Seleccione una opción",
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        <div className="relative">
          <select
            ref={ref}
            id={props.id}
            defaultValue=""
            {...props}
            className={`
              peer block w-full appearance-none bg-transparent border-0 border-b-2 py-2.5 pr-10
              pl-0 text-sm text-gray-900 focus:outline-none focus:ring-0 transition-colors hover:border-gray-400
              ${
                error
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-black"
              }
              ${className}
            `}
          >
            <option value="" disabled >
              {placeholder}
            </option>

            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="text-gray-900"
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-gray-500"
          />
        </div>

        {error && (
          <span className="mt-1 block text-sm text-red-500">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";