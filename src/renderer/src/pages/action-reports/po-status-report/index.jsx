import { Chip, Divider, IconButton, Paper, Typography } from "@mui/material";
import KitHeader from "../../../../../kit/components/KitHeader/KitHeader";
import { useGetAllInventoryAlerts } from "../../../../../kit/hooks/data/inventoryManagement";
import { useEffect, useMemo, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { priceFormat } from "../../../../../kit/utils/priceFormat";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import { useGetAllBrandsWithId } from "../../../../../kit/hooks/data/brand";
import KitSelect from "../../../../../kit/components/KitSelect";
import { useGetAllVendors } from "../../../../../kit/hooks/data/vendors";
import { useGetAllPurchaseOrders } from "../../../../../kit/hooks/data/purchaseOrder";
import { format, isValid, startOfDay } from "date-fns";
import { exportToPdf } from "../../../../../kit/utils/pdfExport";
import { toast } from "react-toastify";
import { purchaseOrderStatus } from "../../../../../kit/utils/status";
import KitShow from "../../../../../kit/components/KitShow/KitShow";
import KitButton from "../../../../../kit/components/KitButton/KitButton";

export default function POStatusReport() {
    const itemCodeRef = useRef(null);
    const productRef = useRef(null);
    const groupNameRef = useRef(null);
    const brandRef = useRef(null);
    const vendorRef = useRef(null);
    const refreshRef = useRef(null);
    const downloadRef = useRef(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [itemName, setItemName] = useState("");
    const [itemCode, setItemCode] = useState("");
    const [brandName, setBrandName] = useState([]);
    const [vendorName, setVendorName] = useState("");
    const [rowSelectionModel, setRowSelectionModel] = useState({
        type: "include",
        ids: new Set(),
    });
    const [selectedItems, setSelectedItems] = useState([]);
    const [activeRowIndex, setActiveRowIndex] = useState(0);

    const { purchaseOrderList, isPurchaseOrderListLoading, purchaseOrderListError, refreshPurchaseOrderList } =
        useGetAllPurchaseOrders({
            ...(search && { search: search }),
            ...(itemName.trim() && { itemName: itemName.trim() }),
            ...(itemCode.trim() && { itemCode: itemCode.trim() }),
            ...(brandName.length > 0 && { brandId: brandName.join(",") }),
            ...(vendorName && { vendorId: vendorName }),
            page,
            limit: pageSize,
        });
    const { bandsWithId, isBandsWithIdLoading } = useGetAllBrandsWithId();
    const { vendors, isVendorsLoading } = useGetAllVendors({ page: 1, limit: 1000 });

    const dataRows = purchaseOrderList?.data ?? [];

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
                value: vendor.id || "",
            })) || [],
        [vendors]
    );

    const columns = [
        {
            field: "poNumber",
            headerName: "PO Number",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => <Typography variant="body2">{params.row.poNumber ?? "-"}</Typography>,
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
            field: "businessName",
            headerName: "Vendor Name",
            minWidth: 200,
            flex: 1,
            renderCell: (params) => {
                const row = params.row;

                const vendorName =
                    row.vendor?.businessName ||
                    row.vendorName ||
                    row.vendorBusinessName ||
                    (row.vendorId ? `Vendor #${row.vendorId}` : "Vendor not assigned");

                return (
                    <Typography className="truncate text-sm!" title={vendorName}>
                        {vendorName}
                    </Typography>
                );
            },
        },
        {
            field: "status",
            headerName: "Status",
            minWidth: 200,
            flex: 1,
            renderCell: (params) => {
                const row = params.row;

                if (!row.poValidTillDate) {
                    return <Typography variant="body2">-</Typography>;
                }

                const validDate = new Date(row.poValidTillDate);
                const today = startOfDay(new Date());

                if (!isValid(validDate)) {
                    return <Typography variant="body2">-</Typography>;
                }

                const lastPurchaseDate = row.lastPurchaseDate ? new Date(row.lastPurchaseDate) : null;
                const hasLastPurchaseDate = lastPurchaseDate && isValid(lastPurchaseDate);
                const adjustment = Number(row.Adjustment);
                const finalQuantity = Number(row.finalPOQuantity);

                let label = "";
                let className = "";

                if (validDate >= today && row.Adjustment == null && row.lastPurchaseDate == null) {
                    label = "Pending";
                    className = "bg-yellow-200! text-yellow-700!";
                } else if (
                    hasLastPurchaseDate &&
                    validDate >= lastPurchaseDate &&
                    row.Adjustment != null &&
                    adjustment < finalQuantity
                ) {
                    label = "Partially Fulfilled";
                    className = "bg-blue-200! text-blue-700!";
                } else if (
                    validDate >= (hasLastPurchaseDate ? lastPurchaseDate : new Date(0)) &&
                    adjustment >= finalQuantity
                ) {
                    label = "Fully fulfilled";
                    className = "bg-green-200! text-green-700!";
                } else if (hasLastPurchaseDate && validDate < lastPurchaseDate && adjustment === finalQuantity) {
                    label = "Fulfilled Post Validity";
                    className = "bg-pink-200! text-pink-700!";
                } else if (
                    validDate < (hasLastPurchaseDate ? lastPurchaseDate : today) &&
                    (row.Adjustment == null || adjustment !== finalQuantity)
                ) {
                    label = "Unfulfilled";
                    className = "bg-red-200! text-red-700!";
                }

                return label ? (
                    <Chip size="small" label={label} className={className} />
                ) : (
                    <Typography variant="body2">-</Typography>
                );
            },
        },
        {
            field: "packSize",
            headerName: "Pack Size",
            minWidth: 120,
            flex: 0.7,
            renderCell: (params) => <Typography variant="body2">{params.row.packSize ?? 0}</Typography>,
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
            field: "storeId",
            headerName: "Store ID",
            minWidth: 110,
            flex: 0.7,
            renderCell: (params) => <Typography variant="body2">{params.row.storeId ?? 0}</Typography>,
        },
        {
            field: "createdAt",
            headerName: "Generated Date",
            minWidth: 150,
            flex: 0.8,
            renderCell: (params) => (
                <Typography variant="body2">
                    {params.row.createdAt ? format(new Date(params.row.createdAt), "dd/mm/yyyy") : "-"}
                </Typography>
            ),
        },
        {
            field: "poValidTillDate",
            headerName: "Valid Date",
            minWidth: 130,
            flex: 0.8,
            renderCell: (params) => (
                <Typography variant="body2">
                    {params.row.poValidTillDate ? format(new Date(params.row.poValidTillDate), "dd/mm/yyyy") : "-"}
                </Typography>
            ),
        },
        {
            field: "finalPOQuantity",
            headerName: "Quantity",
            minWidth: 120,
            flex: 0.7,
            renderCell: (params) => <Typography variant="body2">{params.row.finalPOQuantity ?? 0}</Typography>,
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            e.preventDefault();

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

                case "d":
                    downloadRef.current?.click();
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
    }, [page, pageSize, search, itemName, itemCode, brandName, vendorName]);

    useEffect(() => {
        if (!dataRows.length) {
            setActiveRowIndex(0);
            return;
        }

        setActiveRowIndex((prev) => Math.min(prev, dataRows.length - 1));
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

                    if (ids.has(row.id)) {
                        ids.delete(row.id);
                    } else {
                        ids.add(row.id);
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

    const getStatusRowClass = (row) => {
        if (!row.poValidTillDate) return "";

        const validDate = new Date(row.poValidTillDate);
        if (Number.isNaN(validDate.getTime())) return "";

        validDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastPurchaseDate = row.lastPurchaseDate ? new Date(row.lastPurchaseDate) : null;

        if (lastPurchaseDate && Number.isNaN(lastPurchaseDate.getTime())) {
            return "";
        }

        if (lastPurchaseDate) {
            lastPurchaseDate.setHours(0, 0, 0, 0);
        }

        const adjustment = row.Adjustment;
        const finalQty = Number(row.finalPOQuantity);
        const referenceDate = lastPurchaseDate ?? today;

        if (validDate >= today && adjustment == null && row.lastPurchaseDate == null) {
            return "status-pending";
        }

        if (lastPurchaseDate && validDate >= lastPurchaseDate && adjustment != null && Number(adjustment) < finalQty) {
            return "status-partial";
        }

        if (validDate >= (lastPurchaseDate ?? new Date(0)) && Number(adjustment) >= finalQty) {
            return "status-fulfilled";
        }

        if (lastPurchaseDate && validDate < lastPurchaseDate && Number(adjustment) === finalQty) {
            return "status-post-validity";
        }

        if (validDate < referenceDate && (adjustment == null || Number(adjustment) !== finalQty)) {
            return "status-unfulfilled";
        }

        return "";
    };

    const handleSelectionChange = (selection) => {
        const currentRows = purchaseOrderList?.data ?? [];
        const currentPageIds = new Set(currentRows.map((row) => row.id));

        setRowSelectionModel(selection);
        setSelectedItems((previousItems) => [
            ...previousItems.filter((item) => !currentPageIds.has(item.id)),
            ...currentRows.filter((row) => selection.ids.has(row.id)),
        ]);
    };

    const handleDownloadPdf = async () => {
        if (!selectedItems.length) return;
        try {
            const dataWithStatus = selectedItems.map((item) => {
                return {
                    ...item,
                    vendorBusinessName: item.vendor?.businessName || "",
                    generateDate: item?.createdAt ? format(new Date(item.createdAt), "dd/mm/yyyy") : "-",
                    validTillDate: item?.poValidTillDate ? format(new Date(item.poValidTillDate), "dd/mm/yyyy") : "-",
                    status: purchaseOrderStatus(item),
                };
            });

            exportToPdf({
                headers: [
                    { header: "PO Number", dataKey: "poNumber" },
                    { header: "Item Name", dataKey: "itemName" },
                    { header: "Vendor", dataKey: "vendorBusinessName" },
                    { header: "Status", dataKey: "status" },
                    { header: "Pack Size", dataKey: "packSize" },
                    { header: "Sale Price", dataKey: "price" },
                    { header: "Generated Date", dataKey: "generateDate" },
                    { header: "Valid Date", dataKey: "validTillDate" },
                    { header: "Quantity", dataKey: "finalPOQuantity" },
                ],
                data: dataWithStatus ?? [],
                fileName: `StatusReport_${format(new Date(), "yyyy-MM-dd_HH-mm-ss")}.pdf`,
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
            <Divider className="mb-3!" />
            <div className="flex flex-col gap-3 w-full min-w-0">
                <KitHeader
                    title="PO Status Report"
                    subtitle="Track purchase orders, payment status, and fulfillment details"
                    icon="tabler:file-invoice"
                    count={purchaseOrderList?.meta?.totalItems ?? 0}
                    countLabel="records"
                />

                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-7">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + I" className="top-0" />
                            <KitTextField
                                inputRef={productRef}
                                size="small"
                                height="32px"
                                label="PO ID"
                                placeholderFontSize={14}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="PO ID"
                                className="w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + P" className="top-0" />
                            <KitTextField
                                inputRef={itemCodeRef}
                                size="small"
                                height="32px"
                                label="Product Name"
                                placeholderFontSize={14}
                                value={itemName}
                                onChange={(e) => setItemName(e.target.value)}
                                placeholder="Product Name"
                                className="w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + C" className="top-0" />
                            <KitTextField
                                inputRef={groupNameRef}
                                size="small"
                                height="32px"
                                label="Product Code"
                                placeholderFontSize={14}
                                value={itemCode}
                                onChange={(e) => setItemCode(e.target.value)}
                                placeholder="Product Code"
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
                                isClearable
                                value={
                                    vendoreOptions.find((option) => String(option.value) === String(vendorName)) ?? ""
                                }
                                onChange={(option) => setVendorName(option?.value ?? "")}
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
                            <IconButton
                                ref={refreshRef}
                                onClick={() => refreshPurchaseOrderList()}
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                <KitDataGrid
                    columns={columns}
                    rows={purchaseOrderList?.data ?? []}
                    getRowId={(row) => row.id}
                    rowCount={purchaseOrderList?.meta?.totalItems}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    isLoading={isPurchaseOrderListLoading}
                    error={!!purchaseOrderListError}
                    getRowClassName={(params) => {
                        const statusClass = getStatusRowClass(params.row);
                        const activeClass = dataRows[activeRowIndex]?.id === params.id ? "keyboard-active-row" : "";

                        return `${statusClass} ${activeClass}`.trim();
                    }}
                    sx={(theme) => ({
                        "& .status-pending": {
                            backgroundColor: "#FEF3C7",
                        },
                        "& .status-partial": {
                            backgroundColor: "#DBEAFE",
                        },
                        "& .status-fulfilled": {
                            backgroundColor: "#DCFCE7",
                        },
                        "& .status-post-validity": {
                            backgroundColor: "#FCE7F3",
                        },
                        "& .status-unfulfilled": {
                            backgroundColor: "#FEE2E2",
                        },
                        "& .MuiDataGrid-row:hover": {
                            filter: "brightness(0.97)",
                        },
                        "& .MuiDataGrid-row.Mui-selected": {
                            backgroundColor: `${theme.palette.action.selected} !important`,
                        },
                    })}
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
