import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRef } from "react";

export const Input = ({
  label,
  error,
  validationType,
  compareWith,
  type = "text",
  className = "",
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState("");

  const inputRef = useRef(null);
  const value = props.value !== undefined && props.value !== null ? String(props.value) : "";
  
  const [hasValue, setHasValue] = useState(Boolean(props.value));

  useEffect(() => {
    setHasValue(value !== "");
  }, [value]);

  const updateValueState = () => {
    setHasValue(inputRef.current?.value !== "");
  };
  
  useEffect(() => {
    if (!value) {
      setValidationError("");
      return;
    }

    switch (validationType) {
      case "email": {
        const emailRegex = /\S+@\S+\.\S+/;
        setValidationError(
          emailRegex.test(value)
            ? ""
            : "Formato de correo electrónico inválido."
        );
        break;
      }

      case "password": {
        const hasUpper = /[A-Z]/.test(value);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
        const hasNumber = /\d/.test(value);

        setValidationError(
          !hasUpper || !hasSpecial || !hasNumber
            ? "Debe contener una mayúscula, un número y un carácter especial."
            : ""
        );

        break;
      }

      case "passwordConfirm": {
        setValidationError(
          value !== compareWith
            ? "Las contraseñas no coinciden."
            : ""
        );
        break;
      }

      case "username": {
        setValidationError(
          value.length < 3
            ? "Debe contener al menos 3 caracteres."
            : ""
        );
        break;
      }

      default:
        setValidationError("");
    }
  }, [value, validationType, compareWith]);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="relative flex w-full flex-col">
      <label
        className={`pointer-events-none absolute left-3 transition-all duration-200
        ${
          focused || hasValue
            ? "-top-2 bg-white px-1 text-xs text-gray-600"
            : "top-2.5 text-sm text-gray-400"
        }`}
      >
        {label}
      </label>

      <div className="flex">
        <input
          {...props}
          ref={(element) => {
            inputRef.current = element;

            if (typeof props.ref === "function") {
              props.ref(element)
            } else if (props.ref) {
              props.ref.current = element;
            }
          }}
          type={
            type === "password"
              ? showPassword
                ? "text"
                : "password"
              : type
          }
          onChange={(e) => {
            props.onChange?.(e);
            updateValueState();
          }}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            updateValueState();
            props.onBlur?.(e);
          }}
          className={`
            w-full rounded-lg border bg-white px-3 py-2.5 text-sm
            outline-none transition-all
            ${
              error || validationError
                ? "border-red-500 focus:ring-red-200"
                : "border-gray-300 focus:border-black focus:ring-2 focus:ring-gray-200"
            }
            ${type === "password" ? "rounded-r-none" : ""}
            ${className}
          `}
        />

        {type === "password" && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="rounded-r-lg border border-l-0 border-gray-300 bg-white px-3 hover:bg-gray-50"
          >
            {showPassword ? (
              <EyeOff size={18} />
            ) : (
              <Eye size={18} />
            )}
          </button>
        )}
      </div>

      {(error || validationError) && (
        <span className="mt-1 text-sm text-red-500">
          {error || validationError}
        </span>
      )}
    </div>
  );
};