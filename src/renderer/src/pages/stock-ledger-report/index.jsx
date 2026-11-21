import { Chip, Divider, IconButton, Paper, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { format, subDays } from "date-fns";
import KitHeader from "../../../../kit/components/KitHeader/KitHeader";
import ShortcutBadge from "../../components/Dashboard/ShortcutBadge";
import KitDataGrid from "../../../../kit/components/KitDataGrid/KitDataGrid";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import KitSelect from "../../../../kit/components/KitSelect";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { useGetAllStoreList } from "../../../../kit/hooks/data/store";
import { useGetAllStockLedgerReport, useMovementTypes } from "../../../../kit/hooks/data/stockLedger";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import { downloadCSV, flattenNestedObjects } from "../../../../kit/utils/downloadCSV";

export default function StockLedgerReport() {
    const itemCodeRef = useRef(null);
    const storeRef = useRef(null);
    const movementTypeRef = useRef(null);
    const directionRef = useRef(null);
    const moduleRef = useRef(null);
    const referenceDocumentRef = useRef(null);
    const fromDateRef = useRef(null);
    const toDateRef = useRef(null);
    const refreshRef = useRef(null);
    const exportRef = useRef(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [itemCode, setItemCode] = useState("");
    const [storeId, setStoreId] = useState("");
    const [movementType, setMovementType] = useState("");
    const [movementDirection, setMovementDirection] = useState("");
    const [referenceModule, setReferenceModule] = useState("");
    const [referenceDocumentId, setReferenceDocumentId] = useState("");
    const [fromDate, setFromDate] = useState(() => format(subDays(new Date(), 30), "yyyy-MM-dd"));
    const [toDate, setToDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
    const [exportPageSize, setExportPageSize] = useState(null);
    const [exportProductLoading, setExportProductLoading] = useState(false);

    const { ledgerList, isLedgerLoading, ledgerError, refreshLedger } = useGetAllStockLedgerReport({
        page,
        size: exportPageSize ?? pageSize,
        ...(itemCode.trim() && { itemCode: itemCode.trim() }),
        ...(storeId && { storeId: storeId }),
        ...(movementType && { movementType: movementType }),
        ...(movementDirection && { movementDirection: movementDirection }),
        ...(referenceModule && { referenceModule: referenceModule }),
        ...(referenceDocumentId && { referenceDocumentId: referenceDocumentId }),
        ...(fromDate && { fromDate: fromDate }),
        ...(toDate && { toDate: toDate }),
    });
    const { movementTypes, isMovementTypesLoading } = useMovementTypes();
    const { storeList, isStoreListLoading } = useGetAllStoreList();

    const storeOptions = useMemo(
        () =>
            storeList?.data?.stores?.map((store) => ({
                label: store.storeName || "",
                value: String(store.id),
            })) || [],
        [storeList]
    );

    const movementTypeOptions = useMemo(
        () =>
            [...(movementTypes?.stockIn ?? []), ...(movementTypes?.stockOut ?? [])].map((movementType) => ({
                label: movementType.label || "",
                value: String(movementType.code),
            })),
        [movementTypes]
    );

    const directionOptions = [
        { label: "IN", value: "IN" },
        { label: "OUT", value: "OUT" },
    ];

    const moduleOptions = useMemo(
        () =>
            movementTypes?.referenceModules?.map((module) => ({
                label: module.replace(/_/g, " "),
                value: module,
            })) ?? [],
        [movementTypes]
    );

    const columns = [
        {
            field: "transactionDate",
            headerName: "Date & Time",
            minWidth: 150,
            flex: 0.8,
            renderCell: (params) => (
                <Typography variant="body2">
                    {params.row.transactionDate && params.row.transactionTime
                        ? format(
                              new Date(`${params.row.transactionDate}T${params.row.transactionTime}`),
                              "dd-MM-yyyy hh:mm a"
                          )
                        : "-"}
                </Typography>
            ),
        },
        {
            field: "itemCode",
            headerName: "Item",
            minWidth: 180,
            flex: 1.2,
            renderCell: (params) => (
                <div className="min-w-0">
                    <Typography variant="body2" className="text-start" fontWeight={500}>
                        {params.row.itemCode ?? "-"}
                    </Typography>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        className="truncate block"
                        title={params.row.product?.itemName ?? ""}
                    >
                        {params.row.product?.itemName ?? "-"}
                    </Typography>
                </div>
            ),
        },
        {
            field: "store",
            headerName: "Store",
            minWidth: 200,
            flex: 1.2,
            renderCell: (params) => (
                <Typography variant="body2" className="truncate" title={params.row.store?.storeName ?? ""}>
                    {params.row.store?.storeName ?? "-"}
                </Typography>
            ),
        },
        {
            field: "movementType",
            headerName: "Movement",
            minWidth: 200,
            flex: 1.2,
            renderCell: (params) => {
                const code = params.row.movementType;
                const movement = [...(movementTypes?.stockIn ?? []), ...(movementTypes?.stockOut ?? [])].find(
                    (item) => item.code === code
                );

                return <Typography variant="body2">{movement?.label ?? code ?? "-"}</Typography>;
            },
        },
        {
            field: "movementDirection",
            headerName: "Direction",
            minWidth: 110,
            renderCell: (params) => {
                const direction = params.row.movementDirection;
                const isIn = direction === "IN";

                return (
                    <Chip
                        size="small"
                        label={direction ?? "-"}
                        sx={{
                            backgroundColor: isIn ? "#DCFCE7" : "#FEE2E2",
                            color: isIn ? "#166534" : "#991B1B",
                        }}
                    />
                );
            },
        },
        {
            field: "qtyIn",
            headerName: "Qty In",
            minWidth: 100,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <Typography variant="body2" className="text-green-600!">
                    {params.row.qtyIn ?? 0}
                </Typography>
            ),
        },
        {
            field: "qtyOut",
            headerName: "Qty Out",
            minWidth: 100,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <Typography variant="body2" className="text-red-600!">
                    {params.row.qtyOut ?? 0}
                </Typography>
            ),
        },
        {
            field: "openingBalance",
            headerName: "Opening",
            minWidth: 110,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{params.row.openingBalance ?? 0}</Typography>,
        },
        {
            field: "closingBalance",
            headerName: "Closing",
            minWidth: 110,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={600}>
                    {params.row.closingBalance ?? 0}
                </Typography>
            ),
        },
        {
            field: "unitCost",
            headerName: "Unit Cost",
            minWidth: 120,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{priceFormat(params.row.unitCost ?? 0)}</Typography>,
        },
        {
            field: "totalValue",
            headerName: "Total Value",
            minWidth: 130,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{priceFormat(params.row.totalValue ?? 0)}</Typography>,
        },
        {
            field: "reference",
            headerName: "Reference",
            minWidth: 170,
            flex: 1,
            renderCell: (params) => {
                const { referenceModule, referenceDocumentId } = params.row;

                return (
                    <Typography variant="body2">
                        {referenceModule || referenceDocumentId
                            ? `${referenceModule ?? "-"}${referenceDocumentId ? ` #${referenceDocumentId}` : ""}`
                            : "-"}
                    </Typography>
                );
            },
        },
        {
            field: "createdBy",
            headerName: "Created By",
            minWidth: 130,
            flex: 0.8,
            renderCell: (params) => <Typography variant="body2">{params.row.createdBy?.firstName ?? "-"}</Typography>,
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case "i":
                        e.preventDefault();
                        itemCodeRef.current?.focus();
                        break;

                    case "s":
                        e.preventDefault();
                        storeRef.current?.focus();
                        break;

                    case "t":
                        e.preventDefault();
                        movementTypeRef.current?.focus();
                        break;

                    case "d":
                        e.preventDefault();
                        directionRef.current?.focus();
                        break;

                    case "u":
                        e.preventDefault();
                        moduleRef.current?.focus();
                        break;

                    case "a":
                        e.preventDefault();
                        referenceDocumentRef.current?.focus();
                        break;

                    case "f":
                        e.preventDefault();
                        fromDateRef.current?.focus();
                        break;

                    case "e":
                        e.preventDefault();
                        toDateRef.current?.focus();
                        break;

                    case "r":
                        e.preventDefault();
                        refreshRef.current?.click();
                        break;

                    default:
                        break;
                }
            }

            if (e.shiftKey && e.key.toLowerCase() === "c") {
                e.preventDefault();
                exportRef.current?.click();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const EXPORT_HEADER_MAP = {
        transactionDate: "transactionDate",
        transactionTime: "transactionTime",
        itemCode: "itemCode",
        "product.itemName": "itemName",
        "store.storeName": "storeName",
        movementType: "movementType",
        movementDirection: "movementDirection",
        qtyIn: "qtyIn",
        qtyOut: "qtyOut",
        openingBalance: "openingBalance",
        closingBalance: "closingBalance",
        unitCost: "unitCost",
        totalValue: "totalValue",
        reference: "reference",
        "createdBy.firstName": "createdBy",
    };

    const EXPORT_HEADERS = Object.values(EXPORT_HEADER_MAP);

    const handleExport = async () => {
        const totalItems = ledgerList?.data?.totalItems;
        if (!totalItems) {
            toast.error("Unable to determine total number of items.");
            return;
        }
        setExportProductLoading(true);
        setExportPageSize(totalItems);
    };

    useEffect(() => {
        if (exportPageSize && ledgerList && ledgerList?.data?.items?.length === exportPageSize) {
            const exportData = ledgerList.data.items.map((entry) => ({
                ...entry,
                reference:
                    entry.referenceModule || entry.referenceDocumentId
                        ? `${entry.referenceModule || "-"}${
                              entry.referenceDocumentId ? ` #${entry.referenceDocumentId}` : ""
                          }`
                        : "-",
            }));
            const rows = flattenNestedObjects(exportData, EXPORT_HEADER_MAP);
            downloadCSV(rows, EXPORT_HEADERS, `all_stock_ledger_export.csv`);
            setExportPageSize(null);
            setExportProductLoading(false);
        }
    }, [exportPageSize, ledgerList]);

    return (
        <div>
            <Divider className="mb-3!" />
            <div className="flex flex-col gap-3 w-full min-w-0">
                <KitHeader
                    title="Stock Ledger Report"
                    subtitle="Read-only inventory movement history. Entries are created automatically when bills, purchases, transfers, and other documents post stock."
                    icon="tabler:file-invoice"
                    count={ledgerList?.data?.totalItems ?? 0}
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
                                placeholder="Item Code"
                                className="w-44"
                            />
                        </div>
                        <div className="relative w-60">
                            <ShortcutBadge shortcut="Alt + S" className="top-0" />
                            <KitSelect
                                ref={storeRef}
                                label="Store Name"
                                placeholder="Select Store Name"
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
                        <div className="relative w-60">
                            <ShortcutBadge shortcut="Alt + T" className="top-0" />
                            <KitSelect
                                ref={movementTypeRef}
                                label="Movement Type"
                                placeholder="Select Movement Type"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={movementTypeOptions}
                                isDisabled={isMovementTypesLoading}
                                isClearable
                                value={
                                    movementTypeOptions.find(
                                        (option) => String(option.value) === String(movementType)
                                    ) ?? ""
                                }
                                onChange={(option) => setMovementType(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative w-60">
                            <ShortcutBadge shortcut="Alt + D" className="top-0" />
                            <KitSelect
                                ref={directionRef}
                                label="Direction"
                                placeholder="Select Direction"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={directionOptions}
                                isDisabled={false}
                                isClearable
                                value={
                                    directionOptions.find(
                                        (option) => String(option.value) === String(movementDirection)
                                    ) ?? ""
                                }
                                onChange={(option) => setMovementDirection(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative w-60">
                            <ShortcutBadge shortcut="Alt + U" className="top-0" />
                            <KitSelect
                                ref={moduleRef}
                                label="Module"
                                placeholder="Select Module"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={moduleOptions}
                                isDisabled={isMovementTypesLoading}
                                isClearable
                                value={
                                    moduleOptions.find((option) => String(option.value) === String(referenceModule)) ??
                                    ""
                                }
                                onChange={(option) => setReferenceModule(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + A" className="top-0" />
                            <KitTextField
                                inputRef={referenceDocumentRef}
                                size="small"
                                height="32px"
                                label="Reference Document"
                                placeholderFontSize={14}
                                value={referenceDocumentId}
                                onChange={(e) => setReferenceDocumentId(e.target.value)}
                                placeholder="Reference Document"
                                className="w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + F" className="top-0" />
                            <KitTextField
                                inputRef={fromDateRef}
                                size="small"
                                type="date"
                                label="From Date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + E" className="top-0" />
                            <KitTextField
                                inputRef={toDateRef}
                                size="small"
                                type="date"
                                label="To Date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Shift + C" className="-top-5!" />
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
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                            <IconButton
                                ref={refreshRef}
                                onClick={() => refreshLedger()}
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                <KitDataGrid
                    columns={columns}
                    rows={ledgerList?.data?.items ?? []}
                    getRowId={(row) => row.id}
                    rowCount={ledgerList?.data?.totalItems}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    isLoading={isLedgerLoading}
                    error={!!ledgerError}
                    disableRowSelectionOnClick
                />
            </div>
        </div>
    );
}
