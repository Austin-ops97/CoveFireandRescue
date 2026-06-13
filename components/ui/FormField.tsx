import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { checkboxBase, formErrorBase, hintBase, inputBase, labelBase, selectBase, textareaBase } from "@/lib/ui/classes";

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  className?: string;
};

export function FormField({
  id,
  label,
  required,
  hint,
  error,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelBase}>
        {label}
        {required && (
          <span className="ml-0.5 text-brand-red" aria-hidden>
            *
          </span>
        )}
        {required && <span className="sr-only"> (required)</span>}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && !error && (
        <p id={`${id}-hint`} className={hintBase}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className={formErrorBase} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  fieldClassName?: string;
};

export function Input({ className = "", fieldClassName = "", ...props }: InputProps) {
  return (
    <input
      className={`${inputBase} ${fieldClassName} ${className}`}
      aria-invalid={props["aria-invalid"]}
      {...props}
    />
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  fieldClassName?: string;
};

export function Select({ className = "", fieldClassName = "", children, ...props }: SelectProps) {
  return (
    <select className={`${selectBase} ${fieldClassName} ${className}`} {...props}>
      {children}
    </select>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  fieldClassName?: string;
};

export function Textarea({ className = "", fieldClassName = "", ...props }: TextareaProps) {
  return (
    <textarea className={`${textareaBase} ${fieldClassName} ${className}`} {...props} />
  );
}

type CheckboxFieldProps = {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  hint?: string;
};

export function CheckboxField({
  id,
  label,
  checked,
  onChange,
  disabled,
  hint,
}: CheckboxFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="inline-flex min-h-11 cursor-pointer items-start gap-3 text-base font-medium text-brand-charcoal sm:min-h-0 sm:gap-2.5 sm:text-sm"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          className={`${checkboxBase} mt-0.5`}
        />
        <span>{label}</span>
      </label>
      {hint && <p className={`${hintBase} ml-6`}>{hint}</p>}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <div className="mb-5 border-b border-gray-100 pb-4">
        <h3 className="text-base font-semibold text-brand-charcoal">{title}</h3>
        {description && <p className="mt-1 text-sm text-brand-gray">{description}</p>}
      </div>
      {children}
    </section>
  );
}
