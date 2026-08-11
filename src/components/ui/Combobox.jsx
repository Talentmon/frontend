// components/ui/Combobox.jsx - free-text input with filtered suggestions,
// plus a dropdown arrow that shows the full option list. Unlike Select,
// any typed value is accepted (not restricted to the known list).
//
// The option list is portaled into document.body (position: fixed, placed
// via the input box's getBoundingClientRect) instead of being an absolutely
// positioned child - some pages (e.g. candidate-profile/edit) wrap this in a
// card with `overflow: hidden` for rounded corners, which would otherwise
// clip the list as soon as it grows past the card edge.
import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, X } from "lucide-react";
import { cn } from "../../utils/cn";

const Combobox = React.forwardRef(({
    className,
    options = [],
    value,
    placeholder = "Type or choose from list",
    multiple = false,
    disabled = false,
    label,
    id,
    onChange = () => {},
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showFullList, setShowFullList] = useState(false);
    const [draft, setDraft] = useState("");
    const [rect, setRect] = useState(null);
    const containerRef = useRef(null);
    const boxRef = useRef(null);
    const listRef = useRef(null);
    const instanceId = useId();
    const comboId = id || `combo-${Math.random()?.toString(36)?.substr(2, 9)}`;

    const selectedValues = multiple ? (value || []) : [];
    const singleValue = multiple ? "" : (value || "");
    const inputValue = multiple ? draft : singleValue;

    const filterText = (showFullList ? "" : inputValue)?.toLowerCase();
    const visibleOptions = options
        ?.filter((opt) => !multiple || !selectedValues?.includes(opt))
        ?.filter((opt) => !filterText || opt?.toLowerCase()?.includes(filterText));

    const closeDropdown = () => {
        setIsOpen(false);
        setShowFullList(false);
    };

    const openDropdown = ({ full = false } = {}) => {
        if (disabled) return;
        window.dispatchEvent(new CustomEvent("ui-select-open", { detail: { id: instanceId } }));
        setShowFullList(full);
        setIsOpen(true);
    };

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleOutsideClick = (e) => {
            if (containerRef?.current?.contains(e?.target)) return;
            if (listRef?.current?.contains(e?.target)) return;
            closeDropdown();
        };
        const handleOtherOpen = (e) => {
            if (e?.detail?.id !== instanceId) closeDropdown();
        };

        document.addEventListener("mousedown", handleOutsideClick);
        window.addEventListener("ui-select-open", handleOtherOpen);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            window.removeEventListener("ui-select-open", handleOtherOpen);
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

    const commitSingle = (text) => {
        onChange(text);
        closeDropdown();
    };

    const addChip = (text) => {
        const v = text?.trim();
        if (!v || selectedValues?.includes(v)) {
            setDraft("");
            return;
        }
        onChange([...selectedValues, v]);
        setDraft("");
    };

    const removeChip = (text) => {
        onChange(selectedValues?.filter((v) => v !== text));
    };

    const handleInputChange = (e) => {
        const text = e?.target?.value;
        setShowFullList(false);
        if (multiple) {
            setDraft(text);
        } else {
            onChange(text);
        }
        if (!isOpen) openDropdown();
    };

    const handleKeyDown = (e) => {
        if (e?.key === "Enter") {
            e.preventDefault();
            if (multiple) addChip(draft);
            else closeDropdown();
        } else if (e?.key === "Escape") {
            closeDropdown();
        } else if (e?.key === "Backspace" && multiple && !draft && selectedValues?.length > 0) {
            removeChip(selectedValues?.[selectedValues.length - 1]);
        }
    };

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            {label && (
                <label htmlFor={comboId} className="text-sm font-medium leading-none mb-2 block text-foreground">
                    {label}
                </label>
            )}
            <div
                ref={boxRef}
                className={cn(
                    "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-white px-3 py-2 text-sm focus-within:border-[#e6a93c] focus-within:shadow-[0_0_0_3px_rgba(230,169,60,0.16)]",
                    !disabled && "hover:border-[#e6a93c] hover:shadow-[0_0_0_3px_rgba(230,169,60,0.16)]",
                    disabled && "cursor-not-allowed opacity-50"
                )}
            >
                {multiple && selectedValues?.map((v) => (
                    <span
                        key={v}
                        className="flex items-center gap-1 rounded-sm bg-[#e6a93c]/15 px-2 py-0.5 text-xs font-medium text-[#c98a1f]"
                    >
                        {v}
                        <button
                            type="button"
                            aria-label={`Remove ${v}`}
                            onClick={() => removeChip(v)}
                            className="hover:text-[#8a6415]"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </span>
                ))}
                <input
                    ref={ref}
                    id={comboId}
                    type="text"
                    disabled={disabled}
                    placeholder={multiple && selectedValues?.length > 0 ? "" : placeholder}
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => openDropdown()}
                    onKeyDown={handleKeyDown}
                    className="min-w-[80px] flex-1 border-none bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                />
                <button
                    type="button"
                    aria-label="Show all options"
                    disabled={disabled}
                    onClick={() => (isOpen && showFullList ? closeDropdown() : openDropdown({ full: true }))}
                    className="shrink-0 text-muted-foreground"
                >
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                </button>
            </div>

            {isOpen &&
                rect &&
                createPortal(
                    <div
                        ref={listRef}
                        style={{ position: "fixed", top: rect.bottom + 4, left: rect.left, width: rect.width }}
                        className="z-50 bg-white text-black border border-border rounded-md shadow-md"
                    >
                        <div className="py-1 max-h-60 overflow-auto">
                            {visibleOptions?.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-muted-foreground">No matches - press Enter to use your own text</div>
                            ) : (
                                visibleOptions?.map((opt, i) => (
                                    <div
                                        key={`${opt}-${i}`}
                                        className="relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors hover:bg-[#e6a93c]/10 hover:text-[#c98a1f]"
                                        onClick={() => (multiple ? addChip(opt) : commitSingle(opt))}
                                    >
                                        <span className="flex-1">{opt}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>,
                    document.body
                )}
        </div>
    );
});

Combobox.displayName = "Combobox";

export default Combobox;
