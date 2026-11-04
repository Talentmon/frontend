// components/ui/Combobox.jsx - free-text input with filtered suggestions.
// Unlike Select, any typed value is accepted (not restricted to the known
// list). Clicking or focusing the input shows the suggestions.
//
// The option list is portaled into document.body (position: fixed, placed
// via the input box's getBoundingClientRect) instead of being an absolutely
// positioned child - some pages (e.g. candidate-profile/edit) wrap this in a
// card with `overflow: hidden` for rounded corners, which would otherwise
// clip the list as soon as it grows past the card edge. Near the bottom of
// the window it opens upward instead.
//
// Keyboard: ArrowDown/ArrowUp move the highlighted suggestion (ArrowDown
// also opens a closed list), Home/End jump to the ends, Escape closes.
// Enter adds the highlighted suggestion; with none highlighted it adds the
// suggestion matching the typed text, then the first suggestion containing
// it, and only then the typed text itself.
import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import useTrackedRect from "./useTrackedRect";

const LIST_HEIGHT = 248;
const opensUp = (rect) => {
    const below = window.innerHeight - rect.bottom;
    return below < LIST_HEIGHT && rect.top > below;
};

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
    const [draft, setDraft] = useState("");
    const [highlight, setHighlight] = useState(-1);
    const containerRef = useRef(null);
    const boxRef = useRef(null);
    // Where the field is, kept current every frame while the list is open.
    const rect = useTrackedRect(boxRef, isOpen);
    const listRef = useRef(null);
    const instanceId = useId();
    const comboId = id || `combo-${Math.random()?.toString(36)?.substr(2, 9)}`;
    const listId = `${instanceId}-list`;
    const optionId = (index) => `${instanceId}-opt-${index}`;

    const selectedValues = multiple ? (value || []) : [];
    const singleValue = multiple ? "" : (value || "");
    const inputValue = multiple ? draft : singleValue;

    const filterText = inputValue?.trim()?.toLowerCase();
    const visibleOptions = options
        ?.filter((opt) => !multiple || !selectedValues?.includes(opt))
        ?.filter((opt) => !filterText || opt?.toLowerCase()?.includes(filterText));

    const closeDropdown = () => {
        setIsOpen(false);
        setHighlight(-1);
    };

    const openDropdown = (initialHighlight = -1) => {
        if (disabled) return;
        window.dispatchEvent(new CustomEvent("ui-select-open", { detail: { id: instanceId } }));
        setHighlight(initialHighlight);
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
        if (!isOpen || highlight < 0) return;
        document.getElementById(optionId(highlight))?.scrollIntoView({ block: "nearest" });
        // optionId only depends on instanceId, which never changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, highlight]);

    const commitSingle = (text) => {
        onChange(text);
        closeDropdown();
    };

    const addChip = (text) => {
        const v = text?.trim();
        setDraft("");
        setHighlight(-1);
        if (!v || selectedValues?.includes(v)) return;
        onChange([...selectedValues, v]);
    };

    const removeChip = (text) => {
        onChange(selectedValues?.filter((v) => v !== text));
    };

    const pick = (opt) => (multiple ? addChip(opt) : commitSingle(opt));

    const handleInputChange = (e) => {
        const text = e?.target?.value;
        if (multiple) {
            setDraft(text);
        } else {
            onChange(text);
        }
        setHighlight(-1);
        if (!isOpen) openDropdown();
    };

    // What Enter adds when nothing is highlighted: the suggestion that
    // matches the typed text exactly, else the first one containing it,
    // else the typed text as it is.
    const resolveTyped = (text) => {
        const lower = text.toLowerCase();
        return options?.find((opt) => opt?.toLowerCase() === lower)
            || visibleOptions?.[0]
            || text;
    };

    const handleKeyDown = (e) => {
        const count = visibleOptions?.length || 0;
        if (e?.key === "ArrowDown") {
            e.preventDefault();
            if (!isOpen) openDropdown(count ? 0 : -1);
            else if (count) setHighlight((h) => Math.min(count - 1, h + 1));
        } else if (e?.key === "ArrowUp" && isOpen && count) {
            e.preventDefault();
            setHighlight((h) => (h < 0 ? count - 1 : Math.max(0, h - 1)));
        } else if ((e?.key === "Home" || e?.key === "End") && isOpen && count) {
            e.preventDefault();
            setHighlight(e.key === "Home" ? 0 : count - 1);
        } else if (e?.key === "Enter") {
            e.preventDefault();
            if (isOpen && highlight >= 0 && highlight < count) {
                pick(visibleOptions[highlight]);
                return;
            }
            const text = inputValue?.trim();
            if (multiple) {
                if (text) addChip(resolveTyped(text));
            } else {
                closeDropdown();
            }
        } else if (e?.key === "Escape") {
            closeDropdown();
        } else if (e?.key === "Backspace" && multiple && !draft && selectedValues?.length > 0) {
            removeChip(selectedValues?.[selectedValues.length - 1]);
        }
    };

    const emptyText = filterText
        ? "No matches – press Enter to use your own text"
        : "No more options";

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
                    "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-[9px] border border-input bg-white px-2 py-[5px] text-sm transition-[border-color,box-shadow] focus-within:border-[#e6a93c] focus-within:shadow-[0_0_0_3px_rgba(230,169,60,0.18)]",
                    !disabled && "hover:border-[#e6a93c] hover:shadow-[0_0_0_3px_rgba(230,169,60,0.18)]",
                    disabled && "cursor-not-allowed opacity-50"
                )}
            >
                {multiple && selectedValues?.map((v) => (
                    <span
                        key={v}
                        className="inline-flex h-[26px] items-center gap-0.5 rounded-[6px] bg-[#FDF3E1] pl-2 pr-0.5 text-[13px] font-semibold text-[#9A6410]"
                    >
                        {v}
                        <button
                            type="button"
                            aria-label={`Remove ${v}`}
                            onClick={() => removeChip(v)}
                            className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] hover:bg-[#F6E3BE]"
                        >
                            <X className="h-3 w-3" strokeWidth={2.6} />
                        </button>
                    </span>
                ))}
                <input
                    ref={ref}
                    id={comboId}
                    type="text"
                    role="combobox"
                    aria-expanded={isOpen}
                    aria-controls={isOpen ? listId : undefined}
                    aria-autocomplete="list"
                    aria-activedescendant={isOpen && highlight >= 0 ? optionId(highlight) : undefined}
                    disabled={disabled}
                    placeholder={multiple && selectedValues?.length > 0 ? "" : placeholder}
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={() => !isOpen && openDropdown()}
                    onClick={() => !isOpen && openDropdown()}
                    onKeyDown={handleKeyDown}
                    className="h-7 min-w-[96px] flex-1 border-none bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
                />
            </div>

            {isOpen &&
                rect &&
                createPortal(
                    <div
                        ref={listRef}
                        data-floating-menu=""
                        style={{
                            position: "fixed",
                            ...(opensUp(rect)
                                ? { bottom: window.innerHeight - rect.top + 4 }
                                : { top: rect.bottom + 4 }),
                            left: rect.left,
                            width: rect.width,
                        }}
                        className="z-50 bg-white text-[#0b1a2c] border border-[#e4e7ea] rounded-[10px] shadow-[0_14px_32px_-10px_rgba(11,26,44,0.28)] overflow-hidden"
                    >
                        <div
                            id={listId}
                            role="listbox"
                            className="max-h-60 overflow-auto overscroll-contain p-1 [scrollbar-color:#cbd2da_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-[3px] [&::-webkit-scrollbar-thumb]:bg-[#cbd2da] [&::-webkit-scrollbar]:w-1.5"
                        >
                            {visibleOptions?.length === 0 ? (
                                <div className="px-3 py-2 text-sm text-[#5b6573]">{emptyText}</div>
                            ) : (
                                visibleOptions?.map((opt, i) => (
                                    <div
                                        key={`${opt}-${i}`}
                                        id={optionId(i)}
                                        role="option"
                                        aria-selected={i === highlight}
                                        className={cn(
                                            "relative flex min-h-9 cursor-pointer select-none items-center rounded-[7px] px-2.5 py-2 text-sm outline-none transition-colors hover:bg-[#fdf3e1] hover:text-[#9a6410]",
                                            i === highlight && "bg-[#fdf3e1] text-[#9a6410]"
                                        )}
                                        onClick={() => pick(opt)}
                                    >
                                        <span className="min-w-0 flex-1 break-words">{opt}</span>
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
