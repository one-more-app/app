import { Eye, EyeOff } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

type InputProps = React.ComponentProps<"input"> & {
    label?: React.ReactNode
    labelClassName?: string
    containerClassName?: string
    passwordToggle?: { showLabel: string; hideLabel: string }
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            type,
            label,
            labelClassName,
            containerClassName,
            id,
            passwordToggle,
            ...props
        },
        ref,
    ) => {
        const fallbackId = React.useId()
        const inputId = id ?? (label ? fallbackId : undefined)
        const [passwordVisible, setPasswordVisible] = React.useState(false)
        const isPasswordField = type === "password"
        const showReveal = Boolean(passwordToggle && isPasswordField)
        const effectiveType =
            showReveal && passwordVisible ? "text" : type

        const inputInner = (
            <input
                id={inputId}
                type={effectiveType}
                ref={ref}
                data-slot="input"
                className={cn(
                    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground  h-9 w-full min-w-0 rounded-lg bg-secondary px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                    showReveal && "pr-10",
                    className,
                )}
                {...props}
            />
        )

        const inputEl = showReveal && passwordToggle ? (
            <div className="relative">
                {inputInner}
                <button
                    type="button"
                    className="absolute inset-y-0 right-1 my-auto flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
                    aria-label={
                        passwordVisible
                            ? passwordToggle.hideLabel
                            : passwordToggle.showLabel
                    }
                    aria-pressed={passwordVisible}
                    onClick={() => setPasswordVisible((v) => !v)}
                >
                    {passwordVisible ? (
                        <EyeOff className="size-4 shrink-0" aria-hidden />
                    ) : (
                        <Eye className="size-4 shrink-0" aria-hidden />
                    )}
                </button>
            </div>
        ) : (
            inputInner
        )

        if (!label) return inputEl

        return (
            <div className={cn("flex flex-col gap-1.5", containerClassName)}>
                <label htmlFor={inputId} className={cn("text-sm font-medium", labelClassName)}>
                    {label}
                </label>
                {inputEl}
            </div>
        )
    },
)
Input.displayName = "Input"

export { Input }
