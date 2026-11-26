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
//
// Multiple only: `selectAll` puts "Select all (N)" on top of the list (what
// it lists, so typing narrows it); once every option is picked it turns into
// "Remove all (N)", which takes off just those. `maxRows`: the chips grow to
// that many rows, then scroll inside the field. `invalid` draws it red.
import React, { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCheck, X } from "lucide-react";
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
    selectAll = false,
    maxRows,
    invalid = false,
    "aria-describedby": describedBy,
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
    const hasChips = selectedValues.length > 0;
    const singleValue = multiple ? "" : (value || "");
    const inputValue = multiple ? draft : singleValue;

    const filterText = inputValue?.trim()?.toLowerCase();
    const visibleOptions = options
        ?.filter((opt) => !multiple || !selectedValues?.includes(opt))
        ?.filter((opt) => !filterText || opt?.toLowerCase()?.includes(filterText));

    // "Select all" adds what the list shows; with nothing left to add (and
    // nothing typed) it's "Remove all", for the picks that are in `options`.
    const pickedFromOptions = multiple ? options?.filter((opt) => selectedValues?.includes(opt)) : [];
    const bulk = !multiple || !selectAll
        ? null
        : visibleOptions?.length > 0
            ? { add: true, count: visibleOptions.length }
            : !filterText && pickedFromOptions?.length > 0
                ? { add: false, count: pickedFromOptions.length }
                : null;
    const handleBulk = () => {
        if (!bulk) return;
        onChange(bulk.add
            ? [...selectedValues, ...visibleOptions]
            : selectedValues.filter((v) => !options?.includes(v)));
        setDraft("");
        setHighlight(-1);
    };

    // With `maxRows`, the newest chip and the typing spot stay in view as chips are added.
    const chipCount = selectedValues.length;
    const lastChipCount = useRef(chipCount);
    useEffect(() => {
        if (maxRows && chipCount > lastChipCount.current && boxRef.current) {
            boxRef.current.scrollTop = boxRef.current.scrollHeight;
        }
        lastChipCount.current = chipCount;
    }, [chipCount, maxRows]);
    // 26px chips, 6px apart, 5px padding and 1px border top and bottom.
    const maxBoxHeight = maxRows ? maxRows * 26 + (maxRows - 1) * 6 + 12 : undefined;

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
            // Closing an open list uses up the Escape (as Select's does), so the
            // panel or drawer around it stays open; with the list closed it passes on.
            if (isOpen) e.preventDefault();
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
                style={maxBoxHeight ? { maxHeight: maxBoxHeight } : undefined}
                className={cn(
                    "flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-[9px] border border-input bg-white px-2 py-[5px] text-sm transition-[border-color,box-shadow] focus-within:border-[#e6a93c] focus-within:shadow-[0_0_0_3px_rgba(230,169,60,0.18)]",
                    !disabled && "hover:border-[#e6a93c] hover:shadow-[0_0_0_3px_rgba(230,169,60,0.18)]",
                    maxBoxHeight && "overflow-y-auto overscroll-contain [scrollbar-color:#cbd2da_transparent] [scrollbar-width:thin]",
                    invalid && "border-[#d64545] focus-within:border-[#d64545] focus-within:shadow-[0_0_0_3px_rgba(214,69,69,0.16)]",
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
                    aria-invalid={invalid || undefined}
                    aria-describedby={describedBy}
                    disabled={disabled}
                    placeholder={hasChips ? "" : placeholder}
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={(e) => {
                        if (maxBoxHeight) e.target.scrollIntoView({ block: "nearest" });
                        if (!isOpen) openDropdown();
                    }}
                    onClick={() => !isOpen && openDropdown()}
                    onKeyDown={handleKeyDown}
                    // Next to chips it only needs room for what's typed (a few
                    // letters to start), so it stays on the chips' line and
                    // wraps only once that room runs out; alone it fits the placeholder.
                    style={hasChips ? { minWidth: `min(100%, ${Math.max(5, (inputValue?.length || 0) + 2)}ch)` } : undefined}
                    className={cn(
                        "h-7 flex-1 border-none bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
                        !hasChips && "min-w-[96px]"
                    )}
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
                            {bulk && (
                                <div
                                    role="option"
                                    aria-selected={false}
                                    className="relative mb-1 flex min-h-9 cursor-pointer select-none items-center gap-2 rounded-[7px] border-b border-[#eef0f3] px-2.5 py-2 text-sm font-semibold text-[#9a6410] outline-none transition-colors hover:bg-[#fdf3e1]"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={handleBulk}
                                >
                                    {bulk.add ? <CheckCheck className="h-4 w-4" strokeWidth={2.4} /> : <X className="h-4 w-4" strokeWidth={2.4} />}
                                    <span className="min-w-0 flex-1">{bulk.add ? `Select all (${bulk.count})` : `Remove all (${bulk.count})`}</span>
                                </div>
                            )}
                            {visibleOptions?.length === 0 ? (
                                bulk ? null : <div className="px-3 py-2 text-sm text-[#5b6573]">{emptyText}</div>
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
