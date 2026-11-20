import { IconButton, Paper, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { useGetAllBusyCustomers, useGetAllPendingSalesOrders } from "../../../../../kit/hooks/data/busy";
import KitSelect from "../../../../../kit/components/KitSelect";

export default function BusyPendingOrders() {
    const nameRef = useRef(null);
    const refreshRef = useRef(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [search, setSearch] = useState("");
    const [customer, setCustomer] = useState(null);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setSearch(searchTerm.trim());
        }, 400);

        return () => window.clearTimeout(timer);
    }, [searchTerm]);

    const { BusyCustomersList, isBusyCustomersListLoading, BusyCustomersListError } = useGetAllBusyCustomers(
        { search, pageSize: 20 },
        search.length >= 2
    );

    const {
        PendingSalesOrdersList,
        isPendingSalesOrdersListLoading,
        PendingSalesOrdersListError,
        refreshPendingSalesOrdersList,
    } = useGetAllPendingSalesOrders({ customerId: customer?.customer_id }, Boolean(customer));

    const rowsData = PendingSalesOrdersList?.data?.data ?? [];

    const rows = Array.isArray(rowsData)
        ? rowsData.map((row, index) => ({
              ...row,
              _rowId: row.sales_order_vch_code ?? `${row.sales_order_number ?? "order"}-${index}`,
          }))
        : [];

    const customerOptions = useMemo(
        () =>
            (BusyCustomersList?.data?.items ?? []).map((item) => ({
                label: `${item.customer_name} (${item.mobile_number || item.group_name || "—"})`,
                value: String(item.customer_id),
                customer: item,
            })),
        [BusyCustomersList]
    );

    const columns = [
        {
            field: "sales_order_number",
            headerName: "Order",
            minWidth: 160,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600}>
                    {params.row.sales_order_number || params.row.sales_order_vch_code || "—"}
                </Typography>
            ),
        },
        {
            field: "order_date",
            headerName: "Date / Due",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <div className="flex flex-col justify-center">
                    <Typography variant="body2">{String(params.row.order_date ?? "").slice(0, 10) || "—"}</Typography>

                    <Typography variant="caption" color="text.secondary">
                        {params.row.due_date ? `Due ${String(params.row.due_date).slice(0, 10)}` : ""}
                    </Typography>
                </div>
            ),
        },
        {
            field: "material_center_name",
            headerName: "Material Centre",
            minWidth: 170,
            flex: 1,
            renderCell: (params) => <Typography variant="body2">{params.row.material_center_name || "—"}</Typography>,
        },
        {
            field: "total_ordered_qty",
            headerName: "Ordered",
            minWidth: 110,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{params.row.total_ordered_qty ?? "—"}</Typography>,
        },
        {
            field: "total_dispatched_qty",
            headerName: "Dispatched",
            minWidth: 120,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{params.row.total_dispatched_qty ?? "—"}</Typography>,
        },
        {
            field: "total_pending_qty",
            headerName: "Pending",
            minWidth: 110,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600}>
                    {params.row.total_pending_qty ?? "—"}
                </Typography>
            ),
        },
        {
            field: "status",
            headerName: "Status",
            minWidth: 130,
            flex: 0.8,
            renderCell: (params) => (
                <Typography variant="body2" className="capitalize">
                    {params.row.status?.replace(/_/g, " ") || "—"}
                </Typography>
            ),
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "n":
                    nameRef.current?.focus();
                    break;
                case "r":
                    refreshRef.current?.click();
                    break;
                default:
                    return;
            }

            e.preventDefault();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div>
            <div className="flex flex-col gap-3 w-full min-w-0">
                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-7">
                        <div className="w-96 relative">
                            <ShortcutBadge shortcut="Alt + N" className="top-0" />
                            <KitSelect
                                label="BUSY Customer"
                                placeholder="Search BUSY customer (min 2 letters)"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={customerOptions}
                                value={
                                    customerOptions.find(
                                        (option) => option.value === String(customer?.customer_id ?? "")
                                    ) ?? null
                                }
                                isLoading={isBusyCustomersListLoading}
                                isClearable
                                onInputChange={(inputValue, actionMeta) => {
                                    if (actionMeta.action === "input-change") {
                                        setSearchTerm(inputValue);
                                        setCustomer(null);
                                    }
                                }}
                                onChange={(option) => {
                                    setCustomer(option?.customer ?? null);
                                }}
                                error={!!BusyCustomersListError}
                                helperText={
                                    BusyCustomersListError
                                        ? BusyCustomersListError.message
                                        : searchTerm.length > 0 && searchTerm.trim().length < 2
                                          ? "Enter at least 2 characters"
                                          : undefined
                                }
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                            <IconButton
                                ref={refreshRef}
                                onClick={() => refreshPendingSalesOrdersList()}
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                <KitDataGrid
                    columns={columns}
                    rows={rows}
                    getRowId={(row) => row._rowId}
                    rowCount={rows.length}
                    paginationMode="client"
                    loading={isPendingSalesOrdersListLoading}
                    error={!!PendingSalesOrdersListError}
                    disableRowSelectionOnClick
                />
            </div>
        </div>
    );
}
