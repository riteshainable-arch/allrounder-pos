import { Divider, Typography } from "@mui/material";
import KitHeader from "../../../../../kit/components/KitHeader/KitHeader";
import { useEffect, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { priceFormat } from "../../../../../kit/utils/priceFormat";
import { useGetAllTransferReport } from "../../../../../kit/hooks/data/reports";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import KitDebouncedInput from "../../../../../kit/components/KitDebouncedInput";
import { toast } from "react-toastify";
import { exportToPdf } from "../../../../../kit/utils/pdfExport";
import KitShow from "../../../../../kit/components/KitShow/KitShow";
import { format } from "date-fns";

export const DEFAULT_MAX_WOS = 8;

export default function TransferReport() {
    const searchRef = useRef(null);
    const refreshRef = useRef(null);
    const downloadRef = useRef(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [rowSelectionModel, setRowSelectionModel] = useState({
        type: "include",
        ids: new Set(),
    });
    const [selectedItems, setSelectedItems] = useState([]);
    const [activeRowIndex, setActiveRowIndex] = useState(0);

    const { transferReportList, isTransferReportLoading, transferReportError, refreshTransferReport } =
        useGetAllTransferReport({
            ...(search && { search: search }),
            page,
            limit: pageSize,
        });
    const dataRows = transferReportList?.data ?? [];

    const columns = [
        {
            field: "itemName",
            headerName: "Item Name",
            minWidth: 200,
            flex: 1.2,
            renderCell: (params) => (
                <Typography variant="body2" className="truncate" title={params.row.itemName ?? ""}>
                    {params.row.itemName ?? "-"}
                </Typography>
            ),
        },
        {
            field: "storeName",
            headerName: "Store Name",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" className="truncate" title={params.row.storeName ?? ""}>
                    {params.row.storeName ?? "-"}
                </Typography>
            ),
        },
        {
            field: "price",
            headerName: "Price",
            minWidth: 130,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {priceFormat(params.row.price)}
                </Typography>
            ),
        },
        {
            field: "currentStock",
            headerName: "Current Stock",
            minWidth: 130,
            flex: 0.8,
            renderCell: (params) => <Typography variant="body2">{params.row.currentStock ?? 0}</Typography>,
        },
        {
            field: "transferToStoreName",
            headerName: "Transfer To StoreName",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" className="truncate" title={params.row.transferToStoreName ?? ""}>
                    {params.row.transferToStoreName ?? "-"}
                </Typography>
            ),
        },
        {
            field: "transferQty",
            headerName: "Transfer Qty",
            minWidth: 130,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {params.row.transferQty}
                </Typography>
            ),
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            e.preventDefault();

            switch (e.key.toLowerCase()) {
                case "o":
                    searchRef.current?.focus();
                    break;

                case "d":
                    downloadRef.current?.focus();
                    break;

                case "r":
                    refreshRef.current?.click();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        setActiveRowIndex(0);
    }, [page, pageSize, search]);

    useEffect(() => {
        setActiveRowIndex((prev) => (dataRows.length === 0 ? 0 : Math.min(prev, dataRows.length - 1)));
    }, [dataRows.length]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!dataRows.length) return;

            const target = e.target;

            if (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
                return;
            }

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setActiveRowIndex((prev) => Math.min(prev + 1, dataRows.length - 1));
                    break;

                case "ArrowUp":
                    e.preventDefault();
                    setActiveRowIndex((prev) => Math.max(prev - 1, 0));
                    break;

                case "Enter": {
                    e.preventDefault();

                    const row = dataRows[activeRowIndex];
                    if (!row) return;

                    const ids = new Set(rowSelectionModel.ids);

                    if (ids.has(row.itemId)) {
                        ids.delete(row.itemId);
                    } else {
                        ids.add(row.itemId);
                    }

                    handleSelectionChange({
                        type: "include",
                        ids,
                    });

                    break;
                }

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [dataRows, activeRowIndex, rowSelectionModel]);

    const handleSelectionChange = (selection) => {
        const currentRows = transferReportList?.data ?? [];
        const currentPageIds = new Set(currentRows.map((row) => row.itemId));

        setRowSelectionModel(selection);
        setSelectedItems((previousItems) => [
            ...previousItems.filter((item) => !currentPageIds.has(item.itemId)),
            ...currentRows.filter((row) => selection.ids.has(row.itemId)),
        ]);
    };

    const handleDownloadPdf = async () => {
        if (!selectedItems.length) return;
        try {
            exportToPdf({
                headers: [
                    { header: "Item Name", dataKey: "itemName" },
                    { header: "Store Name", dataKey: "storeName" },
                    { header: "Price", dataKey: "price" },
                    { header: "Current Stock", dataKey: "currentStock" },
                    { header: "Transfer To StoreName", dataKey: "transferToStoreName" },
                    { header: "Transfer Qty", dataKey: "transferQty" },
                ],
                data: selectedItems ?? [],
                fileName: `TransferReport_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.pdf`,
            });
            setRowSelectionModel({
                type: "include",
                ids: new Set(),
            });
            setSelectedItems([]);
        } catch (err) {
            toast.error(err?.message || "Failed to download report");
        }
    };

    return (
        <div>
            <Divider className="mb-5!" />
            <div className="flex flex-col gap-3 w-full min-w-0">
                <div className="flex justify-between">
                    <KitHeader
                        title="Transfer Report"
                        subtitle="View and track stock transfers between stores"
                        icon="tabler:file-invoice"
                        count={transferReportList?.meta?.totalItems ?? 0}
                        countLabel="records"
                    />

                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + O" className="-top-5!" />
                            <KitDebouncedInput
                                ref={searchRef}
                                value={search}
                                onChange={(value) => setSearch(String(value))}
                                placeholder="Product Name / Product Code"
                                className="w-52"
                                size="small"
                            />
                        </div>

                        <KitShow show={selectedItems.length > 0}>
                            <div className="relative">
                                <ShortcutBadge shortcut="Alt + D" className="-top-5" />
                                <KitButton
                                    ref={downloadRef}
                                    size="small"
                                    variant="contained"
                                    className="w-auto"
                                    onClick={() => handleDownloadPdf()}
                                >
                                    Download Report
                                </KitButton>
                            </div>
                        </KitShow>

                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                            <KitButton
                                ref={refreshRef}
                                size="small"
                                variant="contained"
                                className="w-auto"
                                onClick={() => refreshTransferReport()}
                            >
                                Refresh
                            </KitButton>
                        </div>
                    </div>
                </div>

                <KitDataGrid
                    columns={columns}
                    rows={transferReportList?.data ?? []}
                    getRowId={(row) => row.itemId}
                    rowCount={transferReportList?.meta?.totalItems}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    isLoading={isTransferReportLoading}
                    error={!!transferReportError}
                    getRowClassName={(params) =>
                        dataRows[activeRowIndex]?.itemId === params.id ? "keyboard-active-row" : ""
                    }
                    checkboxSelection
                    rowSelection
                    disableRowSelectionOnClick
                    disableRowSelectionExcludeModel
                    keepNonExistentRowsSelected
                    onRowSelectionModelChange={handleSelectionChange}
                    rowSelectionModel={rowSelectionModel}
                />
            </div>
        </div>
    );
}
