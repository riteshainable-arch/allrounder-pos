import KitModal from "../../../../../kit/components/KitModal";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import { useGetAllBusySaleInvoiceItems } from "../../../../../kit/hooks/data/busy";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { Typography } from "@mui/material";
import { priceFormat } from "../../../../../kit/utils/priceFormat";

export default function BySaleInvoicesViewModal({ open, onClose, selectedItem }) {
    const { BusySaleInvoiceItemsList, isBusySaleInvoiceItemsListLoading, BusySaleInvoiceItemsListError } =
        useGetAllBusySaleInvoiceItems(Boolean(selectedItem?.vch_code), String(selectedItem?.vch_code), {
            data: String(selectedItem?.date),
        });

    const columns = [
        {
            field: "item",
            headerName: "Item",
            minWidth: 220,
            flex: 1.5,
            renderCell: (params) => (
                <div className="flex flex-col justify-center items-start leading-tight min-w-0">
                    <Typography variant="body2" fontWeight={600} className="truncate">
                        {params.row.product_name ?? "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.product_alias ?? ""}
                    </Typography>
                </div>
            ),
        },
        {
            field: "hsn",
            headerName: "HSN",
            minWidth: 110,
            flex: 0.7,
            renderCell: (params) => <Typography variant="body2">{params.row.product_hsn_code ?? "—"}</Typography>,
        },
        {
            field: "quantity",
            headerName: "Qty",
            minWidth: 100,
            flex: 0.6,
            renderCell: (params) => (
                <Typography variant="body2">
                    {params.row.quantity ?? "—"} {params.row.unit_name ?? ""}
                </Typography>
            ),
        },
        {
            field: "rate",
            headerName: "Rate",
            minWidth: 110,
            flex: 0.7,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{priceFormat(params.row.sale_rate)}</Typography>,
        },
        {
            field: "taxable",
            headerName: "Taxable",
            minWidth: 120,
            flex: 0.8,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{priceFormat(params.row.taxable_value)}</Typography>,
        },
        {
            field: "gst",
            headerName: "GST",
            minWidth: 90,
            flex: 0.6,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{params.row.gst_percentage ?? 0}%</Typography>,
        },
        {
            field: "total",
            headerName: "Total",
            minWidth: 120,
            flex: 0.8,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600}>
                    {priceFormat(params.row.total_amount)}
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
                        BUSY Invoice{" "}
                        {selectedItem?.invoice_no ?? selectedItem?.voucher_number ?? selectedItem?.vch_code ?? "-"}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-third-500">
                        <span>{selectedItem?.date ?? "-"}</span>
                        <span>·</span>
                        <span>{selectedItem?.customer_name ?? selectedItem?.account_name ?? "Unknown Customer"}</span>
                    </div>
                </div>
            }
            titleClass="p-3! border-b"
        >
            <div className="p-4 flex flex-col gap-4">
                <KitDataGrid
                    columns={columns}
                    rows={BusySaleInvoiceItemsList?.data?.data ?? []}
                    getRowId={(row) => `${row.voucher_id}-${row.product_id}`}
                    rowCount={BusySaleInvoiceItemsList?.data?.data?.length ?? 0}
                    paginationMode="client"
                    loading={isBusySaleInvoiceItemsListLoading}
                    error={!!BusySaleInvoiceItemsListError}
                    disableRowSelectionOnClick
                />
            </div>

            <div className="px-4 py-3 flex justify-end gap-3">
                <KitButton variant="outlined" className="w-auto" size="small" onClick={onClose}>
                    Cancel
                </KitButton>
            </div>
        </KitModal>
    );
}
