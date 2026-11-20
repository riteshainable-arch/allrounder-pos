import { Box, Paper, Typography } from "@mui/material";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import { useGetAllDashboardGeneral } from "../../../../../kit/hooks/data/dashboard";
import { formatAmount, formatPrice } from "../../../../../kit/utils/priceFormat";

export default function DashboardInformation() {
    const { dashboardGeneral } = useGetAllDashboardGeneral();

    const summaryMetrics = [
        {
            title: "Month to Date Sales",
            icon: "tabler:currency-rupee",
            color: "#16a34a",
            value: dashboardGeneral?.data?.monthToDateSales?.currentMTDSales,
            isAmount: true,
            percentage: dashboardGeneral?.data?.monthToDateSales?.percentageChange,
            changeType: dashboardGeneral?.data?.monthToDateSales?.changeDirection,
        },
        {
            title: "No of Customers",
            icon: "tabler:users",
            color: "#2563eb",
            value: dashboardGeneral?.data?.customerAnalytics?.activeCustomers?.currentMonthActiveCustomers,
            percentage: dashboardGeneral?.data?.customerAnalytics?.activeCustomers?.percentageChange,
            changeType: dashboardGeneral?.data?.customerAnalytics?.activeCustomers?.changeType,
        },
        {
            title: "No of Invoices",
            icon: "tabler:receipt",
            color: "#7c3aed",
            value: dashboardGeneral?.data?.invoiceAnalytics?.currentMonthInvoices,
            percentage: dashboardGeneral?.data?.invoiceAnalytics?.percentageChange,
            changeType: dashboardGeneral?.data?.invoiceAnalytics?.changeType,
        },
        {
            title: "Stock Value",
            icon: "tabler:packages",
            color: "#ea580c",
            value: dashboardGeneral?.data?.totalStockValue,
            isAmount: true,
        },
        {
            title: "Stockout Alerts",
            icon: "tabler:alert-triangle",
            color: "#dc2626",
            value: dashboardGeneral?.data?.totalStockOutAlerts,
        },
        {
            title: "Average Order Value",
            icon: "tabler:chart-bar",
            color: "#0891b2",
            value: dashboardGeneral?.data?.averageOrderValue,
            isAmount: true,
        },
    ];

    const toNumber = (value) => {
        const parsedValue = Number(value);
        return Number.isFinite(parsedValue) ? parsedValue : 0;
    };

    const formatDashboardValue = (value, isAmount = false) =>
        isAmount ? `₹ ${formatAmount(toNumber(value))}` : formatPrice(toNumber(value));

    const formatPercentage = (value) => toNumber(value).toFixed(2);

    return (
        <Paper variant="outlined" className="min-w-0 rounded-xl! p-3! md:p-4!">
            <div className="mb-2 md:mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm md:text-base font-semibold!">Business Summary</div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {summaryMetrics.map((metric) => (
                    <Paper
                        key={metric.title}
                        variant="outlined"
                        className="flex min-w-0 flex-col items-center justify-center gap-1 md:gap-2 rounded-lg! p-3! text-center"
                    >
                        <Box
                            className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full"
                            sx={{
                                color: metric.color,
                                bgcolor: `${metric.color}1A`,
                            }}
                        >
                            <KitIcon icon={metric.icon} className="text-lg md:text-xl" />
                        </Box>

                        <Typography
                            variant="h6"
                            component="p"
                            className="font-bold!"
                            sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
                        >
                            {formatDashboardValue(metric.value, metric.isAmount)}
                        </Typography>

                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}
                        >
                            {metric.title}
                        </Typography>

                        {metric.percentage !== undefined && metric.percentage !== null && (
                            <Typography
                                variant="caption"
                                sx={{
                                    color: metric.changeType === "positive" ? "success.main" : "error.main",
                                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                }}
                            >
                                ({formatPercentage(metric.percentage)}%)
                            </Typography>
                        )}
                    </Paper>
                ))}
            </div>
        </Paper>
    );
}
