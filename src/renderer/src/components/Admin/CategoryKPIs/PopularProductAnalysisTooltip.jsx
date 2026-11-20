import { formatPrice } from "../../../../../kit/utils/priceFormat";

export function PopularProductAnalysisTooltip({ active, payload }) {
    if (!active || !payload?.length) return null;

    const { last_purchase_date, total_revenue, no_of_products, total_qty, categories } = payload[0].payload;

    return (
        <div className="rounded-md border border-gray-300 bg-white shadow-lg p-3 text-xs text-black w-48">
            <p className="font-medium mb-2">
                <span className="font-semibold text-[18px] ">{categories}</span>
            </p>
            <p className="mb-1 font-medium">
                Last Purchase: <span className="font-semibold">{last_purchase_date}</span>
            </p>
            <p className="mb-1 font-medium">
                Revenue: ₹ <span className="font-semibold">{formatPrice(total_revenue)}</span>
            </p>
            <p className="font-medium">
                No. of Products: <span className="font-semibold">{no_of_products}</span>
            </p>
            <p className="font-medium">
                Total Qty: <span className="font-semibold">{total_qty}</span>
            </p>
        </div>
    );
}
