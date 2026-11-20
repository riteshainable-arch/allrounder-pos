import { Divider, FormControlLabel, Grid, IconButton, Paper, Switch, Typography } from "@mui/material";
import KitHeader from "../../../../../kit/components/KitHeader/KitHeader";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { priceFormat } from "../../../../../kit/utils/priceFormat";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import KitSelect from "../../../../../kit/components/KitSelect";
import { useGetAllVendors } from "../../../../../kit/hooks/data/vendors";
import { format, isValid } from "date-fns";
import { useGetAllPOSummaryList } from "../../../../../kit/hooks/data/poSummary";
import {
    getPoSummaryStatusBadgeClass,
    getPoSummaryStatusLabel,
    getPoSummaryStatusRowClass,
    normalizePoSummaryStatus,
    poSummaryStatusRowSx,
    poSummaryStatusTextColor,
} from "../../../../../kit/utils/poSummaryStatusStyles";
import { useGetAllStoreList } from "../../../../../kit/hooks/data/store";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import POSummaryDetailsModal from "../../../components/POSummary/POSummaryDetailsModal";
import KitShow from "../../../../../kit/components/KitShow/KitShow";

export default function POSummaryReport({ divider = true }) {
    const poNumberRef = useRef(null);
    const poNumberExactRef = useRef(null);
    const statusRef = useRef(null);
    const storeRef = useRef(null);
    const vendorRef = useRef(null);
    const refreshRef = useRef(null);
    const createdDateRef = useRef(null);
    const createdFromRef = useRef(null);
    const createdToRef = useRef(null);
    const validTillFromRef = useRef(null);
    const validTillToRef = useRef(null);
    const vendorUnassignedRef = useRef(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [poNumber, setPoNumber] = useState("");
    const [status, setStatus] = useState("");
    const [storeId, setStoreId] = useState([]);
    const [vendorId, setVendorId] = useState("");
    const [createdDate, setCreatedDate] = useState("");
    const [createdFrom, setCreatedFrom] = useState("");
    const [createdTo, setCreatedTo] = useState("");
    const [validTillFrom, setValidTillFrom] = useState("");
    const [validTillTo, setValidTillTo] = useState("");
    const [vendorUnassigned, setVendorUnassigned] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [seletedPONumber, setSeletedPONumber] = useState("");
    const [activeRowIndex, setActiveRowIndex] = useState(0);

    const { POSummaryList, isPOSummaryListLoading, POSummaryListError, refreshPOSummaryList } = useGetAllPOSummaryList({
        ...(search.trim() && { search: search.trim() }),
        ...(poNumber && { poNumber: poNumber }),
        ...(vendorId.length > 0 && { vendorId: vendorId.join(",") }),
        ...(vendorUnassigned && { vendorUnassigned: vendorUnassigned }),
        ...(storeId.length > 0 && { storeId: storeId.join(",") }),
        ...(status && { status: status }),
        ...(createdDate && { createdDate: createdDate }),
        ...(createdFrom && { createdFrom: createdFrom }),
        ...(createdTo && { createdTo: createdTo }),
        ...(validTillFrom && { validTillFrom: validTillFrom }),
        ...(validTillTo && { validTillTo: validTillTo }),
        page,
        limit: pageSize,
    });
    const { storeList, isStoreListLoading } = useGetAllStoreList();
    const { vendors, isVendorsLoading } = useGetAllVendors({ page: 1, limit: 1000 });

    const dataRows = POSummaryList?.data ?? [];

    const statusOptions = [
        { label: "Pending", value: "pending" },
        { label: "Partial", value: "partial" },
        { label: "Fulfilled", value: "fulfilled" },
        { label: "Cancelled", value: "cancelled" },
    ];

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

    const toggleDetailsModal = () => setIsDetailsModalOpen(!isDetailsModalOpen);

    const handleViewDetail = useCallback((data) => {
        setSeletedPONumber(data.poNumber);
        toggleDetailsModal();
    }, []);

    const columns = [
        {
            field: "poNumber",
            headerName: "PO Number",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => <Typography variant="body2">{params.row.poNumber ?? "-"}</Typography>,
        },
        {
            field: "storeName",
            headerName: "Store Name",
            minWidth: 200,
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
            minWidth: 200,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" className="truncate" title={params.row.vendorName ?? ""}>
                    {params.row.vendorName ?? "-"}
                </Typography>
            ),
        },
        {
            field: "status",
            headerName: "Status",
            minWidth: 140,
            flex: 0.8,
            renderCell: (params) => {
                const status = normalizePoSummaryStatus(params.row.status);

                return (
                    <span
                        style={{ color: poSummaryStatusTextColor[status] }}
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getPoSummaryStatusBadgeClass(
                            params.row.status
                        )}`}
                    >
                        {getPoSummaryStatusLabel(params.row.status)}
                    </span>
                );
            },
        },
        {
            field: "fulfilledItemCount",
            headerName: "Fulfilled Item Count",
            minWidth: 170,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={500}>
                    {params.row.fulfilledItemCount ?? 0}
                </Typography>
            ),
        },
        {
            field: "cancelledItemCount",
            headerName: "Cancelled Item Count",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={500}>
                    {params.row.cancelledItemCount ?? 0}
                </Typography>
            ),
        },
        {
            field: "totalQuantity",
            headerName: "Total Quantity",
            minWidth: 140,
            flex: 0.8,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={500}>
                    {params.row.totalQuantity ?? 0}
                </Typography>
            ),
        },
        {
            field: "totalValue",
            headerName: "Total Value",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={500}>
                    {priceFormat(params.row.totalValue ?? 0)}
                </Typography>
            ),
        },
        {
            field: "poValidTillDate",
            headerName: "PO Valid Till Date",
            minWidth: 160,
            flex: 0.9,
            renderCell: (params) => {
                const date = params.row.poValidTillDate;
                if (!date) {
                    return <Typography variant="body2">-</Typography>;
                }
                const parsedDate = new Date(date);

                return (
                    <Typography variant="body2">
                        {isValid(parsedDate) ? format(parsedDate, "dd/MM/yyyy") : "-"}
                    </Typography>
                );
            },
        },
        {
            field: "actions",
            headerName: "Action",
            minWidth: 120,
            renderHeader: () => (
                <div className="flex flex-col gap-1 text-start">
                    <span>Actions</span>
                </div>
            ),
            renderCell: (params) => (
                <KitButton
                    size="small"
                    variant="outlined"
                    className="w-auto!"
                    onClick={() => handleViewDetail(params.row)}
                >
                    View
                </KitButton>
            ),
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;
            e.preventDefault();

            switch (e.key.toLowerCase()) {
                case "n":
                    e.preventDefault();
                    poNumberRef.current?.focus();
                    break;

                case "p":
                    e.preventDefault();
                    poNumberExactRef.current?.focus();
                    break;

                case "a":
                    e.preventDefault();
                    statusRef.current?.focus();
                    break;

                case "s":
                    e.preventDefault();
                    storeRef.current?.focus();
                    break;

                case "v":
                    e.preventDefault();
                    vendorRef.current?.focus();
                    break;

                case "d":
                    e.preventDefault();
                    createdDateRef.current?.focus();
                    break;

                case "f":
                    e.preventDefault();
                    createdFromRef.current?.focus();
                    break;

                case "t":
                    e.preventDefault();
                    createdToRef.current?.focus();
                    break;

                case "j":
                    e.preventDefault();
                    validTillFromRef.current?.focus();
                    break;

                case "k":
                    e.preventDefault();
                    validTillToRef.current?.focus();
                    break;

                case "u":
                    e.preventDefault();
                    setVendorUnassigned((prev) => !prev);
                    break;

                case "r":
                    e.preventDefault();
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
                    handleViewDetail(row);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [dataRows, activeRowIndex, handleViewDetail]);

    useEffect(() => {
        setActiveRowIndex(0);
    }, [
        page,
        pageSize,
        search,
        poNumber,
        status,
        storeId,
        vendorId,
        createdDate,
        createdFrom,
        createdTo,
        validTillFrom,
        validTillTo,
        vendorUnassigned,
    ]);

    const summaryCards = [
        {
            title: "Total POs",
            value: POSummaryList?.summary?.totalPOs ?? 0,
            color: "secondary",
            icon: "tabler:clipboard-list",
        },
        {
            title: "Total Items",
            value: POSummaryList?.summary?.totalItems ?? 0,
            color: "info",
            icon: "tabler:package",
        },
        {
            title: "Total Quantity",
            value: POSummaryList?.summary?.totalQuantity ?? 0,
            color: "primary",
            icon: "tabler:packages",
        },
        {
            title: "Total Value",
            value: priceFormat(POSummaryList?.summary?.totalValue ?? 0),
            color: "success",
            icon: "tabler:currency-rupee",
        },
        {
            title: "Pending",
            value: POSummaryList?.summary?.statusBreakdown?.pending ?? 0,
            color: "warning",
            icon: "tabler:clock-hour-4",
        },
        {
            title: "Partial",
            value: POSummaryList?.summary?.statusBreakdown?.partial ?? 0,
            color: "error",
            icon: "tabler:circle-half-2",
        },
        {
            title: "Fulfilled",
            value: POSummaryList?.summary?.statusBreakdown?.fulfilled ?? 0,
            color: "success",
            icon: "tabler:circle-check",
        },
        {
            title: "Cancelled",
            value: POSummaryList?.summary?.statusBreakdown?.cancelled ?? 0,
            color: "error",
            icon: "tabler:circle-x",
        },
    ];

    return (
        <div>
            {divider && <Divider className="mb-3!" />}
            <div className="flex flex-col gap-3 w-full min-w-0">
                <KitHeader
                    title="PO Summary Report"
                    subtitle="Track purchase order status, quantities, values, and fulfillment"
                    icon="tabler:file-invoice"
                    count={POSummaryList?.meta?.totalItems ?? 0}
                    countLabel="records"
                />

                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                    <div className="grid grid-cols-2 items-end gap-x-2 gap-y-3 md:flex md:flex-wrap md:gap-y-7">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + N" className="top-0 hidden md:block" />
                            <KitTextField
                                inputRef={poNumberRef}
                                size="small"
                                height="32px"
                                label="Search PO Number"
                                placeholderFontSize={14}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search PO Number"
                                className="w-full md:w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + P" className="top-0 hidden md:block" />
                            <KitTextField
                                inputRef={poNumberExactRef}
                                size="small"
                                height="32px"
                                label="PO Number (Exact)"
                                placeholderFontSize={14}
                                value={poNumber}
                                onChange={(e) => setPoNumber(e.target.value)}
                                placeholder="PO Number"
                                className="w-full md:w-44"
                            />
                        </div>
                        <div className="relative w-full min-w-0 md:w-60">
                            <ShortcutBadge shortcut="Alt + A" className="top-0 hidden md:block" />
                            <KitSelect
                                ref={statusRef}
                                label="Status"
                                placeholder="Select Status"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={statusOptions}
                                isDisabled={false}
                                isClearable
                                value={statusOptions.find((option) => String(option.value) === String(status)) ?? ""}
                                onChange={(option) => setStatus(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative w-full min-w-0 md:w-60">
                            <ShortcutBadge shortcut="Alt + S" className="top-0 hidden md:block" />
                            <KitSelect
                                ref={storeRef}
                                label="Store"
                                placeholder="Select Stores"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={storeOptions}
                                isDisabled={isStoreListLoading}
                                isMulti
                                closeMenuOnSelect={false}
                                value={storeOptions.filter((option) => storeId.includes(option.value))}
                                onChange={(selected) => {
                                    setStoreId(
                                        Array.isArray(selected) ? selected.map((option) => String(option.value)) : []
                                    );
                                }}
                            />
                        </div>
                        <div className="relative w-full min-w-0 md:w-60">
                            <ShortcutBadge shortcut="Alt + V" className="top-0 hidden md:block" />
                            <KitSelect
                                ref={vendorRef}
                                label="Vendor Name"
                                placeholder="Vendor Names"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={vendoreOptions}
                                isDisabled={isVendorsLoading}
                                isMulti
                                closeMenuOnSelect={false}
                                value={vendoreOptions.filter((option) => vendorId.includes(option.value))}
                                onChange={(selected) => {
                                    setVendorId(
                                        Array.isArray(selected) ? selected.map((option) => String(option.value)) : []
                                    );
                                }}
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + D" className="top-0 hidden md:block" />
                            <KitTextField
                                ref={createdDateRef}
                                size="small"
                                type="date"
                                label="Created Date"
                                value={createdDate}
                                onChange={(e) => setCreatedDate(e.target.value)}
                                slotProps={{
                                    htmlInput: {
                                        max: format(new Date(), "yyyy-MM-dd"),
                                    },
                                }}
                                className="w-full md:w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + F" className="top-0 hidden md:block" />
                            <KitTextField
                                ref={createdFromRef}
                                size="small"
                                type="date"
                                label="Created From"
                                value={createdFrom}
                                onChange={(e) => setCreatedFrom(e.target.value)}
                                className="w-full md:w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + T" className="top-0 hidden md:block" />
                            <KitTextField
                                ref={createdToRef}
                                size="small"
                                type="date"
                                label="Created To"
                                value={createdTo}
                                onChange={(e) => setCreatedTo(e.target.value)}
                                className="w-full md:w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + J" className="top-0 hidden md:block" />
                            <KitTextField
                                ref={validTillFromRef}
                                size="small"
                                type="date"
                                label="Valid Till From"
                                value={validTillFrom}
                                onChange={(e) => setValidTillFrom(e.target.value)}
                                className="w-full md:w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + K" className="top-0 hidden md:block" />
                            <KitTextField
                                ref={validTillToRef}
                                size="small"
                                type="date"
                                label="Valid Till To"
                                value={validTillTo}
                                onChange={(e) => setValidTillTo(e.target.value)}
                                className="w-full md:w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + U" className="-top-6! hidden md:block" />
                            <FormControlLabel
                                sx={{
                                    "& .MuiFormControlLabel-label": {
                                        fontSize: { xs: "13px", md: "0.875rem" },
                                    },
                                }}
                                control={
                                    <Switch
                                        inputRef={vendorUnassignedRef}
                                        size="small"
                                        checked={vendorUnassigned}
                                        onChange={(e) => setVendorUnassigned(e.target.checked)}
                                    />
                                }
                                label="Vendor unassigned"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5! hidden md:block" />
                            <IconButton
                                ref={refreshRef}
                                onClick={() => refreshPOSummaryList()}
                                className="w-full md:w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                <Grid container spacing={{ xs: 1, md: 2 }}>
                    {summaryCards.map((card) => (
                        <Grid size={{ xs: 6, sm: 6, md: 3, lg: 3 }} key={card.title}>
                            <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl h-full">
                                <div className="flex items-center gap-2 mb-1">
                                    <KitIcon icon={card.icon} className="text-primary text-xl!" />
                                    <Typography className="text-lg! font-bold!">{card.value}</Typography>
                                </div>
                                <Typography className="text-sm! text-third-500">{card.title}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                <KitDataGrid
                    columns={columns}
                    rows={POSummaryList?.data ?? []}
                    getRowId={(row) => row.poNumber}
                    rowCount={POSummaryList?.meta?.totalItems}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    isLoading={isPOSummaryListLoading}
                    error={!!POSummaryListError}
                    disableRowSelectionOnClick
                    getRowClassName={(params) =>
                        [
                            getPoSummaryStatusRowClass(params.row.status),
                            dataRows[activeRowIndex]?.poNumber === params.row.poNumber ? "keyboard-active-row" : "",
                        ]
                            .filter(Boolean)
                            .join(" ")
                    }
                    sx={(theme) => ({
                        ...poSummaryStatusRowSx,

                        "& .keyboard-active-row": {
                            outline: "2px solid #FACC15",
                            outlineOffset: "-2px",
                        },

                        "& .keyboard-active-row:hover": {
                            outline: "2px solid #FACC15",
                            outlineOffset: "-2px",
                        },

                        "& .MuiDataGrid-row.Mui-selected": {
                            backgroundColor: `${theme.palette.action.selected} !important`,
                        },
                    })}
                />
            </div>

            <KitShow show={isDetailsModalOpen}>
                <POSummaryDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={toggleDetailsModal}
                    seletedPONumber={seletedPONumber}
                />
            </KitShow>
        </div>
    );
}
