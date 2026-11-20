import { Alert, Paper, Typography } from "@mui/material";
import { ResponsiveContainer, Tooltip, Treemap } from "recharts";
import { useGetAllDashboardAlertsOverview } from "../../../../../kit/hooks/data/dashboard";
import { CATEGORY_COLORS } from "../../../../../kit/configs/colors";
import { formatTooltipLabel } from "../../../../../kit/utils/formatLabel";
import { formatAmount, formatPrice } from "../../../../../kit/utils/priceFormat";
import KitLoader from "../../../../../kit/components/KitLoader/KitLoader";

const CustomizedContent = (props) => {
    const { x, y, width, height, name, size, stroke, color } = props;
    const padding = 4;

    if (!name || size === 0 || width < 60 || height < 40) {
        return (
            <g>
                <rect x={x} y={y} width={width} height={height} stroke={stroke} fill={color} />
            </g>
        );
    }

    return (
        <g>
            <rect x={x} y={y} width={width} height={height} stroke={stroke} fill={color} />
            <text
                x={x + width - padding}
                y={y + height - padding}
                textAnchor="end"
                fontSize={14}
                fontWeight={100}
                pointerEvents="none"
            >
                {formatPrice(size)}
            </text>
            <text x={x + padding} y={y + padding + 12} fontSize={12} fontWeight={100} pointerEvents="none">
                {name?.length > 15 ? formatTooltipLabel(name.slice(0, 12)) + "..." : formatTooltipLabel(name)}
            </text>
        </g>
    );
};

export default function DashboardInventoryStatus() {
    const { dashboardAlertsOverview, isDashboardAlertsOverviewLoading, dashboardAlertsOverviewError } =
        useGetAllDashboardAlertsOverview();

    const data = dashboardAlertsOverview?.data;

    const alerts =
        data && Array.isArray(data.alertsByCategory)
            ? data.alertsByCategory
                  .filter((item) => item.count > 0)
                  .map((item) => ({
                      name: item.alertType,
                      size: item.count,
                      stockValue: item.stockValue,
                      lossInSales: item.lossInSales,
                      excessStockValue: item.excessStockValue,
                      color: CATEGORY_COLORS[item.alertType] || "#CCCCCC",
                  }))
            : [];

    const filteredData = [
        ...(alerts ?? []),
        {
            name: "NORMAL_PRODUCTS",
            size: data?.normalProductsDetails?.uniqueCount ?? 0,
            stockValue: data?.normalProductsDetails?.stockValue ?? 0,
            color: CATEGORY_COLORS["NORMAL_PRODUCTS"],
        },
    ];

    const sortedData = [...filteredData].sort((a, b) => a.size - b.size);

    return (
        <Paper variant="outlined" className="min-w-0 rounded-xl! p-3! md:p-4!">
            <div className="mb-3 md:mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm md:text-base font-semibold!">Inventory Status of Items</div>
            </div>
            <div className="h-72 min-w-0">
                {isDashboardAlertsOverviewLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <KitLoader isLoading />
                    </div>
                ) : dashboardAlertsOverviewError ? (
                    <Alert severity="error">
                        {dashboardAlertsOverviewError?.message || "Unable to load sales overview."}
                    </Alert>
                ) : sortedData.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <Typography variant="body2" color="text.secondary">
                            No sales data for this period.
                        </Typography>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <Treemap
                            width={400}
                            height={200}
                            data={sortedData}
                            dataKey="size"
                            aspectRatio={4 / 3}
                            stroke="#fff"
                            fill="#8884d8"
                            content={<CustomizedContent />}
                        >
                            <Tooltip
                                cursor={{ stroke: "#888", strokeWidth: 2 }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const { name, size, stockValue, lossInSales, excessStockValue } =
                                            payload[0].payload;
                                        return (
                                            <div className="flex flex-col gap-2 border border-gray-300 bg-white p-2 text-sm">
                                                <div>
                                                    <strong>{formatTooltipLabel(name)}</strong>: {formatPrice(size)}
                                                </div>
                                                <div>
                                                    <strong>Stock Value</strong>: ₹ {formatAmount(stockValue)}
                                                </div>
                                                {lossInSales > 0 && (
                                                    <div>
                                                        <strong>Loss In Sales</strong>: ₹ {formatAmount(lossInSales)}
                                                    </div>
                                                )}
                                                {excessStockValue > 0 && (
                                                    <div>
                                                        <strong>Excess Stock Value</strong>: ₹{" "}
                                                        {formatAmount(excessStockValue)}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </Treemap>
                    </ResponsiveContainer>
                )}
            </div>
        </Paper>
    );
}
