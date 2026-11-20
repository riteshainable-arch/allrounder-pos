import { formatPrice } from "../../utils/priceFormat";

function isValidHexColor(colorCode) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(colorCode);
}

function formatTooltipLabel(key) {
    const snakeToWords = key.replace(/_/g, " ");
    return snakeToWords.replace(/\b\w/g, (l) => l.toUpperCase());
}

function KitCustomTooltip({
    label,
    prefix,
    active,
    postfix,
    payload,
    className,
    formattedNumber,
    onHoverChange,
    category,
}) {
    const handleMouseEnter = () => onHoverChange?.(true);
    const handleMouseLeave = () => onHoverChange?.(false);

    if (!active) return null;

    return (
        <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`rounded-md border border-gray-300 bg-white shadow-2xl dark:bg-gray-100 max-h-60 overflow-hidden pointer-events-auto, ${className}`}
        >
            <div className="mb-0.5 block bg-primary-hover p-2 px-2.5 text-center font-lexend text-xs font-semibold capitalize text-gray-600 dark:bg-gray-200/60 dark:text-gray-700">
                {label}
            </div>
            <div className="px-3 py-1.5 text-xs max-h-40 overflow-y-auto">
                {payload?.map((item, index) => (
                    <div key={item.dataKey + index} className="chart-tooltip-item flex items-center py-1.5">
                        <span
                            className="me-1.5 h-2 w-2 rounded-full"
                            style={{
                                backgroundColor: isValidHexColor(item.fill)
                                    ? item.fill === "#fff"
                                        ? item.stroke
                                        : item.fill
                                    : item.stroke,
                            }}
                        />
                        <div>
                            <span className="capitalize">
                                {category ? category : formatTooltipLabel(item.dataKey)}:
                            </span>{" "}
                            <span className="font-medium text-gray-900 dark:text-gray-700">
                                {prefix && prefix}
                                {formattedNumber ? formatPrice(item.value) : formatPrice(item.value)}
                                {postfix && postfix}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default KitCustomTooltip;
