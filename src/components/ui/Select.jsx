// components/ui/Select.jsx - Shadcn style Select
//
// The option list is portaled into document.body (position: fixed, placed
// via the trigger's getBoundingClientRect) instead of being an absolutely
// positioned child - some pages (e.g. candidate-profile/edit) wrap this in a
// card with `overflow: hidden` for rounded corners, which would otherwise
// clip the list as soon as it grows past the card edge.
import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";
import { cn } from "../../utils/cn";
import Input from "./Input";

const Select = React.forwardRef(({
    className,
    listClassName,
    options = [],
    value,
    defaultValue,
    placeholder = "Select an option",
    multiple = false,
    disabled = false,
    required = false,
    label,
    description,
    error,
    searchable = false,
    clearable = false,
    loading = false,
    id,
    name,
    onChange,
    onOpenChange,
    ...props
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [rect, setRect] = useState(null);
    const containerRef = useRef(null);
    const boxRef = useRef(null);
    const listRef = useRef(null);
    const instanceId = useId();

    // Generate unique ID if not provided
    const selectId = id || `select-${Math.random()?.toString(36)?.substr(2, 9)}`;

    // Filter options based on search
    const filteredOptions = searchable && searchTerm
        ? options?.filter(option =>
            option?.label?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
            (option?.value && option?.value?.toString()?.toLowerCase()?.includes(searchTerm?.toLowerCase()))
        )
        : options;

    // Get selected option(s) for display
    const getSelectedDisplay = () => {
        if (!value) return placeholder;

        if (multiple) {
            const selectedOptions = options?.filter(opt => value?.includes(opt?.value));
            if (selectedOptions?.length === 0) return placeholder;
            if (selectedOptions?.length === 1) return selectedOptions?.[0]?.label;
            return `${selectedOptions?.length} items selected`;
        }

        const selectedOption = options?.find(opt => opt?.value === value);
        return selectedOption ? selectedOption?.label : placeholder;
    };

    const closeDropdown = () => {
        setIsOpen(false);
        onOpenChange?.(false);
        setSearchTerm("");
    };

    const handleToggle = () => {
        if (disabled) return;
        if (isOpen) {
            closeDropdown();
            return;
        }
        // Tell any other open Select to close before this one opens.
        window.dispatchEvent(new CustomEvent("ui-select-open", { detail: { id: instanceId } }));
        setIsOpen(true);
        onOpenChange?.(true);
    };

    // Close on outside click, and when another Select opens.
    useEffect(() => {
        if (!isOpen) return undefined;

        const handleOutsideClick = (e) => {
            if (containerRef?.current?.contains(e?.target)) return;
            if (listRef?.current?.contains(e?.target)) return;
            closeDropdown();
        };
        const handleOtherSelectOpen = (e) => {
            if (e?.detail?.id !== instanceId) {
                closeDropdown();
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        window.addEventListener("ui-select-open", handleOtherSelectOpen);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            window.removeEventListener("ui-select-open", handleOtherSelectOpen);
        };
    }, [isOpen, instanceId]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const updateRect = () => setRect(boxRef.current?.getBoundingClientRect() ?? null);
        updateRect();
        window.addEventListener("scroll", updateRect, true);
        window.addEventListener("resize", updateRect);
        return () => {
            window.removeEventListener("scroll", updateRect, true);
            window.removeEventListener("resize", updateRect);
        };
    }, [isOpen]);

    const handleOptionSelect = (option) => {
        if (multiple) {
            const newValue = value || [];
            const updatedValue = newValue?.includes(option?.value)
                ? newValue?.filter(v => v !== option?.value)
                : [...newValue, option?.value];
            onChange?.(updatedValue);
        } else {
            onChange?.(option?.value);
            setIsOpen(false);
            onOpenChange?.(false);
        }
    };

    const handleClear = (e) => {
        e?.stopPropagation();
        onChange?.(multiple ? [] : '');
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e?.target?.value);
    };

    const isSelected = (optionValue) => {
        if (multiple) {
            return value?.includes(optionValue) || false;
        }
        return value === optionValue;
    };

    const hasValue = multiple ? value?.length > 0 : value !== undefined && value !== '';

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            {label && (
                <label
                    htmlFor={selectId}
                    className={cn(
                        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block",
                        error ? "text-destructive" : "text-foreground"
                    )}
                >
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </label>
            )}
            <div className="relative" ref={boxRef}>
                <button
                    ref={ref}
                    id={selectId}
                    type="button"
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-[9px] border border-input bg-white text-black px-3 py-2 text-sm placeholder:text-muted-foreground enabled:hover:border-[#e6a93c] enabled:hover:shadow-[0_0_0_3px_rgba(230,169,60,0.16)] focus:outline-none focus:border-[#e6a93c] focus:shadow-[0_0_0_3px_rgba(230,169,60,0.16)] disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-destructive",
                        !hasValue && "text-muted-foreground"
                    )}
                    onClick={handleToggle}
                    disabled={disabled}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    {...props}
                >
                    <div className="flex items-center gap-1.5 min-w-0">
                        {clearable && hasValue && !loading && (
                            <button
                                type="button"
                                aria-label="Clear selection"
                                onClick={handleClear}
                                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] text-red-400 transition-colors hover:bg-red-500/50 hover:text-black"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                        <span className="truncate">{getSelectedDisplay()}</span>
                    </div>

                    <div className="flex items-center gap-1">
                        {loading && (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        )}

                        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </div>
                </button>

                {/* Hidden native select for form submission */}
                <select
                    name={name}
                    value={value || ''}
                    onChange={() => { }} // Controlled by our custom logic
                    className="sr-only"
                    tabIndex={-1}
                    multiple={multiple}
                    required={required}
                >
                    <option value="">Select...</option>
                    {options?.map(option => (
                        <option key={option?.value} value={option?.value}>
                            {option?.label}
                        </option>
                    ))}
                </select>

                {/* Dropdown */}
                {isOpen && rect && createPortal(
                    <div
                        ref={listRef}
                        style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, width: "max-content", minWidth: rect.width, maxWidth: "90vw" }}
                        className={cn("z-50 bg-white text-black border border-border rounded-[9px] shadow-md p-1", listClassName)}
                    >
                        {searchable && (
                            <div className="p-2 border-b">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search options..."
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        className="pl-8"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="max-h-60 overflow-auto">
                            {filteredOptions?.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                    {searchTerm ? 'No options found' : 'No options available'}
                                </div>
                            ) : (
                                filteredOptions?.map((option, index) => {
                                    const previousGroup = index > 0 ? filteredOptions?.[index - 1]?.group : undefined;
                                    const showGroupHeader = option?.group && option?.group !== previousGroup;
                                    return (
                                        <React.Fragment key={option?.value}>
                                            {showGroupHeader && (
                                                <div className="px-[0.7em] pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    {option?.group}
                                                </div>
                                            )}
                                            <div
                                                className={cn(
                                                    "relative flex cursor-pointer select-none items-center rounded-[6px] px-[0.7em] py-[0.45em] text-sm outline-none transition-colors",
                                                    !multiple && isSelected(option?.value)
                                                        ? "bg-[#e6a93c]/[0.14] text-[#c98a1f] font-semibold"
                                                        : "hover:bg-[#e6a93c]/[0.126] hover:text-[#c98a1f]",
                                                    option?.disabled && "pointer-events-none opacity-50"
                                                )}
                                                onClick={() => !option?.disabled && handleOptionSelect(option)}
                                            >
                                                {multiple && (
                                                    <span
                                                        className={cn(
                                                            "mr-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-[#e6a93c] transition-colors",
                                                            isSelected(option?.value)
                                                                ? "bg-[#e6a93c] border-[#e6a93c] text-white"
                                                                : "bg-white"
                                                        )}
                                                    >
                                                        {isSelected(option?.value) && <Check className="h-3 w-3" />}
                                                    </span>
                                                )}
                                                <span className="flex-1">{option?.label}</span>
                                                {option?.description && (
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        {option?.description}
                                                    </span>
                                                )}
                                            </div>
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </div>
                    </div>,
                    document.body
                )}
            </div>
            {description && !error && (
                <p className="text-sm text-muted-foreground mt-1">
                    {description}
                </p>
            )}
            {error && (
                <p className="text-sm text-destructive mt-1">
                    {error}
                </p>
            )}
        </div>
    );
});

Select.displayName = "Select";

export default Select;