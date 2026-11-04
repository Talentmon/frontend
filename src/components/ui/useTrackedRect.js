import { useEffect, useState } from "react";

const sameBox = (a, b) =>
    a === b || (!!a && !!b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);

/**
 * The element's viewport box, re-read every frame while `active`, so a list
 * placed from it (position: fixed, portaled) follows scrolling, resizing and
 * layout shifts around it - e.g. a filter pill that widens when it gets a
 * count and pushes the fields beside it. State only changes when the box
 * actually moved or changed size.
 */
export default function useTrackedRect(ref, active) {
    const [rect, setRect] = useState(null);

    useEffect(() => {
        if (!active) return undefined;
        let frame;
        let last = null;
        const track = () => {
            const next = ref.current?.getBoundingClientRect() ?? null;
            if (!sameBox(next, last)) {
                last = next;
                setRect(next);
            }
            frame = requestAnimationFrame(track);
        };
        track();
        return () => cancelAnimationFrame(frame);
    }, [ref, active]);

    return rect;
}
