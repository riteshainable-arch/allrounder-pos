import { Divider, IconButton, Typography } from "@mui/material";
import KitHeader from "../../../../../kit/components/KitHeader/KitHeader";
import { useEffect, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { formatQty } from "../../../../../kit/utils/priceFormat";
import { format } from "date-fns";
import { useCreateBusyStockSync, useGetAllBusyStockSync } from "../../../../../kit/hooks/data/busy";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import KitShow from "../../../../../kit/components/KitShow/KitShow";
import { toast } from "react-toastify";
import { SyncBadge } from "../../../../../kit/utils/syncBadge";
import ProductViewModal from "../../../components/BuyIntegration/StockSync/ProductViewModal";

const duration = (run) => {
    if (!run.finishedAt) return "—";
    const seconds = Math.round((new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()) / 1000);
    return seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`;
};

export default function StockSync() {
    const refreshRef = useRef(null);
    const importRef = useRef(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState();
    const [activeRowIndex, setActiveRowIndex] = useState(0);

    const query = {
        page,
        size: pageSize,
    };

    const { BusyStockSyncList, isBusyStockSyncListLoading, BusyStockSyncListError, refreshBusyStockSyncList } =
        useGetAllBusyStockSync(query);
    const { createBusyStockSync: onCreateBusyStockSync, isCreatingBusyStockSync } = useCreateBusyStockSync();

    const toggleViewModal = () => setShowViewModal(!showViewModal);

    const handleView = (data) => {
        setSelectedItem(data);
        toggleViewModal();
    };

    const columns = [
        {
            field: "id",
            headerName: "Run",
            minWidth: 90,
            flex: 0.5,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600}>
                    #{params.row.id}
                </Typography>
            ),
        },
        {
            field: "startedAt",
            headerName: "Started",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2">
                    {params.row.startedAt ? format(params.row.startedAt, "dd MMM yyyy, hh:mm a") : "-"}
                </Typography>
            ),
        },
        {
            field: "duration",
            headerName: "Time Taken",
            minWidth: 120,
            flex: 0.7,
            renderCell: (params) => (
                <Typography variant="body2">
                    {params.row.status === "running" ? "Running…" : duration(params.row)}
                </Typography>
            ),
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
                        <Typography
                            variant="caption"
                            color="error"
                            className="truncate"
                            title={params.row.errorMessage}
                        >
                            {params.row.errorMessage}
                        </Typography>
                    )}
                </div>
            ),
        },
        {
            field: "busyItems",
            headerName: "BUSY Items",
            minWidth: 110,
            flex: 0.8,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{params.row.busyItems ?? 0}</Typography>,
        },
        {
            field: "linkedItems",
            headerName: "Linked",
            minWidth: 110,
            flex: 0.8,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{params.row.linkedItems ?? 0}</Typography>,
        },
        {
            field: "changedItems",
            headerName: "Stock Changed",
            minWidth: 140,
            flex: 0.8,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600}>
                    {params.row.changedItems}
                </Typography>
            ),
        },
        {
            field: "unchangedItems",
            headerName: "Same",
            minWidth: 110,
            flex: 0.8,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{params.row.unchangedItems ?? 0}</Typography>,
        },
        {
            field: "failedItems",
            headerName: "Failed",
            minWidth: 90,
            flex: 0.6,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <Typography
                    variant="body2"
                    fontWeight={params.row.failedItems ? 600 : 400}
                    color={params.row.failedItems ? "error" : "text.primary"}
                >
                    {params.row.failedItems}
                </Typography>
            ),
        },
        {
            field: "quantity",
            headerName: "Qty In / Out",
            minWidth: 140,
            flex: 0.9,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <Typography variant="body2">
                    <span className="text-green-700">+{formatQty(params.row.qtyIn)}</span>
                    {" / "}
                    <span className="text-red-600">-{formatQty(params.row.qtyOut)}</span>
                </Typography>
            ),
        },
        {
            field: "actions",
            headerName: "Actions",
            minWidth: 100,
            sortable: false,
            filterable: false,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => (
                <KitButton
                    size="small"
                    variant="outlined"
                    className="w-auto!"
                    disabled={params.row.status === "running"}
                    onClick={() => handleView(params.row)}
                >
                    Products
                </KitButton>
            ),
        },
    ];

    const dataRows = BusyStockSyncList?.data?.items ?? [];

    const running = (dataRows ?? []).some((r) => r.status === "running");

    useEffect(() => {
        if (!running) return;

        const interval = window.setInterval(() => {
            refreshBusyStockSyncList();
        }, 5000);

        return () => window.clearInterval(interval);
    }, [running, refreshBusyStockSyncList]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "i":
                    importRef.current?.click();
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
        const handleKeyDown = (e) => {
            const target = e.target;

            if (
                target instanceof HTMLElement &&
                (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
            ) {
                return;
            }

            if (!dataRows.length) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveRowIndex((prev) => Math.min(prev + 1, dataRows.length - 1));
                return;
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveRowIndex((prev) => Math.max(prev - 1, 0));
                return;
            }

            if (e.key === "Enter" || (e.shiftKey && e.key.toLowerCase() === "v")) {
                e.preventDefault();
                const row = dataRows[activeRowIndex];
                if (row) {
                    handleView(row);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [dataRows, activeRowIndex, handleView]);

    useEffect(() => {
        setActiveRowIndex(0);
    }, [page, pageSize]);

    const start = async () => {
        if (
            !window.confirm(
                "Set CRM Store 1 stock of every linked item to the BUSY stock now?\nEach change is posted to the item stock ledger."
            )
        )
            return;
        try {
            const res = await onCreateBusyStockSync();
            toast.success(`Stock sync #${res.data.id} started. It runs in the background.`);
            setPage(1);
            refreshBusyStockSyncList();
        } catch (e) {
            toast.error(e.message || "Could not start the stock sync", { duration: 7000 });
        }
    };

    return (
        <div>
            <Divider className="mb-3!" />
            <div className="flex flex-col gap-3 w-full min-w-0">
                <div className="flex items-center justify-between gap-3">
                    <KitHeader
                        title="BUSY Stock Sync"
                        subtitle="CRM Store 1 stock is set to the BUSY stock for every linked item. Each change is an inventory adjustment in the item stock ledger."
                        icon="tabler:file-invoice"
                        count={BusyStockSyncList?.data?.totalItems ?? 0}
                        countLabel="records"
                    />
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + I" className="-top-5" />
                            <KitButton
                                ref={importRef}
                                size="small"
                                variant="contained"
                                className="w-auto"
                                disabled={running}
                                loading={isCreatingBusyStockSync}
                                onClick={() => start()}
                            >
                                {running ? "Sync running…" : "Sync stock from BUSY"}
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                            <IconButton
                                ref={refreshRef}
                                onClick={() => refreshBusyStockSyncList()}
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </div>

                <KitDataGrid
                    columns={columns}
                    rows={BusyStockSyncList?.data?.items ?? []}
                    getRowId={(row) => row.id}
                    rowCount={BusyStockSyncList?.data?.totalItems ?? 0}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    rowHeight={60}
                    loading={isBusyStockSyncListLoading}
                    error={!!BusyStockSyncListError}
                    disableRowSelectionOnClick
                    getRowClassName={(params) =>
                        dataRows[activeRowIndex]?.id === params.id ? "keyboard-active-row" : ""
                    }
                />
            </div>

            <KitShow show={showViewModal}>
                <ProductViewModal open={showViewModal} onClose={toggleViewModal} selectedItem={selectedItem} />
            </KitShow>
        </div>
    );
}
