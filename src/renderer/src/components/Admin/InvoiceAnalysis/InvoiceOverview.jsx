"use client";

import { format, parseISO } from "date-fns";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Label, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatPrice } from "../../../../../kit/utils/priceFormat";
import KitCustomTooltip from "../../../../../kit/components/KitCustomTooltip/KitCustomTooltip";
import { COLORS } from "../../../../../kit/configs/colors";
import { INVOICEOVERVIEW_OPTIONS } from "../../../../../kit/configs/general";
import { Box, Paper, Stack, Typography } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";

export default function InvoiceOverview({ invoiceRevenueMonthList }) {
    const isMobile = useMediaQuery("(max-width: 600px)");

    const [selectedMetric, setSelectedMetric] = useState("count");

    const chartGranularity = invoiceRevenueMonthList?.summary?.granularity ?? "month";

    const parsePeriodDate = (period) => {
        const normalized = period.length === 10 ? period : String(period).substring(0, 10);
        const parsed = parseISO(normalized);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    };

    const transformInvoiceData = useMemo(() => {
        const formatPeriodLabel = (period) => {
            const parsed = parsePeriodDate(period);
            if (!parsed) return period;
            if (chartGranularity === "day" || chartGranularity === "week") {
                return format(parsed, "d MMM");
            }
            return format(parsed, "MMM yy");
        };
        const sourceData =
            selectedMetric === "count" ? invoiceRevenueMonthList?.count_data : invoiceRevenueMonthList?.revenue_data;

        if (!sourceData?.length) return [];

        const allCategoryKeys = Array.from(new Set(sourceData.flatMap((item) => Object.keys(item.categories || {}))));

        const sortedData = [...sourceData].sort((a, b) => {
            const aTime = parsePeriodDate(String(a.month))?.getTime() ?? 0;
            const bTime = parsePeriodDate(String(b.month))?.getTime() ?? 0;
            return aTime - bTime;
        });

        return sortedData
            .map((item) => {
                const monthLabel = formatPeriodLabel(String(item.month));
                const categories = item.categories || {};

                const row = {
                    month: monthLabel,
                    totalInvoices: 0,
                };

                allCategoryKeys.forEach((key) => {
                    const value = categories[key] ?? 0;
                    row[key] = value;
                    row.totalInvoices += typeof value === "number" ? value : 0;
                });

                return row;
            })
            .filter((row) => row.totalInvoices > 0);
    }, [invoiceRevenueMonthList, selectedMetric, chartGranularity]);

    const maxTicks = isMobile ? 5 : 10;
    const xAxisInterval = Math.max(0, Math.ceil(transformInvoiceData.length / maxTicks) - 1);

    const chartKeys =
        transformInvoiceData.length > 0
            ? Object.keys(transformInvoiceData[0]).filter((key) => key !== "month" && key !== "totalInvoices")
            : [];

    const keyColors = chartKeys.reduce((acc, key, idx) => {
        acc[key] = COLORS[idx % COLORS.length];
        return acc;
    }, {});

    const chartWidth = isMobile ? Math.max(600, transformInvoiceData.length * 45) : "100%";

    return (
        <Paper variant="outlined" className="min-w-0 rounded-xl! p-3! md:p-4!">
            <div className="flex items-center justify-between gap-1 md:gap-2">
                <div className="text-base md:text-xl font-semibold">Invoice Overview</div>
                <LegendToggle selected={selectedMetric} onChange={setSelectedMetric} />
            </div>

            <Box className="mt-2 md:mt-0 mb-3 flex flex-wrap items-center gap-x-4 gap-y-0">
                {chartKeys.map((key) => (
                    <Box key={key} className="flex items-center gap-1">
                        <Box
                            component="span"
                            className="inline-block h-3 w-3 rounded"
                            sx={{ backgroundColor: keyColors[key] || "#000" }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {key}
                        </Typography>
                    </Box>
                ))}
            </Box>
            <div className="custom-scrollbar w-full min-w-0 overflow-x-auto scroll-smooth">
                <div
                    className="h-80"
                    style={{
                        width: chartWidth,
                        minWidth: "100%",
                    }}
                >
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={transformInvoiceData}
                            margin={{ top: 12, right: 16, left: 4, bottom: 8 }}
                            className="[&_.recharts-cartesian-axis-tick-value]:fill-gray-500 [&_.recharts-cartesian-grid-vertical]:opacity-0"
                        >
                            <CartesianGrid strokeOpacity={0.435} />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                interval={xAxisInterval}
                                minTickGap={isMobile ? 12 : 8}
                                height={isMobile ? 65 : 45}
                                angle={isMobile ? -35 : 0}
                                textAnchor={isMobile ? "end" : "middle"}
                                tickMargin={isMobile ? 12 : 8}
                                tick={{
                                    fontSize: isMobile ? 9 : 11,
                                    fill: "#6B7280",
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                width={isMobile ? 42 : 56}
                                tickFormatter={formatPrice}
                                tick={{
                                    fontSize: isMobile ? 10 : 11,
                                    fill: "#6B7280",
                                }}
                            >
                                <Label
                                    value={selectedMetric === "count" ? "Count" : "Sale Revenues (INR)"}
                                    angle={-90}
                                    position="insideLeft"
                                    offset={12}
                                    style={{ fill: "#6B7280", fontSize: 11 }}
                                />
                            </YAxis>
                            <Tooltip content={<KitCustomTooltip />} />
                            {chartKeys.map((key) => (
                                <Area
                                    key={key}
                                    dataKey={key}
                                    stroke={keyColors[key]}
                                    strokeWidth={2.3}
                                    fillOpacity={0}
                                    fill={`url(#${key})`}
                                    dot={<CustomizedDot color={keyColors[key]} />}
                                    activeDot={<CustomizedDot color={keyColors[key]} />}
                                />
                            ))}
                            <defs>
                                {chartKeys.map((key) => (
                                    <linearGradient key={key} id={key} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={keyColors[key]} stopOpacity={0.1} />
                                        <stop offset="95%" stopColor={keyColors[key]} stopOpacity={0} />
                                    </linearGradient>
                                ))}
                            </defs>
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Paper>
    );
}

function CustomizedDot(props) {
    const { cx, cy, color } = props;
    if (cx == null || cy == null) return null;

    return <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={2} />;
}

function LegendToggle({ selected, onChange }) {
    return (
        <Stack direction="row" spacing={2} alignItems="center">
            {INVOICEOVERVIEW_OPTIONS.map((item, index) => {
                const value = item.name.toLowerCase();
                const isActive = selected === value;
                return (
                    <button
                        key={item.name}
                        onClick={() => onChange(value)}
                        className={`flex items-center gap-1.5 text-gray-600 hover:text-gray-900 ${isActive ? "font-semibold text-gray-900" : ""}`}
                    >
                        <span
                            className={`size-2.5 rounded-full opacity-40 cursor-pointer ${isActive ? "size-3.5  opacity-100" : ""}`}
                            style={{ backgroundColor: COLORS[index] }}
                        />
                        <span className="whitespace-nowrap text-xs">{item.name}</span>
                    </button>
                );
            })}
        </Stack>
    );
}
