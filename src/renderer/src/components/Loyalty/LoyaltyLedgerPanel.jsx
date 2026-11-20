import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Backdrop, Chip, CircularProgress, Paper, Typography } from "@mui/material";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitCreatableSelect from "../../../../kit/components/KitCreatableSelect";
import { fetchLoyaltyLedger, useGetLoyaltyBalance, useGetLoyaltyLedger } from "../../../../kit/hooks/data/loyalty";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import KitDataGrid from "../../../../kit/components/KitDataGrid/KitDataGrid";
import ShortcutBadge from "../Dashboard/ShortcutBadge";
import useKeyboardShortcuts from "../../../../kit/hooks/useKeyboardShortcuts";
import { toast } from "react-toastify";
import { downloadCsv, downloadXlsx } from "../../../../kit/utils/exportFile";
import { EXPORT_LIMIT } from "../../../../kit/configs/general";
import KitHeader from "../../../../kit/components/KitHeader/KitHeader";

const formatLedgerDate = (value) => {
    if (!value) return "-";

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return String(value);
    }

    return format(parsed, "dd MMM yyyy, hh:mm a");
};

export default function LoyaltyLedgerPanel({ showBackButton = false }) {
    const navigate = useNavigate();
    const customerNumberRef = useRef(null);

    const [phone, setPhone] = useState("");
    const [searchPhone, setSearchPhone] = useState("");
    const [customerProfiles, setCustomerProfiles] = useState([]);
    const [ledger, setLedger] = useState({ entries: [], pagination: {} });
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isExporting, setIsExporting] = useState(false);

    const queryParams = {
        page: page,
        limit: pageSize,
    };

    const { loyaltyBalance, isLoyaltyBalanceLoading } = useGetLoyaltyBalance(phone, Boolean(phone.length === 10));
    const { loyaltyLedger, isLoyaltyLedgerLoading, loyaltyLedgerError } = useGetLoyaltyLedger(
        phone,
        Boolean(phone.length === 10),
        queryParams
    );

    const loadCustomers = useCallback(async (search = "") => {
        try {
            const result = await window.api.getCustomerProfiles(search);
            setCustomerProfiles(result || []);
        } catch {
            setCustomerProfiles([]);
        }
    }, []);

    useEffect(() => {
        loadCustomers("");
    }, [loadCustomers]);

    const customerOptions = useMemo(
        () =>
            customerProfiles.map((profile) => {
                const customerPhone = profile.customer?.phone || "";
                const name = `${profile.customer?.firstName ?? ""} ${profile.customer?.lastName ?? ""}`.trim();
                return {
                    label: name ? `${name} · ${customerPhone}` : customerPhone,
                    value: customerPhone,
                    name,
                };
            }),
        [customerProfiles]
    );

    const selectedCustomerOption = useMemo(() => {
        if (!phone) return null;
        return (
            customerOptions.find((option) => option.value === phone) ?? {
                label: phone,
                value: phone,
            }
        );
    }, [customerOptions, phone]);

    const columns = [
        {
            field: "date",
            headerName: "Date",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {formatLedgerDate(params?.row?.date || params?.row?.createdAt || params?.row?.transactionDate)}
                </Typography>
            ),
        },
        {
            field: "invoiceNo",
            headerName: "Invoice No",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {params?.row?.invoiceNo || params?.row?.orderNo || params?.row?.referenceNo || "-"}
                </Typography>
            ),
        },
        {
            field: "invoiceValue",
            headerName: "Value ₹",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {priceFormat(params?.row?.invoiceValue ?? params?.row?.value ?? params?.row?.amount ?? 0)}
                </Typography>
            ),
        },
        {
            field: "type",
            headerName: "Type",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Chip size="small" label={params.row.type || params.row.transactionType || "-"} variant="outlined" />
            ),
        },
        {
            field: "earned",
            headerName: "Earned",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => {
                const earned = Number(
                    params?.row?.earnedPoints ?? params?.row?.pointsEarned ?? params?.row?.earned ?? 0
                );
                return (
                    <Typography variant="body1" className="text-sm!">
                        {earned > 0 ? `+${earned}` : "-"}
                    </Typography>
                );
            },
        },
        {
            field: "redeemed",
            headerName: "Redeemed",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => {
                const redeemed = Number(
                    params?.row?.redeemedPoints ?? params?.row?.pointsRedeemed ?? params?.row?.redeemed ?? 0
                );
                return (
                    <Typography variant="body1" className="text-sm!">
                        {redeemed > 0 ? `−${redeemed}` : "-"}
                    </Typography>
                );
            },
        },
        {
            field: "balanceAfter",
            headerName: "Balance After",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {params?.row?.balanceAfter || params?.row?.closingBalance || "-"}
                </Typography>
            ),
        },
    ];

    const getExportParams = () => ({
        page: 1,
        limit: EXPORT_LIMIT,
    });

    const handleExport = async (type) => {
        if (!loyaltyLedger?.data?.entries?.length > 0) {
            toast.warning("No data available to export.");
            return;
        }

        setIsExporting(true);

        try {
            const response = await fetchLoyaltyLedger(phone, getExportParams);
            const bills = response?.data?.entries || [];

            const exportRows = bills.slice(0, EXPORT_LIMIT).map((bill) => ({
                Date: formatLedgerDate(bill.date || bill.createdAt || bill.transactionDate),
                "Invoice No": bill.invoiceNo || bill.orderNo || bill.referenceNo || "-",
                "Value ₹": priceFormat(bill.invoiceValue ?? bill.value ?? bill.amount ?? 0),
                Type: bill.type || bill.transactionType || "-",
                Earned:
                    Number(bill.earnedPoints ?? bill.pointsEarned ?? bill.earned ?? 0) > 0
                        ? `+${Number(bill.earnedPoints ?? bill.pointsEarned ?? bill.earned ?? 0)}`
                        : "-",
                Redeemed:
                    Number(bill.redeemedPoints ?? bill.pointsRedeemed ?? bill.redeemed ?? 0) > 0
                        ? `-${Number(bill.redeemedPoints ?? bill.pointsRedeemed ?? bill.redeemed ?? 0)}`
                        : "-",
                "Balance After": bill.balanceAfter ?? bill.closingBalance ?? "-",
            }));

            if (!exportRows.length) return;

            const timestamp = format(new Date(), "yyyyMMdd_HHmmss");

            if (type === "csv") {
                downloadCsv(exportRows, `loyalty_ledger_${timestamp}.csv`);
            } else {
                downloadXlsx(exportRows, `loyalty_ledger_${timestamp}.xlsx`, "Loyalty Ledger");
            }
        } catch (error) {
            toast.error(error?.message || "Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    useKeyboardShortcuts({
        customerNumberRef,
        handleExportCsv: () => handleExport("csv"),
        handleExportXlsx: () => handleExport("xlsx"),
    });

    return (
        <>
            <Backdrop open={isLoyaltyLedgerLoading || isExporting} sx={{ zIndex: 9999, color: "#fff" }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    <KitHeader
                        title="Loyalty Ledger"
                        subtitle="View loyalty points transactions"
                        icon="tabler:gift"
                        count={loyaltyLedger?.data?.pagination?.totalItems ?? 0}
                        countLabel="records"
                    />
                    {showBackButton && (
                        <KitButton
                            size="small"
                            variant="outlined"
                            className="w-auto"
                            startIcon={<KitIcon icon="tabler:arrow-left" />}
                            onClick={() => navigate("/dashboard")}
                        >
                            POS
                        </KitButton>
                    )}
                </div>

                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl bg-white">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="relative w-full min-w-0 md:w-80">
                            <ShortcutBadge shortcut="Alt + C" className="top-0 hidden md:block" />
                            <KitCreatableSelect
                                ref={customerNumberRef}
                                label="Customer"
                                placeholder="Search by name or phone"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                size="small"
                                isClearable
                                options={customerOptions}
                                value={selectedCustomerOption}
                                onChange={(option) => {
                                    const nextPhone = option?.value ?? "";
                                    setPhone(nextPhone);
                                }}
                                onInputChange={(value, meta) => {
                                    if (meta.action === "input-change") {
                                        loadCustomers(value);
                                    }
                                    return value;
                                }}
                            />
                        </div>
                        <div className="w-full md:w-auto grid grid-cols-2 gap-x-2">
                            <div className="relative">
                                <ShortcutBadge shortcut="Shift + C" className="-top-5! hidden md:block" />
                                <KitButton
                                    size="small"
                                    variant="contained"
                                    className="w-full md:w-auto"
                                    onClick={() => handleExport("csv")}
                                >
                                    Export as CSV
                                </KitButton>
                            </div>
                            <div className="relative">
                                <ShortcutBadge shortcut="Shift + X" className="-top-5! hidden md:block" />
                                <KitButton
                                    size="small"
                                    variant="contained"
                                    className="w-full md:w-auto"
                                    onClick={() => handleExport("xlsx")}
                                >
                                    Export as XLSX
                                </KitButton>
                            </div>
                        </div>
                    </div>
                </Paper>

                {loyaltyLedgerError && <Alert severity="error">{loyaltyLedgerError?.message}</Alert>}

                {loyaltyBalance?.data?.balance > 0 && (
                    <Paper elevation={0} className="p-3 md:p-4 border border-blue-200 bg-blue-50 rounded-xl">
                        <Typography className="text-xs! md:text-sm! text-third-500">Current balance</Typography>
                        <Typography className="text-xl! md:text-2xl! font-semibold!">
                            {Number(loyaltyBalance.data.balance ?? 0)} pts
                            <span className="text-sm! md:text-base! text-third-500 ml-2">
                                (≈ {priceFormat(loyaltyBalance.data.rupeeValueAtCurrentRate ?? 0)})
                            </span>
                        </Typography>
                        {loyaltyBalance.data.customer && (
                            <Typography className="text-sm! text-third-500 mt-1">
                                {loyaltyBalance.data.customer.firstName} {loyaltyBalance.data.customer.lastName} ·{" "}
                                {loyaltyBalance.data.customer.customerCategory || "Customer"}
                            </Typography>
                        )}
                    </Paper>
                )}

                <KitDataGrid
                    columns={columns}
                    rows={loyaltyLedger?.data?.entries}
                    getRowId={(row) => row?.id}
                    rowCount={loyaltyLedger?.data?.pagination?.totalItems}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    isLoading={isLoyaltyLedgerLoading}
                    error={!!loyaltyLedgerError}
                    disableRowSelectionOnClick
                />
            </div>
        </>
    );
}
