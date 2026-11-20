import { Divider, IconButton, Paper, Typography } from "@mui/material";
import KitHeader from "../../../../../kit/components/KitHeader/KitHeader";
import { useEffect, useMemo, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { priceFormat } from "../../../../../kit/utils/priceFormat";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import KitSelect from "../../../../../kit/components/KitSelect";
import { useGetAllVendors } from "../../../../../kit/hooks/data/vendors";
import { format } from "date-fns";
import { useGetAllItemStockReport } from "../../../../../kit/hooks/data/reports";
import { useGetAllStoreList } from "../../../../../kit/hooks/data/store";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import { downloadCSV } from "../../../../../kit/utils/downloadCSV";

export const DEFAULT_MAX_WOS = 8;

export default function ItemStockReport({ divider = true }) {
    const productRef = useRef(null);
    const storeRef = useRef(null);
    const vendorRef = useRef(null);
    const exportRef = useRef(null);
    const refreshRef = useRef(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [storeId, setStoreId] = useState("");
    const [vendorId, setVendorId] = useState("");
    const [exportPageSize, setExportPageSize] = useState(null);
    const [exportProductLoading, setExportProductLoading] = useState(false);

    const { itemStockReportList, isItemStockReportLoading, itemStockReportError, refreshItemStockReport } =
        useGetAllItemStockReport({
            ...(search && { search: search }),
            ...(storeId && { storeId: storeId }),
            ...(vendorId && { vendorId: vendorId }),
            page,
            size: exportPageSize ?? pageSize,
        });
    const { vendors, isVendorsLoading } = useGetAllVendors({ page: 1, limit: 1000 });
    const { storeList, isStoreListLoading } = useGetAllStoreList();

    const storeOptions = useMemo(
        () =>
            storeList?.data?.stores?.map((store) => ({
                label: store.storeName || "",
                value: String(store.id),
            })) || [],
        [storeList]
    );

    const vendoreOptions = useMemo(
        () =>
            vendors?.map((vendor) => ({
                label: vendor.businessName || "",
                value: String(vendor.id),
            })) || [],
        [vendors]
    );

    const columns = [
        {
            field: "itemId",
            headerName: "Item ID",
            minWidth: 100,
            flex: 0.7,
            renderCell: (params) => <Typography variant="body2">{params.row.itemId ?? "-"}</Typography>,
        },
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
            field: "latestMrp",
            headerName: "MRP",
            minWidth: 130,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {priceFormat(params.row.latestMrp)}
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
            field: "vendorName",
            headerName: "Vendor Name",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" className="truncate" title={params.row.vendorName ?? ""}>
                    {params?.row?.vendorName ? params.row.vendorName : "-"}
                </Typography>
            ),
        },
        {
            field: "stockQty",
            headerName: "Current Stock",
            minWidth: 130,
            flex: 0.8,
            renderCell: (params) => <Typography variant="body2">{params.row.stockQty ?? 0}</Typography>,
        },
        {
            field: "excessStock",
            headerName: "Excess Stock",
            minWidth: 130,
            flex: 0.8,
            renderCell: (params) => {
                const avgWeeklySales = Number(params.row.avgWeeklySales) || 0;
                const stockQty = Number(params.row.stockQty) || 0;
                const requiredStock = avgWeeklySales * DEFAULT_MAX_WOS;
                const excessStock = Math.max(stockQty - requiredStock, 0);

                return <Typography variant="body2">{excessStock}</Typography>;
            },
        },
        {
            field: "saleOfLast2Months",
            headerName: "Sale of Last 2 Months",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => <Typography variant="body2">{params.row.saleOfLast2Months ?? 0}</Typography>,
        },
        {
            field: "daysSinceLastSale",
            headerName: "Days Since Last Sale",
            minWidth: 170,
            flex: 1,
            renderCell: (params) => {
                const lastSaleDate = params.row.lastSaleDate;
                if (!lastSaleDate) {
                    return <Typography variant="body2">-</Typography>;
                }
                const lastDate = new Date(lastSaleDate);
                if (Number.isNaN(lastDate.getTime())) {
                    return <Typography variant="body2">-</Typography>;
                }
                const today = new Date();
                const diffTime = today.getTime() - lastDate.getTime();
                const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                return <Typography variant="body2">{days < 0 ? "-" : days}</Typography>;
            },
        },
        {
            field: "lastSaleDate",
            headerName: "Last Sale Date",
            minWidth: 150,
            flex: 0.9,
            renderCell: (params) => {
                const lastSaleDate = params.row.lastSaleDate;
                if (!lastSaleDate) {
                    return <Typography variant="body2">-</Typography>;
                }
                const date = new Date(lastSaleDate);
                if (Number.isNaN(date.getTime())) {
                    return <Typography variant="body2">-</Typography>;
                }

                return <Typography variant="body2">{format(date, "dd/MM/yyyy")}</Typography>;
            },
        },
    ];

    const EXPORT_HEADER_MAP = {
        itemId: "itemId",
        itemName: "itemName",
        latestMrp: "latestMrp",
        storeName: "storeName",
        vendorName: "vendorName",
        currentStock: "stockQty",
        excessStock: "avgWeeklySales",
        saleOfLast2Months: "saleOfLast2Months",
        daysSinceLastSale: "daysSinceLastSale",
        lastSaleDate: "lastSaleDate",
    };

    const EXPORT_HEADERS = Object.values(EXPORT_HEADER_MAP);

    function flattenProducts(products, headers) {
        return products.map((product) => {
            const row = {};
            headers.forEach((header) => {
                if (header === "daysSinceLastSale") {
                    const lastSaleDate = product.lastSaleDate;
                    if (!lastSaleDate) {
                        row[header] = "-";
                    } else {
                        const lastDate = new Date(lastSaleDate);
                        const today = new Date();
                        const diffTime = today.getTime() - lastDate.getTime();
                        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        row[header] = days < 0 ? "-" : days.toString();
                    }
                } else if (header === "excessStock") {
                    const avgWeeklySales = product.avgWeeklySales;
                    const stockQty = product.stockQty;
                    const requireStock = avgWeeklySales * DEFAULT_MAX_WOS;
                    const excessStock = stockQty - requireStock;
                    row[header] = Math.max(excessStock, 0).toString();
                } else {
                    row[header] = product[header] ?? "";
                }
            });

            return row;
        });
    }

    const handleExport = async () => {
        const totalItems = itemStockReportList?.meta?.totalItems;
        if (!totalItems) {
            toast.error("Unable to determine total number of Stocks.");
            return;
        }
        setExportProductLoading(true);
        setExportPageSize(totalItems);
    };

    useEffect(() => {
        if (exportPageSize && itemStockReportList?.data && itemStockReportList.data.length === exportPageSize) {
            const rows = flattenProducts(itemStockReportList.data, EXPORT_HEADERS);
            downloadCSV(rows, EXPORT_HEADERS, "all_stock_reports_export.csv");
            setExportPageSize(null);
            setExportProductLoading(false);
        }
    }, [exportPageSize, itemStockReportList]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.shiftKey && e.key.toLowerCase() === "e") {
                e.preventDefault();
                exportRef.current?.click();
                return;
            }

            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "i":
                    productRef.current?.focus();
                    break;
                case "s":
                    storeRef.current?.focus();
                    break;
                case "v":
                    vendorRef.current?.focus();
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
            {divider && <Divider className="mb-3!" />}
            <div className="flex flex-col gap-3 w-full min-w-0">
                <KitHeader
                    title="Item Stock Report"
                    subtitle="View and analyze item-wise stock details"
                    icon="tabler:file-invoice"
                    count={itemStockReportList?.meta?.totalItems ?? 0}
                    countLabel="records"
                />

                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                    <div className="grid grid-cols-2 items-end gap-x-2 gap-y-3 md:flex md:flex-wrap md:gap-y-7">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + I" className="top-0 hidden md:block" />
                            <KitTextField
                                inputRef={productRef}
                                size="small"
                                height="32px"
                                label="Item Name"
                                placeholderFontSize={14}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Item Code / Item Name / Brand Name"
                                className="w-full md:w-44"
                            />
                        </div>
                        <div className="relative w-full min-w-0 md:w-60">
                            <ShortcutBadge shortcut="Alt + S" className="top-0 hidden md:block" />
                            <KitSelect
                                ref={storeRef}
                                label="Store Name"
                                placeholder="Store Name"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={storeOptions}
                                isDisabled={isStoreListLoading}
                                isClearable
                                value={storeOptions.find((option) => String(option.value) === String(storeId)) ?? ""}
                                onChange={(option) => setStoreId(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative w-full min-w-0 md:w-60">
                            <ShortcutBadge shortcut="Alt + V" className="top-0 hidden md:block" />
                            <KitSelect
                                ref={vendorRef}
                                label="Vendor Name"
                                placeholder="Vendor Name"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={vendoreOptions}
                                isDisabled={isVendorsLoading}
                                isClearable
                                value={vendoreOptions.find((option) => String(option.value) === String(vendorId)) ?? ""}
                                onChange={(option) => setVendorId(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Shift + E" className="-top-5! hidden md:block" />
                            <KitButton
                                ref={exportRef}
                                size="small"
                                variant="contained"
                                className="w-full md:w-auto"
                                disabled={exportProductLoading}
                                isLoading={exportProductLoading}
                                onClick={handleExport}
                            >
                                Export
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5! hidden md:block" />
                            <IconButton
                                ref={refreshRef}
                                onClick={() => refreshItemStockReport()}
                                className="w-full md:w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                <KitDataGrid
                    columns={columns}
                    rows={itemStockReportList?.data ?? []}
                    getRowId={(row) => row.itemId}
                    rowCount={itemStockReportList?.meta?.totalItems}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    isLoading={isItemStockReportLoading}
                    error={!!itemStockReportError}
                    disableRowSelectionOnClick
                />
            </div>
        </div>
    );
}
