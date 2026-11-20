import { components } from "react-select";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";

export const ProductOption = (props) => {
    const product = props.data.obj;

    return (
        <components.Option {...props}>
            <div className="flex items-start gap-3 py-1">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-700">
                    <KitIcon icon="tabler:box" fontSize={14} />
                </span>

                <span className="min-w-0 flex-1">
                    <span className="block whitespace-normal break-words text-sm font-medium text-third-900">{product.productName}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-third-500">
                        <span>Code: {product.itemCode}</span>
                        <span> Barcode: {product.barcode || "-"}</span>
                        <span>Stock: {priceFormat(product.stockQty, { currency: false })}</span>
                        <span>MRP: {priceFormat(product.latestMRP)}</span>
                    </span>
                </span>

                <span className="shrink-0 text-sm font-semibold text-third-900">
                    {priceFormat(product.latestSalePrice ?? product.price)}
                </span>
            </div>
        </components.Option>
    );
};