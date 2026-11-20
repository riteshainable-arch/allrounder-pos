import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitModal from "../../../../kit/components/KitModal";
import { useGetOnePOSummary } from "../../../../kit/hooks/data/poSummary";
import KitLoader from "../../../../kit/components/KitLoader/KitLoader";
import { Chip, Typography } from "@mui/material";
import { format } from "date-fns";
import { priceFormat } from "../../../../kit/utils/priceFormat";

export default function POSummaryDetailsModal({ isOpen, onClose, seletedPONumber }) {
    const { POSummaryDetail, isPOSummaryDetailLoading, POSummaryDetailError } = useGetOnePOSummary(seletedPONumber);

    const data = POSummaryDetail?.data;
    const header = data?.header;
    const items = data?.items ?? [];
    const summary = data?.summary;

    const purchaseOrderStatusColor = {
        pending: "warning",
        partial: "info",
        fulfilled: "success",
        cancelled: "danger",
        default: "primary",
    };

    return (
        <KitModal
            maxWidth="md"
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex flex-col gap-0.5">
                    <div className="text-base font-semibold text-third-950">PURCHASE ORDER</div>
                    <div className="text-xs text-third-500">Purchase Order Summary</div>
                </div>
            }
            titleClass="p-3! border-b"
        >
            <div className="px-4 pt-4 pb-0">
                {isPOSummaryDetailLoading ? (
                    <div className="h-80 flex justify-center">
                        <KitLoader logo={false} isLoading={true} />
                    </div>
                ) : POSummaryDetailError ? (
                    <div className="h-80 flex justify-center items-center">
                        <Typography variant="h6" color="error">
                            Something went wrong!
                        </Typography>
                    </div>
                ) : (
                    <div className="max-h-[70vh] overflow-y-auto pr-1 custom-scroll">
                        <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-b border-third-200 py-5 md:grid-cols-4">
                            <div>
                                <div className="text-third-500 text-sm mb-1">PO Number</div>
                                <div className="text-third-950 text-sm font-semibold">{header?.poNumber || "-"}</div>
                            </div>
                            <div>
                                <div className="text-third-500 text-sm mb-1">PO Date</div>
                                <div className="text-third-950 text-sm font-semibold">
                                    {header?.createdAt
                                        ? format(new Date(header?.createdAt), "dd-MM-yyyy")
                                        : format(new Date(), "dd-MM-yyyy")}
                                </div>
                            </div>
                            <div>
                                <div className="text-third-500 text-sm mb-1">Valid Till</div>
                                <div className="text-third-950 text-sm font-semibold">
                                    {header?.poValidTillDate
                                        ? format(new Date(header?.poValidTillDate), "dd-MM-yyyy")
                                        : format(new Date(), "dd-MM-yyyy")}
                                </div>
                            </div>
                            <div>
                                <div className="text-third-500 text-sm mb-1">Status</div>
                                <div>
                                    <Chip
                                        size="small"
                                        label={header?.status || "Unknown"}
                                        color={purchaseOrderStatusColor[header?.status || "default"]}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6 border-b border-third-200 py-5 md:grid-cols-2">
                            <div>
                                <div className="text-third-500 text-sm mb-1">VENDOR</div>
                                <div className="text-third-950 text-base font-semibold">
                                    {header?.vendorName || "Vendor not assigned"}
                                </div>
                                {header?.vendorId && (
                                    <div className="text-third-500 text-sm">Vendor ID: {header.vendorId}</div>
                                )}
                            </div>

                            <div>
                                <div className="text-third-500 text-sm mb-1">STORE</div>
                                <div className="text-third-950 text-base font-semibold">{header?.storeName || "-"}</div>
                                {header?.storeId && (
                                    <div className="text-third-500 text-sm">Store ID: {header.storeId}</div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-x-8 gap-y-4 border-b border-third-200 py-5">
                            {[
                                {
                                    label: "Items",
                                    value: header?.itemCount ?? 0,
                                },
                                {
                                    label: "Fulfilled",
                                    value: header?.fulfilledItemCount ?? 0,
                                },
                                {
                                    label: "Cancelled",
                                    value: header?.cancelledItemCount ?? 0,
                                },
                                {
                                    label: "Total Quantity",
                                    value: header?.totalQuantity ?? 0,
                                },
                                {
                                    label: "Weeks of Stock",
                                    value: header?.wksOfStockReq ?? "-",
                                },
                            ].map((item) => (
                                <div key={item.label}>
                                    <div className="text-third-500 text-xs">{item.label}</div>
                                    <div className="text-third-950 text-sm">{item.value}</div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6">
                            <Typography variant="subtitle2" className="mb-3! font-semibold!">
                                ORDER DETAILS
                            </Typography>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="border-y border-gray-400">
                                            {[
                                                "#",
                                                "Item Description",
                                                "Brand",
                                                "Pack Size",
                                                "Price",
                                                "Qty",
                                                "Amount",
                                                "Status",
                                            ].map((label) => (
                                                <th
                                                    key={label}
                                                    className={`px-3 py-3 font-semibold whitespace-nowrap ${
                                                        ["Price", "Qty", "Amount"].includes(label)
                                                            ? "text-right"
                                                            : label === "Status"
                                                              ? "text-center"
                                                              : "text-left"
                                                    }`}
                                                >
                                                    {label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {items.length > 0 ? (
                                            items.map((item, index) => (
                                                <tr
                                                    key={item.id ?? `${item.itemId}-${index}`}
                                                    className="border-b border-gray-200"
                                                >
                                                    <td className="px-3 py-4">{index + 1}</td>
                                                    <td className="px-3 py-4">
                                                        <Typography
                                                            className="truncate text-sm!"
                                                            title={item.itemName ?? ""}
                                                        >
                                                            {item.itemName || "-"}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Code: {item.itemId || "-"}
                                                        </Typography>
                                                        {item.EANCode && (
                                                            <Typography
                                                                variant="caption"
                                                                display="block"
                                                                color="text.secondary"
                                                            >
                                                                EAN: {item.EANCode}
                                                            </Typography>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-4">{item.brandName || "-"}</td>
                                                    <td className="px-3 py-4">{item.packSize || "-"}</td>
                                                    <td className="px-3 py-4 text-right whitespace-nowrap">
                                                        {priceFormat(item.price ?? 0)}
                                                    </td>
                                                    <td className="px-3 py-4 text-right">
                                                        {item.finalPOQuantity ?? 0}
                                                    </td>
                                                    <td className="px-3 py-4 text-right font-semibold whitespace-nowrap">
                                                        {priceFormat(item.lineTotal ?? 0)}
                                                    </td>
                                                    <td className="px-3 py-4 text-center">
                                                        <Chip
                                                            size="small"
                                                            label={item.status || "Unknown"}
                                                            color={purchaseOrderStatusColor[item?.status || "default"]}
                                                        />
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="px-3 py-8 text-center">
                                                    No items found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <div className="w-full max-w-100 rounded-lg! p-4!">
                                {[
                                    {
                                        label: "Total Items",
                                        value: summary?.itemCount ?? 0,
                                    },
                                    {
                                        label: "Pending Items",
                                        value: summary?.pendingItemCount ?? 0,
                                    },
                                    {
                                        label: "Fulfilled Items",
                                        value: summary?.fulfilledItemCount ?? 0,
                                    },
                                    {
                                        label: "Cancelled Items",
                                        value: summary?.cancelledItemCount ?? 0,
                                    },
                                    {
                                        label: "Total Quantity",
                                        value: summary?.totalQuantity ?? 0,
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex justify-between gap-4 border-b last:border-b-0 border-third-200 py-2"
                                    >
                                        <Typography variant="body2" color="text.secondary">
                                            {item.label}
                                        </Typography>
                                        <Typography variant="body2" fontWeight={500}>
                                            {item.value}
                                        </Typography>
                                    </div>
                                ))}

                                <div className="flex justify-between gap-4 pt-3">
                                    <div className="text-third-950 text-base font-semibold">Total Amount</div>
                                    <div className="text-third-950 text-base font-semibold">
                                        {priceFormat(summary?.totalValue ?? 0)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="p-4 flex justify-between items-center gap-3 border-t border-third-200">
                <div className="text-xs text-third-400">Generated from Purchase Order Summary</div>
                <KitButton className="w-auto" variant="outlined" size="small" onClick={onClose}>
                    Close
                </KitButton>
            </div>
        </KitModal>
    );
}
