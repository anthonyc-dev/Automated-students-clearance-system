import React, { useState } from "react";
import { type FieldError } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

interface FormInputProps {
  id: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  error?: FieldError;
  register: any;
  label?: string;
  className?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  id,
  type,
  placeholder,
  autoComplete,
  error,
  register,
  label,
  className,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === "password";
  const inputType = isPasswordField && showPassword ? "text" : type;

  return (
    <div>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-800 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          autoComplete={autoComplete}
          {...register(id)}
          className={`block w-full rounded-md bg-white px-3 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6 ${
            error ? "border border-red-500" : ""
          } ${isPasswordField ? "pr-10" : ""} ${className}`}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error.message}</p>}
    </div>
  );
};

export default FormInput;
