import { useEffect, useMemo, useRef, useState } from "react";
import { Chip, Divider, IconButton, Paper, Typography } from "@mui/material";
import {
    useGetAllInventoryAlerts,
    useGetDisplayArray,
    useGetReturnArray,
} from "../../../../kit/hooks/data/inventoryManagement";
import { useGetAllBrandsWithId } from "../../../../kit/hooks/data/brand";
import { useGetAllVendors } from "../../../../kit/hooks/data/vendors";
import KitHeader from "../../../../kit/components/KitHeader/KitHeader";
import ShortcutBadge from "../Dashboard/ShortcutBadge";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../kit/components/KitDataGrid/KitDataGrid";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import KitSelect from "../../../../kit/components/KitSelect";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import { downloadCSV, flattenNestedObjects } from "../../../../kit/utils/downloadCSV";
import { exportToPdf } from "../../../../kit/utils/pdfExport";
import { toast } from "react-toastify";
import { format } from "date-fns";

const REPORT_HEADER_CONFIG = {
    STOCK_OUT: {
        title: "Stockout Alerts",
        subtitle: "View and manage products with stock shortages",
    },
    UNDER_STOCK: {
        title: "Under Stock Alerts",
        subtitle: "View and manage products below the minimum stock level",
    },
    OVER_STOCK: {
        title: "Excess Stock Alerts",
        subtitle: "View and manage excess stock products",
    },
    DEAD_STOCK: {
        title: "Dead Stock Alerts",
        subtitle: "View and manage products with no or low sales activity",
    },
    NEGATIVE_STOCK: {
        title: "Negative Stock Alerts",
        subtitle: "View and manage products with negative inventory",
    },
};

const REPORT_SUMMARY_CONFIG = {
    STOCK_OUT: {
        bgClass: "bg-red-50! dark:bg-red-950/50!",
        textClass: "text-red-500! dark:text-red-400!",
        valueLabel: "Loss in Sales",
        valueKey: "lossInSales",
    },
    UNDER_STOCK: {
        bgClass: "bg-amber-50! dark:bg-amber-950/50!",
        textClass: "text-amber-600! dark:text-amber-400!",
        valueLabel: "Loss in Sales",
        valueKey: "lossInSales",
    },
    NEGATIVE_STOCK: {
        bgClass: "bg-amber-50! dark:bg-amber-950/50!",
        textClass: "text-amber-600! dark:text-amber-400!",
        valueLabel: "Loss in Sales",
        valueKey: "lossInSales",
    },
    OVER_STOCK: {
        bgClass: "bg-red-50! dark:bg-red-950/50!",
        textClass: "text-red-500! dark:text-red-400!",
        valueLabel: "Excess Stock Value Loss",
        valueKey: "excessStockValue",
    },
    DEAD_STOCK: {
        bgClass: "bg-red-50! dark:bg-red-950/50!",
        textClass: "text-red-500! dark:text-red-400!",
        valueLabel: "Dead Stock Value",
        valueKey: "excessStockValue",
    },
};

export default function ProductManagementReport({ alertType }) {
    const itemCodeRef = useRef(null);
    const productRef = useRef(null);
    const groupNameRef = useRef(null);
    const brandRef = useRef(null);
    const vendorRef = useRef(null);
    const refreshRef = useRef(null);
    const exportRef = useRef(null);
    const displayExportRef = useRef(null);
    const ReturnExportRef = useRef(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [itemCode, setItemCode] = useState("");
    const [groupName, setGroupName] = useState("");
    const [brandName, setBrandName] = useState([]);
    const [vendorName, setVendorName] = useState([]);
    const [exportPageSize, setExportPageSize] = useState(null);
    const [exportProductLoading, setExportProductLoading] = useState(false);
    const [rowSelectionModel, setRowSelectionModel] = useState({
        type: "include",
        ids: new Set(),
    });
    const [selectedItems, setSelectedItems] = useState([]);
    const [activeRowIndex, setActiveRowIndex] = useState(0);

    const { alerts, isAlertsLoading, alertsError, refreshAlerts } = useGetAllInventoryAlerts({
        ...(search && { search: search }),
        ...(itemCode.trim() && { itemCode: itemCode.trim() }),
        ...(groupName.trim() && { groupName: groupName.trim() }),
        ...(brandName.length > 0 && { brandName: brandName.join(",") }),
        ...(vendorName.length > 0 && { vendorName: vendorName.join(",") }),
        alertType,
        page,
        size: exportPageSize ?? pageSize,
    });
    const { bandsWithId, isBandsWithIdLoading } = useGetAllBrandsWithId();
    const { vendors, isVendorsLoading } = useGetAllVendors({ page: 1, limit: 1000 });
    const { GetReturnArray: onCreateReturn, isReturnALoading } = useGetReturnArray();
    const { GetDisplayArray: onCreateDisplay, isDisplayLoading } = useGetDisplayArray();

    const brandOptions = useMemo(
        () =>
            bandsWithId?.data?.map((brand) => ({
                label: brand.brandName,
                value: brand.brandName,
            })) ?? [],
        [bandsWithId]
    );

    const vendoreOptions = useMemo(
        () =>
            vendors?.map((vendor) => ({
                label: vendor.businessName || "",
                value: vendor.businessName || "",
            })) || [],
        [vendors]
    );

    const columns = [
        {
            field: "itemId",
            headerName: "Item Id",
            minWidth: 120,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {params?.row?.itemId ?? "-"}
                </Typography>
            ),
        },
        {
            field: "itemName",
            headerName: "Name",
            minWidth: 200,
            flex: 1,
            renderCell: (params) => (
                <Typography className="truncate text-sm!" title={params.row.itemName ?? ""}>
                    {params.row.itemName ?? "-"}
                </Typography>
            ),
        },
        {
            field: "pCategory",
            headerName: "P Category",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography className="truncate text-sm!" title={params.row.pCategory}>
                    {params.row.pCategory ?? "-"}
                </Typography>
            ),
        },
        {
            field: "storeName",
            headerName: "Store Name",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography className="truncate text-sm!" title={params.row.store.storeName}>
                    {params.row.store.storeName ?? "-"}
                </Typography>
            ),
        },
        {
            field: "brand",
            headerName: "Brand Name",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography className="truncate text-sm!" title={params.row.brand}>
                    {params.row.brand ?? "-"}
                </Typography>
            ),
        },
        {
            field: "stockQty",
            headerName: "Current Stock",
            minWidth: 140,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {params.row.inventory?.stockQty ?? 0}
                </Typography>
            ),
        },
        {
            field: "price",
            headerName: "Sale Price",
            minWidth: 130,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {priceFormat(params.row.price)}
                </Typography>
            ),
        },
        {
            field: "status",
            headerName: "Status",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => {
                const purchaseOrder = params.row.purchaseOrders?.[0];
                const poValidTillDate = purchaseOrder?.poValidTillDate;

                if (!poValidTillDate) {
                    return <Typography className="text-sm!">-</Typography>;
                }

                const expiryDate = new Date(poValidTillDate);
                if (Number.isNaN(expiryDate.getTime())) {
                    return <Typography className="text-sm!">-</Typography>;
                }

                const today = new Date();
                const expiryDateStr = expiryDate.toISOString().slice(0, 10);
                const todayDateStr = today.toISOString().slice(0, 10);

                const isExpired = expiryDateStr < todayDateStr;
                const finalPOQuantity = Number(purchaseOrder?.finalPOQuantity ?? 0);
                const adjustment = Number(purchaseOrder?.Adjustment ?? 0);
                const isFulfilled = finalPOQuantity === adjustment;

                const isLate = isExpired && !isFulfilled;

                return (
                    <Chip
                        size="small"
                        label={isLate ? "PO is late" : "PO Generated"}
                        className={isLate ? "bg-yellow-100! text-yellow-700!" : "bg-green-100! text-green-700!"}
                    />
                );
            },
        },
        {
            field: "avgWeeklySale",
            headerName: "Avg Weekly Sale",
            minWidth: 160,
            flex: 1,
            renderCell: (params) => <Typography className="text-sm!">{params.row.avgWeeklySale ?? "-"}</Typography>,
        },
        {
            field: "lastSixMonthVolume",
            headerName: "Last 6 Month Volume",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography className="text-sm!">{params.row.lastSixMonthVolume ?? "-"}</Typography>
            ),
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.shiftKey && e.key.toLowerCase() === "e") {
                e.preventDefault();
                exportRef.current?.click();
                return;
            }

            if (e.shiftKey && e.key.toLowerCase() === "r") {
                e.preventDefault();
                ReturnExportRef.current?.click();
                return;
            }

            if (e.shiftKey && e.key.toLowerCase() === "d") {
                e.preventDefault();
                displayExportRef.current?.click();
                return;
            }

            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "i":
                    itemCodeRef.current?.focus();
                    break;
                case "p":
                    productRef.current?.focus();
                    break;
                case "g":
                    groupNameRef.current?.focus();
                    break;
                case "b":
                    brandRef.current?.focus();
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

    const dataRows = alerts?.data ?? [];

    useEffect(() => {
        setActiveRowIndex((prev) => (dataRows.length === 0 ? 0 : Math.min(prev, dataRows.length - 1)));
    }, [dataRows.length, page, pageSize, search, itemCode, groupName, brandName, vendorName]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!dataRows.length) return;

            const target = e.target;
            const isTyping =
                target instanceof HTMLElement &&
                (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

            if (isTyping) return;

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

                    const rowId = row.id;
                    const ids = new Set(rowSelectionModel.ids);

                    if (ids.has(rowId)) {
                        ids.delete(rowId);
                    } else {
                        ids.add(rowId);
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
        const currentRows = alerts?.data ?? [];
        const currentPageIds = new Set(currentRows.map((row) => row.id));

        setRowSelectionModel(selection);
        setSelectedItems((previousItems) => [
            ...previousItems.filter((item) => !currentPageIds.has(item.id)),
            ...currentRows.filter((row) => selection.ids.has(row.id)),
        ]);
    };

    const handleDownloadReturnPdf = async () => {
        if (!selectedItems.length) return;

        const productCodes = selectedItems.map((item) => item.itemId);

        try {
            const response = await onCreateReturn({
                productCodes: productCodes,
            });

            if (!response?.data) {
                throw toast.error("No data returned");
            }

            exportToPdf({
                headers: [
                    { header: "Product Code", dataKey: "productCode" },
                    { header: "Product Name", dataKey: "productName" },
                    { header: "Price", dataKey: "price" },
                    { header: "Store Name", dataKey: "storeName" },
                    { header: "Stock Value", dataKey: "stockValue" },
                    { header: "Vendor Name", dataKey: "vendorName" },
                    { header: "Current Stocks", dataKey: "currentStock" },
                    { header: "Sales Last Two Months", dataKey: "salesLastTwoMonths" },
                    { header: "Days Since Last Sale", dataKey: "daysSinceLastSale" },
                ],
                data: response?.data ?? [],
                fileName: `ReturnExport_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.pdf`,
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

    const handleDownloadDisplayPDF = async () => {
        if (!selectedItems.length) return;

        const productCodes = selectedItems.map((item) => item.itemId);

        try {
            const response = await onCreateDisplay({
                productCodes: productCodes,
            });

            const formattedData = (response?.data ?? []).map((item) => ({
                ...item,
                lastPurchaseDate: item.lastPurchaseDate ? format(new Date(item.lastPurchaseDate), "yyyy-MM-dd") : "",
            }));

            exportToPdf({
                headers: [
                    { header: "Product Code", dataKey: "productCode" },
                    { header: "Product Name", dataKey: "productName" },
                    { header: "Price", dataKey: "price" },
                    { header: "Store Name", dataKey: "storeName" },
                    { header: "Sales Last Two Months", dataKey: "salesLastTwoMonths" },
                    { header: "Days Since Last Sale", dataKey: "daysSinceLastSale" },
                    { header: "Stock Qty", dataKey: "stockQty" },
                    { header: "Last Purchase Date ", dataKey: "lastPurchaseDate" },
                ],
                data: formattedData,
                fileName: `DisplayExport_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.pdf`,
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

    const EXPORT_HEADER_MAP = {
        itemId: "itemId",
        itemName: "itemName",
        "store.storeName": "storeName",
        "vendor.businessName": "vendorName",
        brand: "brandName",
        "inventory.stockQty": "currentStock",
        price: "salePrice",
        avgWeeklySale: "avgWeeklySale",
        lastSixMonthVolume: "last6MonthsVolume",
    };

    const EXPORT_HEADERS = Object.values(EXPORT_HEADER_MAP);

    const handleExport = async () => {
        const totalItems = alerts?.meta?.totalItems;

        if (!totalItems) {
            toast.error("Unable to determine total number of alerts.");
            return;
        }

        setExportProductLoading(true);
        setExportPageSize(totalItems);
    };

    useEffect(() => {
        if (exportPageSize && alerts?.data && alerts.data.length === exportPageSize) {
            const rows = flattenNestedObjects(alerts.data, EXPORT_HEADER_MAP);
            downloadCSV(rows, EXPORT_HEADERS, `all_${alertType}_export.csv`);
            setExportPageSize(null);
            setExportProductLoading(false);
        }
    }, [exportPageSize, alerts]);

    const headerConfig = REPORT_HEADER_CONFIG[alertType] ?? REPORT_HEADER_CONFIG.STOCK_OUT;
    const summaryConfig = REPORT_SUMMARY_CONFIG[alertType];
    const summaryValue = alerts?.purchaseOrdersSummary?.[summaryConfig.valueKey] ?? 0;

    return (
        <div>
            <Divider className="mb-3!" />
            <div className="flex flex-col gap-3 w-full min-w-0">
                <KitHeader
                    title={headerConfig.title}
                    subtitle={headerConfig.subtitle}
                    icon="tabler:file-invoice"
                    count={alerts?.meta?.totalItems ?? 0}
                    countLabel="records"
                />

                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-7">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + I" className="top-0" />
                            <KitTextField
                                inputRef={itemCodeRef}
                                size="small"
                                height="32px"
                                label="Item Code"
                                placeholderFontSize={14}
                                value={itemCode}
                                onChange={(e) => setItemCode(e.target.value)}
                                placeholder="e.g. ALR39337"
                                className="w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + P" className="top-0" />
                            <KitTextField
                                inputRef={productRef}
                                size="small"
                                height="32px"
                                label="Product Name"
                                placeholderFontSize={14}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by product name or category"
                                className="w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + G" className="top-0" />
                            <KitTextField
                                inputRef={groupNameRef}
                                size="small"
                                height="32px"
                                label="Group Name"
                                placeholderFontSize={14}
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                placeholder="e.g. NESTLE, HUL-NON FOOD"
                                className="w-44"
                            />
                        </div>
                        <div className="relative w-60">
                            <ShortcutBadge shortcut="Alt + B" className="top-0" />
                            <KitSelect
                                ref={brandRef}
                                label="Brand Name"
                                placeholder="Select Brand Names"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={brandOptions}
                                isDisabled={isBandsWithIdLoading}
                                isMulti
                                closeMenuOnSelect={false}
                                value={brandOptions.filter((option) => brandName.includes(option.value))}
                                onChange={(selected) => {
                                    setBrandName(
                                        Array.isArray(selected) ? selected.map((option) => String(option.value)) : []
                                    );
                                }}
                            />
                        </div>
                        <div className="relative w-60">
                            <ShortcutBadge shortcut="Alt + V" className="top-0" />
                            <KitSelect
                                ref={vendorRef}
                                label="Vendor Name"
                                placeholder="Select Vendor Names"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={vendoreOptions}
                                isDisabled={isVendorsLoading}
                                isMulti
                                closeMenuOnSelect={false}
                                value={vendoreOptions.filter((option) => vendorName.includes(option.value))}
                                onChange={(selected) => {
                                    setVendorName(
                                        Array.isArray(selected) ? selected.map((option) => String(option.value)) : []
                                    );
                                }}
                            />
                        </div>
                        {selectedItems.length > 0 && ["OVER_STOCK", "DEAD_STOCK"].includes(alertType) && (
                            <div className="relative">
                                <ShortcutBadge shortcut="Shift + R" className="-top-5!" />
                                <KitButton
                                    ref={ReturnExportRef}
                                    size="small"
                                    variant="contained"
                                    className="w-auto"
                                    disabled={isReturnALoading || selectedItems.length === 0}
                                    isLoading={isReturnALoading}
                                    onClick={handleDownloadReturnPdf}
                                >
                                    Return Report
                                </KitButton>
                            </div>
                        )}

                        {selectedItems.length > 0 &&
                            ["NEGATIVE_STOCK", "OVER_STOCK", "DEAD_STOCK"].includes(alertType) && (
                                <div className="relative">
                                    <ShortcutBadge shortcut="Shift + D" className="-top-5!" />
                                    <KitButton
                                        ref={displayExportRef}
                                        size="small"
                                        variant="contained"
                                        className="w-auto"
                                        disabled={isDisplayLoading || selectedItems.length === 0}
                                        isLoading={isDisplayLoading}
                                        onClick={handleDownloadDisplayPDF}
                                    >
                                        Check Display Report
                                    </KitButton>
                                </div>
                            )}
                        {alerts?.data?.length !== 0 && (
                            <div className="relative">
                                <ShortcutBadge shortcut="Shift + E" className="-top-5!" />
                                <KitButton
                                    ref={exportRef}
                                    size="small"
                                    variant="contained"
                                    className="w-auto"
                                    disabled={exportProductLoading}
                                    isLoading={exportProductLoading}
                                    onClick={handleExport}
                                >
                                    Export
                                </KitButton>
                            </div>
                        )}
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                            <IconButton
                                ref={refreshRef}
                                onClick={() => refreshAlerts()}
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                <Paper elevation={0} className={`inline-block rounded-lg p-4 ${summaryConfig.bgClass}`}>
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <Typography className={`text-[24px]! font-semibold! ${summaryConfig.textClass}`}>
                                {alerts?.meta?.totalItems ?? 0}
                            </Typography>
                            <Typography className="ml-2 text-gray-500">Products</Typography>
                        </div>

                        <div className="flex items-center gap-2">
                            <Typography className={`text-[24px]! font-semibold! ${summaryConfig.textClass}`}>
                                {priceFormat(summaryValue)}
                            </Typography>
                            <Typography className="ml-2 text-gray-500">{summaryConfig.valueLabel}</Typography>
                        </div>
                    </div>
                </Paper>

                <KitDataGrid
                    columns={columns}
                    rows={alerts?.data ?? []}
                    getRowId={(row) => row.id}
                    getRowClassName={(params) =>
                        dataRows[activeRowIndex]?.id === params.id ? "keyboard-active-row" : ""
                    }
                    rowCount={alerts?.meta?.totalItems}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    isLoading={isAlertsLoading}
                    error={!!alertsError}
                    checkboxSelection={!["STOCK_OUT", "UNDER_STOCK"].includes(alertType)}
                    rowSelection={!["STOCK_OUT", "UNDER_STOCK"].includes(alertType)}
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
