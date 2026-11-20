import KitModal from "../../../../../kit/components/KitModal";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import { useGetAllSalesOrderPreview } from "../../../../../kit/hooks/data/busy";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { Paper, Typography } from "@mui/material";
import { priceFormat } from "../../../../../kit/utils/priceFormat";
import { useState } from "react";
import KitLoader from "../../../../../kit/components/KitLoader/KitLoader";

export default function SalesOrderPreviewModal({ open, onClose, selectedItem }) {
    const [showPayload, setShowPayload] = useState(false);

    const { SalesOrderPreviewList, isSalesOrderPreviewListLoading, SalesOrderPreviewListError } =
        useGetAllSalesOrderPreview(Boolean(selectedItem?.id), String(selectedItem?.id));

    const preview = SalesOrderPreviewList?.data;
    const order = preview?.order;
    const lines = preview?.lines ?? [];

    const columns = [
        {
            field: "itemName",
            headerName: "Item",
            minWidth: 220,
            flex: 1.5,
            renderCell: (params) => (
                <div className="flex flex-col justify-center items-start leading-tight min-w-0">
                    <Typography variant="body2" fontWeight={600} className="truncate">
                        {params.row.itemName ?? "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.itemCode ?? ""}
                    </Typography>
                </div>
            ),
        },
        {
            field: "busyItem",
            headerName: "BUSY Item",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => {
                const item = params.row;

                return item.mapped ? (
                    <Typography variant="caption" fontWeight={600} color="success.main">
                        Linked
                    </Typography>
                ) : item.inCrm ? (
                    <Typography variant="caption" fontWeight={600} color="primary.main">
                        Will be created in BUSY
                        {item.gst != null ? ` (GST ${item.gst}%)` : ""}
                    </Typography>
                ) : (
                    <Typography variant="caption" fontWeight={600} color="warning.main">
                        By name
                    </Typography>
                );
            },
        },
        {
            field: "quantity",
            headerName: "Qty",
            minWidth: 100,
            flex: 0.6,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{params.row.quantity ?? "—"}</Typography>,
        },
        {
            field: "rate",
            headerName: "Rate",
            minWidth: 120,
            flex: 0.8,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{priceFormat(params.row.rate)}</Typography>,
        },
        {
            field: "amount",
            headerName: "Amount",
            minWidth: 130,
            flex: 0.8,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600}>
                    {priceFormat(Number(params.row.quantity ?? 0) * Number(params.row.rate ?? 0))}
                </Typography>
            ),
        },
    ];

    return (
        <KitModal
            maxWidth="lg"
            isOpen={open}
            onClose={onClose}
            title={
                <div className="flex flex-col gap-1">
                    <div className="text-base font-semibold text-third-950">
                        Sales Order {order?.soNumber ?? selectedItem?.soNumber ?? "-"}
                    </div>
                    <div className="text-xs text-third-500">
                        {order?.orderDate ?? selectedItem?.orderDate ?? "-"}
                        {" · "}
                        {order?.customerName ?? selectedItem?.customerName ?? "Unknown Customer"}
                    </div>
                </div>
            }
            titleClass="p-3! border-b"
        >
            <div className="p-4 flex flex-col gap-4">
                {isSalesOrderPreviewListLoading ? (
                    <div className="h-80 flex justify-center">
                        <KitLoader logo={false} isLoading={true} />
                    </div>
                ) : SalesOrderPreviewListError ? (
                    <div className="items-center h-[70vh] flex justify-center">
                        <Typography variant="h6" color="error">
                            Something went wrong!
                        </Typography>
                    </div>
                ) : preview ? (
                    <>
                        <Paper elevation={0} className="rounded-xl! border! border-gray-200! p-3!">
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                <div>
                                    <Typography variant="caption" color="text.secondary">
                                        SO Number
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {order?.soNumber ?? "—"}
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="caption" color="text.secondary">
                                        Customer
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {order?.customerName || "—"}
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="caption" color="text.secondary">
                                        CRM Status
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {order?.statusLabel || order?.status || "—"}
                                    </Typography>
                                </div>

                                <div>
                                    <Typography variant="caption" color="text.secondary">
                                        CRM Total
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {priceFormat(order?.grandTotal)}
                                    </Typography>
                                </div>
                            </div>

                            {preview.lastSync ? (
                                <div className="mt-3 flex items-center gap-2 border-t border-gray-100 pt-3">
                                    <Typography variant="caption" color="text.secondary">
                                        BUSY Sync:
                                    </Typography>
                                    <SyncBadge status={preview.lastSync.status} />

                                    {preview.lastSync.busyNumber ? (
                                        <Typography variant="caption" color="text.secondary">
                                            BUSY No. {preview.lastSync.busyNumber}
                                        </Typography>
                                    ) : null}
                                </div>
                            ) : null}
                        </Paper>

                        {preview.setup ? (
                            <Paper elevation={0} className="rounded-xl! border! border-gray-200! p-3!">
                                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                                    <div>
                                        <Typography variant="caption" color="text.secondary">
                                            Sale Type
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {preview.setup.saleType || "—"}
                                        </Typography>
                                    </div>

                                    <div>
                                        <Typography variant="caption" color="text.secondary">
                                            Rates Sent
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {preview.setup.pricingMode === "gstInclusive"
                                                ? "GST Inclusive"
                                                : "GST Exclusive"}
                                        </Typography>
                                    </div>

                                    <div>
                                        <Typography variant="caption" color="text.secondary">
                                            Material Centre
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {preview.setup.materialCenter || "—"}
                                        </Typography>
                                    </div>

                                    <div>
                                        <Typography variant="caption" color="text.secondary">
                                            BUSY Party
                                        </Typography>
                                        <Typography variant="body2" fontWeight={600}>
                                            {preview.setup.customer || "—"}
                                        </Typography>
                                    </div>
                                </div>
                            </Paper>
                        ) : null}

                        {preview.errors?.length > 0 && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                                <Typography variant="subtitle2" color="error" className="mb-2!">
                                    Errors
                                </Typography>

                                {preview.errors.map((message, index) => (
                                    <Typography key={index} variant="body2" color="error">
                                        • {typeof message === "string" ? message : message.message}
                                    </Typography>
                                ))}
                            </div>
                        )}

                        {preview.warnings?.length > 0 && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <Typography variant="subtitle2" color="warning.dark" className="mb-2!">
                                    Warnings
                                </Typography>

                                {preview.warnings.map((message, index) => (
                                    <Typography key={index} variant="body2" color="warning.dark">
                                        • {typeof message === "string" ? message : message.message}
                                    </Typography>
                                ))}
                            </div>
                        )}

                        <div>
                            <Typography variant="subtitle2" className="mb-2!">
                                Order Items ({lines.length})
                            </Typography>

                            <KitDataGrid
                                columns={columns}
                                rows={lines}
                                getRowId={(row) => row.itemCode}
                                rowCount={lines.length}
                                paginationMode="client"
                                loading={false}
                                disableRowSelectionOnClick
                            />
                        </div>

                        <div>
                            <KitButton
                                variant="text"
                                className="w-auto"
                                size="small"
                                onClick={() => setShowPayload((prev) => !prev)}
                            >
                                {showPayload ? "Hide" : "Show"} request sent to BUSY
                            </KitButton>

                            {showPayload && (
                                <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-100">
                                    {JSON.stringify(preview.payload ?? null, null, 2)}
                                </pre>
                            )}
                        </div>
                    </>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No preview data available.
                    </Typography>
                )}
            </div>

            <div className="px-4 py-3 flex justify-end gap-3">
                <KitButton variant="outlined" className="w-auto" size="small" onClick={onClose}>
                    Cancel
                </KitButton>
            </div>
        </KitModal>
    );
}
