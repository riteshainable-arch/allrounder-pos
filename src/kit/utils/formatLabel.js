export function formatTooltipLabel(key) {
    const snakeToWords = key?.replace(/_/g, " ");
    return snakeToWords?.replace(/\b\w/g, (l) => l.toUpperCase());
}
