// components/ui/Select.jsx - Shadcn style Select
//
// The option list is portaled into document.body (position: fixed, placed
// via the trigger's getBoundingClientRect) instead of being an absolutely
// positioned child - some pages (e.g. candidate-profile/edit) wrap this in a
// card with `overflow: hidden` for rounded corners, which would otherwise
// clip the list as soon as it grows past the card edge. Near the bottom of
// the window it opens upward instead, so it never runs off-screen. The list
// is exactly as wide as the field and a long option wraps to a second line,
// unless `fitOptions` lets it grow to fit the longest option.
//
// Keyboard: ArrowDown/ArrowUp open a closed list; while open they move the
// highlighted option (Home/End jump to the ends), Enter or Space picks it and
// Escape closes. A searchable list puts the cursor in its search box right
// away, and Enter there picks the highlighted option, or the first match.
import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "../../utils/cn";
import Input from "./Input";

// The list is at most max-h-60 (240px) plus padding, and a search box when
// searchable. Open upward when that won't fit below but there's more room above.
const opensUp = (rect, searchable) => {
    const listHeight = 256 + (searchable ? 48 : 0);
    const below = window.innerHeight - rect.bottom;
    return below < listHeight && rect.top > below;
};

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
    multipleLabel, // (count) => text shown when 2+ options are picked, e.g. "3 benefits selected"
    // Lets the list grow past the field to fit its longest option, for a small
    // pill trigger only as wide as its label (e.g. the company-list filters).
    fitOptions = false,
    onKeyDown,
    ...props
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [rect, setRect] = useState(null);
    const [highlight, setHighlight] = useState(-1);
    const containerRef = useRef(null);
    const boxRef = useRef(null);
    const listRef = useRef(null);
    const triggerRef = useRef(null);
    const searchRef = useRef(null);
    const instanceId = useId();
    const listId = `${instanceId}-list`;
    const optionId = (index) => `${instanceId}-opt-${index}`;

    const setTriggerRef = (node) => {
        triggerRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
    };

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
            return multipleLabel ? multipleLabel(selectedOptions.length) : `${selectedOptions?.length} items selected`;
        }

        const selectedOption = options?.find(opt => opt?.value === value);
        return selectedOption ? selectedOption?.label : placeholder;
    };

    const closeDropdown = () => {
        setIsOpen(false);
        onOpenChange?.(false);
        setSearchTerm("");
        setHighlight(-1);
    };

    const openDropdown = (initialHighlight = -1) => {
        // Tell any other open Select to close before this one opens.
        window.dispatchEvent(new CustomEvent("ui-select-open", { detail: { id: instanceId } }));
        setHighlight(initialHighlight);
        setIsOpen(true);
        onOpenChange?.(true);
    };

    const handleToggle = () => {
        if (disabled) return;
        if (isOpen) {
            closeDropdown();
            return;
        }
        openDropdown();
    };

    // Next enabled option from `from` in direction `dir` (+1/-1); stays put
    // at either end of the list.
    const nextEnabled = (from, dir) => {
        const count = filteredOptions?.length || 0;
        for (let i = from + dir; i >= 0 && i < count; i += dir) {
            if (!filteredOptions?.[i]?.disabled) return i;
        }
        return from >= 0 && from < count ? from : -1;
    };

    // Arrow/Home/End movement shared by the trigger and the search box.
    const handleNavKey = (e) => {
        const count = filteredOptions?.length || 0;
        if (!count) return false;
        if (e.key === "ArrowDown") setHighlight((h) => nextEnabled(h, 1));
        else if (e.key === "ArrowUp") setHighlight((h) => nextEnabled(h < 0 ? count : h, -1));
        else if (e.key === "Home") setHighlight(nextEnabled(-1, 1));
        else if (e.key === "End") setHighlight(nextEnabled(count, -1));
        else return false;
        e.preventDefault();
        return true;
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

    // A searchable list takes the cursor as soon as it's on screen.
    const listShown = isOpen && !!rect;
    useEffect(() => {
        if (listShown && searchable) searchRef.current?.focus({ preventScroll: true });
    }, [listShown, searchable]);

    useEffect(() => {
        if (!isOpen || highlight < 0) return;
        document.getElementById(optionId(highlight))?.scrollIntoView({ block: "nearest" });
        // optionId only depends on instanceId, which never changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, highlight]);

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
        setHighlight(-1);
    };

    const pickAt = (index) => {
        const option = filteredOptions?.[index];
        if (!option || option.disabled) return;
        handleOptionSelect(option);
        if (!multiple) {
            setSearchTerm("");
            setHighlight(-1);
        }
    };

    const handleTriggerKeyDown = (e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented || disabled) return;
        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                openDropdown(searchable ? -1 : nextEnabled(-1, 1));
            }
            return;
        }
        if (e.key === "Escape") {
            e.preventDefault();
            closeDropdown();
            return;
        }
        if (handleNavKey(e)) return;
        if ((e.key === "Enter" || e.key === " ") && highlight >= 0) {
            e.preventDefault();
            pickAt(highlight);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (e.key === "Escape") {
            e.preventDefault();
            closeDropdown();
            triggerRef.current?.focus();
            return;
        }
        if (handleNavKey(e)) return;
        if (e.key === "Enter") {
            e.preventDefault();
            const index = highlight >= 0 ? highlight : nextEnabled(-1, 1);
            if (index < 0) return;
            pickAt(index);
            // A single pick closes the list (and its search box), so hand
            // focus back to the trigger instead of losing it to <body>.
            if (!multiple) triggerRef.current?.focus();
        }
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
                    ref={setTriggerRef}
                    id={selectId}
                    type="button"
                    role="combobox"
                    className={cn(
                        "flex h-10 w-full items-center justify-between rounded-[9px] border border-input bg-white text-black px-3 py-2 text-sm placeholder:text-muted-foreground enabled:hover:border-[#e6a93c] enabled:hover:shadow-[0_0_0_3px_rgba(230,169,60,0.18)] focus:outline-none focus:border-[#e6a93c] focus:shadow-[0_0_0_3px_rgba(230,169,60,0.18)] disabled:cursor-not-allowed disabled:opacity-50",
                        error && "border-destructive",
                        !hasValue && "text-muted-foreground"
                    )}
                    onClick={handleToggle}
                    onKeyDown={handleTriggerKeyDown}
                    disabled={disabled}
                    aria-expanded={isOpen}
                    aria-haspopup="listbox"
                    aria-controls={isOpen ? listId : undefined}
                    aria-activedescendant={isOpen && highlight >= 0 ? optionId(highlight) : undefined}
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
                        style={{
                            position: "fixed",
                            ...(opensUp(rect, searchable)
                                ? { bottom: window.innerHeight - rect.top + 4 }
                                : { top: rect.bottom + 4 }),
                            left: rect.left,
                            ...(fitOptions
                                ? { width: "max-content", minWidth: rect.width, maxWidth: "90vw" }
                                : { width: rect.width }),
                        }}
                        className={cn("z-50 bg-white text-[#0b1a2c] border border-[#e4e7ea] rounded-[10px] shadow-[0_14px_32px_-10px_rgba(11,26,44,0.28)] overflow-hidden", listClassName)}
                    >
                        {searchable && (
                            <div className="p-1.5 border-b border-[#eef0f3]">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8693a0]" />
                                    <Input
                                        ref={searchRef}
                                        placeholder="Search options…"
                                        value={searchTerm}
                                        onChange={handleSearchChange}
                                        onKeyDown={handleSearchKeyDown}
                                        role="combobox"
                                        aria-expanded="true"
                                        aria-controls={listId}
                                        aria-autocomplete="list"
                                        aria-activedescendant={highlight >= 0 ? optionId(highlight) : undefined}
                                        className="h-[34px] rounded-[8px] bg-white pl-8 pr-2.5 text-[13px] placeholder:text-[#8693a0] enabled:hover:shadow-[0_0_0_3px_rgba(230,169,60,0.18)] focus-visible:shadow-[0_0_0_3px_rgba(230,169,60,0.18)]"
                                    />
                                </div>
                            </div>
                        )}

                        <div
                            id={listId}
                            role="listbox"
                            aria-multiselectable={multiple || undefined}
                            className="max-h-60 overflow-auto overscroll-contain p-1 [scrollbar-color:#cbd2da_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-[#cbd2da] [&::-webkit-scrollbar]:w-1.5"
                        >
                            {filteredOptions?.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-[#5b6573]">
                                    {searchTerm ? 'No options found' : 'No options available'}
                                </div>
                            ) : (
                                filteredOptions?.map((option, index) => {
                                    const previousGroup = index > 0 ? filteredOptions?.[index - 1]?.group : undefined;
                                    const showGroupHeader = option?.group && option?.group !== previousGroup;
                                    return (
                                        <React.Fragment key={option?.value}>
                                            {showGroupHeader && (
                                                <div className="px-2.5 pt-2.5 pb-1 font-mono text-[10.5px] leading-[14px] font-semibold uppercase tracking-[0.08em] text-[#8693a0]">
                                                    {option?.group}
                                                </div>
                                            )}
                                            <div
                                                id={optionId(index)}
                                                role="option"
                                                aria-selected={isSelected(option?.value)}
                                                aria-disabled={option?.disabled || undefined}
                                                className={cn(
                                                    "relative flex min-h-9 cursor-pointer select-none items-center rounded-[7px] px-2.5 py-2 text-sm outline-none transition-colors",
                                                    !multiple && isSelected(option?.value)
                                                        ? "bg-[#fdf3e1] text-[#9a6410] font-semibold"
                                                        : "hover:bg-[#fdf3e1] hover:text-[#9a6410]",
                                                    index === highlight && "bg-[#fdf3e1] text-[#9a6410]",
                                                    option?.disabled && "pointer-events-none opacity-50"
                                                )}
                                                onClick={() => pickAt(index)}
                                            >
                                                {multiple && (
                                                    <span
                                                        className={cn(
                                                            "mr-2.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-[1.5px] border-[#e6a93c] transition-colors",
                                                            isSelected(option?.value) ? "bg-[#e6a93c]" : "bg-white"
                                                        )}
                                                    >
                                                        {isSelected(option?.value) && (
                                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                                <path d="M5 12.5l4.5 4.5L19 7.5" />
                                                            </svg>
                                                        )}
                                                    </span>
                                                )}
                                                <span className="min-w-0 flex-1 break-words">{option?.label}</span>
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