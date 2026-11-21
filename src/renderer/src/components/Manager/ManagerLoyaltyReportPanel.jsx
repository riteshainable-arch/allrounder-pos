import { useEffect, useRef, useState } from "react";
import { Alert, Backdrop, CircularProgress, IconButton, Paper, Typography } from "@mui/material";
import { format } from "date-fns";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitMuiTable from "../../../../kit/components/KitMuiTable";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { useGetLoyaltyDailyReport } from "../../../../kit/hooks/data/loyalty";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import ShortcutBadge from "../Dashboard/ShortcutBadge";
import { downloadCsv, downloadXlsx } from "../../../../kit/utils/exportFile";
import { toast } from "react-toastify";
import { EXPORT_LIMIT } from "../../../../kit/configs/general";
import useKeyboardShortcuts from "../../../../kit/hooks/useKeyboardShortcuts";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitHeader from "../../../../kit/components/KitHeader/KitHeader";

const today = format(new Date(), "yyyy-MM-dd");

export default function ManagerLoyaltyReportPanel() {
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [isExporting, setIsExporting] = useState(false);

    const queryParams = {
        startDate: startDate,
        endDate: endDate,
    }

    const { loyaltyDailyReport, isLoyaltyDailyReportLoading, loyaltyDailyReportError, refreshLoyaltyDailyReport } = useGetLoyaltyDailyReport(queryParams);

    const summary = loyaltyDailyReport?.data?.totals || {};
    const tiles = [
        { label: "Points Earned", value: summary.totalEarnedPoints ?? summary.earnedPoints ?? 0 },
        { label: "Points Redeemed", value: summary.totalRedeemedPoints ?? summary.redeemedPoints ?? 0 },
        { label: "Redeem Discount", value: priceFormat(summary.totalRedeemDiscount ?? summary.redeemDiscount ?? 0) },
        { label: "Transactions", value: summary.transactionCount ?? summary.count ?? 0 },
    ];

    const columns = [
        {
            field: 'date',
            headerName: 'Date',
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params?.row?.date || "-"}
                </Typography>
            )
        },
        {
            field: 'earnedPoints',
            headerName: 'Earned',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params?.row?.earnedPoints ?? params?.row?.totalEarnedPoints ?? "0"}
                </Typography>
            )
        },
        {
            field: 'redeemedPoints',
            headerName: 'Redeemed',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params?.row?.redeemedPoints ?? params?.row?.totalRedeemedPoints ?? "0"}
                </Typography>
            )
        },
        {
            field: 'redeemDiscount',
            headerName: 'Discount ₹',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {priceFormat(params?.row?.redeemDiscount ?? params?.row?.totalRedeemDiscount)}
                </Typography>
            )
        },
        {
            field: 'transactionCount',
            headerName: 'Transactions',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params?.row?.transactionCount ?? params?.row?.count ?? "0"}
                </Typography>
            )
        },
    ];

    const handleExport = async (type) => {
        if (!loyaltyDailyReport?.data?.rows?.length > 0) {
            toast.warning("No data available to export.");
            return;
        }

        setIsExporting(true);

        try {
            const bills = loyaltyDailyReport?.data?.rows || [];

            const exportRows = bills.slice(0, EXPORT_LIMIT).map((bill) => ({
                Date: bill.date ?? "-",
                Earned: bill.earnedPoints ?? bill.totalEarnedPoints ?? 0,
                Redeemed: bill.redeemedPoints ?? bill.totalRedeemedPoints ?? 0,
                "Discount ₹": priceFormat(bill.redeemDiscount ?? bill.totalRedeemDiscount ?? 0),
                Transactions: bill.transactionCount ?? bill.count ?? 0,
            }));

            if (!exportRows.length) return;

            const timestamp = format(new Date(), "yyyyMMdd_HHmmss");

            if (type === "csv") {
                downloadCsv(exportRows, `loyalty_report_${timestamp}.csv`);

            } else {
                downloadXlsx(exportRows, `loyalty_report_${timestamp}.xlsx`, "Loyalty Report");
            }
        } catch (error) {
            toast.error(error?.message || "Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "s":
                    e.preventDefault();
                    startDateRef.current?.focus();
                    break;

                case "e":
                    e.preventDefault();
                    endDateRef.current?.focus();
                    break;

                case "r":
                    e.preventDefault();
                    refreshLoyaltyDailyReport();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useKeyboardShortcuts({
        handleExportCsv: () => handleExport("csv"),
        handleExportXlsx: () => handleExport("xlsx"),
    });

    return (
        <>
            <Backdrop open={isLoyaltyDailyReportLoading || isExporting} sx={{ zIndex: 9999, color: "#fff" }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <div className="flex flex-col gap-3">
                <KitHeader
                    title='Daily Loyalty Report'
                    subtitle="View daily loyalty points activity"
                    icon="tabler:gift"
                    count={loyaltyDailyReport?.data?.rows?.length ?? 0}
                    countLabel="records"
                />

                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl bg-white">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + S" className="top-0" />
                            <KitTextField
                                ref={startDateRef}
                                size="small"
                                type="date"
                                label="Start"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + E" className="top-0" />
                            <KitTextField
                                ref={endDateRef}
                                size="small"
                                type="date"
                                label="End"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Shift + C" className="-top-5!" />
                            <KitButton
                                size="small"
                                variant="contained"
                                className="w-auto"
                                onClick={() => handleExport("csv")}
                            >
                                Export as CSV
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Shift + X" className="-top-5!" />
                            <KitButton
                                size="small"
                                variant="contained"
                                className="w-auto"
                                onClick={() => handleExport("xlsx")}
                            >
                                Export as XLSX
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5!" />
                            <IconButton
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                                onClick={() => refreshLoyaltyDailyReport()}
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                {loyaltyDailyReportError && <Alert severity="error">{loyaltyDailyReportError?.message || "Failed to load loyalty report."}</Alert>}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {tiles.map((tile) => (
                        <Paper
                            key={tile.label}
                            elevation={0}
                            className="p-4 border border-gray-200 rounded-xl"
                        >
                            <Typography className="text-sm! text-third-500">{tile.label}</Typography>
                            <Typography className="text-xl! font-semibold!">{tile.value}</Typography>
                        </Paper>
                    ))}
                </div>

                <div>
                    <KitMuiTable
                        columns={columns}
                        rows={loyaltyDailyReport?.data?.rows || []}
                        getRowId={(row) => row.id}
                        paginationMode="client"
                    />
                </div>
            </div>
        </>
    );
}
