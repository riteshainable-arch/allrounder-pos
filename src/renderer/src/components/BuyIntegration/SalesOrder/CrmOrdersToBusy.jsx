import { IconButton, Paper, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { priceFormat } from "../../../../../kit/utils/priceFormat";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import { useGetAllOrderStatus, useGetAllSalesOrder } from "../../../../../kit/hooks/data/busy";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import KitShow from "../../../../../kit/components/KitShow/KitShow";
import { salesOrderOptions } from "../../../../../kit/configs/general";
import KitSelect from "../../../../../kit/components/KitSelect";
import { SyncBadge } from "../../../../../kit/utils/syncBadge";
import SalesOrderPreviewModal from "../../../components/BuyIntegration/SalesOrder/SalesOrderPreviewModal";

export default function CrmOrdersToBusy() {
    const nameRef = useRef(null);
    const storeRef = useRef(null);
    const exportRef = useRef(null);
    const refreshRef = useRef(null);
    const statusRef = useRef(null);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const pushPendingRef = useRef(null);
    const pushSelectedRef = useRef(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState();
    const [status, setStatus] = useState("");
    const [pushing, setPushing] = useState(null);
    const [activeRowIndex, setActiveRowIndex] = useState(0);
    const [activeColumn, setActiveColumn] = useState("preview");

    const query = {
        page,
        size: pageSize,
        ...(search && { search: search }),
        ...(status && { status: status }),
    };
    const { SalesOrderList, isSalesOrderListLoading, SalesOrderListError, refreshSalesOrderList } =
        useGetAllSalesOrder(query);
    const soNumbers = SalesOrderList?.data?.items?.map((o) => o.soNumber);
    const { OrderStatusList, refreshOrderStatusList } = useGetAllOrderStatus({ soNumbers: soNumbers });

    const toggleViewModal = () => setShowViewModal(!showViewModal);

    const handleView = (data) => {
        setSelectedItem(data);
        toggleViewModal();
    };

    const columns = [
        {
            field: "soNumber",
            headerName: "Sales Order",
            minWidth: 160,
            flex: 1,
            renderCell: (params) => (
                <div className="flex flex-col justify-center items-start leading-tight">
                    <Typography variant="body2" fontWeight={600}>
                        {params.row.soNumber || "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.orderDate || ""}
                    </Typography>
                </div>
            ),
        },
        {
            field: "customer",
            headerName: "Customer",
            minWidth: 190,
            flex: 1.2,
            renderCell: (params) => (
                <div className="flex flex-col justify-center items-start leading-tight min-w-0">
                    <Typography variant="body2" fontWeight={500} className="truncate">
                        {params.row.customerName || "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.customerPhone || ""}
                    </Typography>
                </div>
            ),
        },
        {
            field: "crmStatus",
            headerName: "CRM Status",
            minWidth: 150,
            flex: 0.9,
            renderCell: (params) => (
                <Typography variant="body2" className="capitalize">
                    {params.row.statusLabel || params.row.status?.replace(/_/g, " ") || "—"}
                </Typography>
            ),
        },
        {
            field: "grandTotal",
            headerName: "Total",
            minWidth: 130,
            flex: 0.8,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600}>
                    {priceFormat(params.row.grandTotal)}
                </Typography>
            ),
        },
        {
            field: "busyStatus",
            headerName: "BUSY Status",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => {
                const row = params.row;
                const sync = OrderStatusList?.data?.[row.soNumber];

                const done = !!sync && ["success", "verified"].includes(sync.status);

                return (
                    <div className="flex flex-col justify-center items-start gap-1">
                        <SyncBadge status={sync?.status} />

                        {sync?.busyNumber && (
                            <Typography variant="caption" color="text.secondary">
                                BUSY no. {sync.busyNumber}
                            </Typography>
                        )}

                        {sync?.errorMessage && !done && (
                            <Typography
                                variant="caption"
                                color="error"
                                className="max-w-40 truncate"
                                title={sync.errorMessage}
                            >
                                {sync.errorMessage}
                            </Typography>
                        )}
                    </div>
                );
            },
        },
        {
            field: "actions",
            headerName: "Actions",
            minWidth: 170,
            flex: 1,
            sortable: false,
            filterable: false,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => {
                const row = params.row;
                const sync = OrderStatusList?.data?.[row.soNumber];

                const done = !!sync && ["success", "verified"].includes(sync.status);
                const blocked = ["draft", "cancelled"].includes(row.status);

                return (
                    <div className="flex items-center justify-center gap-2">
                        <KitButton size="small" variant="outlined" className="w-auto!" onClick={() => handleView(row)}>
                            Preview
                        </KitButton>

                        <KitButton
                            size="small"
                            variant="contained"
                            className="w-auto!"
                            disabled={done || blocked || pushing === row.id}
                            // onClick={() => {
                            //     if (window.confirm(`Push ${row.soNumber} to BUSY as a sales order?`)) {
                            //         push(row.id);
                            //     }
                            // }}
                        >
                            {pushing === row.id ? "Pushing..." : done ? "In BUSY" : "Push"}
                        </KitButton>
                    </div>
                );
            },
        },
    ];

    const dataRows = SalesOrderList?.data?.items ?? [];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.shiftKey && e.key.toLowerCase() === "e") {
                e.preventDefault();
                exportRef.current?.click();
                return;
            }

            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "n":
                    nameRef.current?.focus();
                    break;
                case "s":
                    storeRef.current?.focus();
                    break;
                case "a":
                    e.preventDefault();
                    statusRef.current?.focus();
                    break;
                case "f":
                    startDateRef.current?.focus();
                    return;
                case "e":
                    endDateRef.current?.focus();
                    return;
                case "p":
                    pushPendingRef.current?.click();
                    break;
                case "d":
                    pushSelectedRef.current?.click();
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
        if (isSalesOrderListLoading || !dataRows.length) return;

        const row = dataRows[activeRowIndex];
        if (!row) return;

        const frameId = requestAnimationFrame(() => {
            const activeGridRow = Array.from(document.querySelectorAll(".MuiDataGrid-row")).find(
                (element) => element.getAttribute("data-id") === String(row.id)
            );
            if (!activeGridRow) return;
            const buttons = activeGridRow.querySelectorAll(".MuiDataGrid-cell[data-field='actions'] button");
            const element = buttons[activeColumn === "preview" ? 0 : 1];
            if (element instanceof HTMLElement && !element.hasAttribute("disabled")) {
                element.focus({ preventScroll: true });
            }
        });

        return () => cancelAnimationFrame(frameId);
    }, [isSalesOrderListLoading, dataRows, activeRowIndex, activeColumn]);

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
                e.stopPropagation();
                setActiveRowIndex((prev) => Math.min(prev + 1, dataRows.length - 1));
                return;
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                setActiveRowIndex((prev) => Math.max(prev - 1, 0));
                return;
            }

            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                e.stopPropagation();
                setActiveColumn(e.key === "ArrowLeft" ? "preview" : "push");
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [dataRows.length]);

    useEffect(() => {
        setActiveRowIndex(0);
        setActiveColumn("preview");
    }, [page, pageSize, search, status]);

    return (
        <div>
            <div className="flex flex-col gap-3 w-full min-w-0">
                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-7">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + N" className="top-0" />
                            <KitTextField
                                inputRef={nameRef}
                                size="small"
                                height="32px"
                                label="Search"
                                placeholderFontSize={14}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="SO number / customer"
                                className="w-44"
                            />
                        </div>
                        <div className="relative w-60">
                            <ShortcutBadge shortcut="Alt + A" className="top-0" />
                            <KitSelect
                                ref={statusRef}
                                label="Status"
                                placeholder="Select Status"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={salesOrderOptions}
                                value={
                                    salesOrderOptions.find((option) => String(option.value) === String(status)) ?? ""
                                }
                                onChange={(option) => setStatus(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                            <IconButton
                                ref={refreshRef}
                                onClick={() => refreshSalesOrderList()}
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                <KitDataGrid
                    columns={columns}
                    rows={SalesOrderList?.data?.items ?? []}
                    getRowId={(row) => row.id}
                    rowCount={SalesOrderList?.data?.totalItems ?? 0}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    loading={isSalesOrderListLoading}
                    error={!!SalesOrderListError}
                    disableRowSelectionOnClick
                    getRowClassName={(params) =>
                        dataRows[activeRowIndex]?.id === params.id ? "keyboard-active-row" : ""
                    }
                />
            </div>

            <KitShow show={showViewModal}>
                <SalesOrderPreviewModal open={showViewModal} onClose={toggleViewModal} selectedItem={selectedItem} />
            </KitShow>
        </div>
    );
}
