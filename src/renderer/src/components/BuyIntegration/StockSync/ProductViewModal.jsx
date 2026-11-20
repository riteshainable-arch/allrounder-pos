import KitModal from "../../../../../kit/components/KitModal";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import { useGetAllBusyStockSyncItems } from "../../../../../kit/hooks/data/busy";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { IconButton, Typography } from "@mui/material";
import { formatQty } from "../../../../../kit/utils/priceFormat";
import { useEffect, useRef, useState } from "react";
import KitLoader from "../../../../../kit/components/KitLoader/KitLoader";
import { format } from "date-fns";
import { SyncBadge } from "../../../../../kit/utils/syncBadge";
import ShortcutBadge from "../../Dashboard/ShortcutBadge";
import KitDebouncedInput from "../../../../../kit/components/KitDebouncedInput";
import KitSelect from "../../../../../kit/components/KitSelect";
import { itemStatusOptions } from "../../../../../kit/configs/general";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";

export default function ProductViewModal({ open, onClose, selectedItem }) {
    const searchRef = useRef(null);
    const statusRef = useRef(null);
    const refreshRef = useRef(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    const query = {
        page,
        size: pageSize,
        search: search,
        status: status,
    };

    const { BusyStockSyncItemsList, isBusyStockSyncItemsListLoading, BusyStockSyncItemsListError } =
        useGetAllBusyStockSyncItems(Boolean(selectedItem?.id), String(selectedItem?.id), query);

    const List = BusyStockSyncItemsList?.data;
    const Items = List?.items ?? [];
    const Run = List?.run;

    const columns = [
        {
            field: "itemName",
            headerName: "Item",
            minWidth: 220,
            flex: 1.3,
            renderCell: (params) => (
                <div className="flex flex-col justify-center items-start leading-tight min-w-0">
                    <Typography
                        variant="body2"
                        fontWeight={600}
                        className="truncate"
                        title={params.row.itemName || params.row.itemCode || "—"}
                    >
                        {params.row.itemName || params.row.itemCode || "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.itemCode || "—"}
                    </Typography>
                </div>
            ),
        },
        {
            field: "crmQtyBefore",
            headerName: "CRM Stock Before",
            minWidth: 150,
            flex: 0.9,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{formatQty(params.row.crmQtyBefore)}</Typography>,
        },
        {
            field: "busyQty",
            headerName: "BUSY Stock",
            minWidth: 130,
            flex: 0.8,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{formatQty(params.row.busyQty)}</Typography>,
        },
        {
            field: "delta",
            headerName: "Change",
            minWidth: 120,
            flex: 0.8,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => {
                const delta = Number(params.row.delta);

                return (
                    <Typography
                        variant="body2"
                        fontWeight={600}
                        className={delta > 0 ? "text-green-600!" : "text-red-600!"}
                    >
                        {delta > 0 ? "+" : ""}
                        {formatQty(delta)}
                    </Typography>
                );
            },
        },
        {
            field: "status",
            headerName: "Status",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <div className="flex flex-col justify-center gap-1">
                    <SyncBadge status={params.row.status} />
                    {params.row.errorMessage && (
                        <Typography variant="caption" color="error" className="max-w-60">
                            {params.row.errorMessage}
                        </Typography>
                    )}
                </div>
            ),
        },
        {
            field: "createdAt",
            headerName: "Time",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2">
                    {params?.row?.createdAt ? format(params.row.createdAt, "dd MMM yyyy, hh:mm a") : "-"}
                </Typography>
            ),
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "o":
                    searchRef.current?.focus();
                    break;
                case "a":
                    statusRef.current?.focus();
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

    useEffect(() => {
        if (!open) return;

        const timer = setTimeout(() => {
            searchRef.current?.focus();
        }, 150);

        return () => clearTimeout(timer);
    }, [open]);

    return (
        <KitModal
            maxWidth="lg"
            isOpen={open}
            onClose={onClose}
            title={
                <div className="flex flex-col gap-1">
                    <div className="text-base font-semibold text-third-950">
                        Stock Sync Run #{Run?.id ?? selectedItem?.id ?? "-"}
                    </div>

                    <div className="text-xs text-third-500">
                        {Run?.startedAt
                            ? format(Run.startedAt, "dd MMM yyyy, hh:mm a")
                            : selectedItem?.startedAt
                              ? format(selectedItem.startedAt, "dd MMM yyyy, hh:mm a")
                              : "-"}
                        {" · "}
                        {Run?.status ?? selectedItem?.status ?? "Unknown Status"}
                    </div>
                </div>
            }
            titleClass="p-3! border-b"
        >
            <div className="p-4 flex flex-col gap-4">
                {isBusyStockSyncItemsListLoading ? (
                    <div className="h-80 flex justify-center">
                        <KitLoader logo={false} isLoading={true} />
                    </div>
                ) : BusyStockSyncItemsListError ? (
                    <div className="items-center h-[70vh] flex justify-center">
                        <Typography variant="h6" color="error">
                            Something went wrong!
                        </Typography>
                    </div>
                ) : Items ? (
                    <>
                        <div className="flex items-center justify-end gap-2">
                            <div className="relative">
                                <ShortcutBadge shortcut="Alt + O" className="-top-5!" />
                                <KitDebouncedInput
                                    ref={searchRef}
                                    value={search}
                                    onChange={(value) => setSearch(String(value))}
                                    placeholder="Item code / name"
                                    className="w-52"
                                    size="small"
                                />
                            </div>
                            <div className="relative w-60">
                                <ShortcutBadge shortcut="Alt + A" className="-top-5" />
                                <KitSelect
                                    ref={statusRef}
                                    placeholder="Select Status"
                                    size="small"
                                    placeholderFontSize={14}
                                    inputFontSize={14}
                                    options={itemStatusOptions}
                                    isDisabled={false}
                                    value={
                                        itemStatusOptions.find((option) => String(option.value) === String(status)) ??
                                        ""
                                    }
                                    onChange={(option) => setStatus(option?.value ?? "")}
                                />
                            </div>
                            <div className="relative">
                                <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                                <IconButton
                                    ref={refreshRef}
                                    onClick={() => refreshBusyCrmBillsList()}
                                    className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                                >
                                    <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                                </IconButton>
                            </div>
                        </div>
                        <KitDataGrid
                            columns={columns}
                            rows={Items}
                            getRowId={(row) => row.id}
                            rowCount={List?.totalItems ?? 0}
                            pageSize={pageSize}
                            setPage={setPage}
                            setPageSize={setPageSize}
                            loading={false}
                            disableRowSelectionOnClick
                        />
                    </>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No stock sync data available.
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
