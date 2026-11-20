"use client";

import { useState } from "react";
import { Box, Paper, Typography, useMediaQuery } from "@mui/material";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLORS, PROJECT_STATISTICS_COLORS } from "../../../../../../kit/configs/colors";
import { projectStatisticsTicketStatus } from "../../../../../../kit/configs/general";
import KitCustomTooltip from "../../../../../../kit/components/KitCustomTooltip/KitCustomTooltip";
import { formatPrice } from "../../../../../../kit/utils/priceFormat";

export default function SecondaryCategorySalesOverview({ secondaryCategoryRevenue }) {
    const isMobile = useMediaQuery("(max-width: 600px)");

    const [selectedMetric, setSelectedMetric] = useState("revenue");

    const allMonthsSet = new Set();
    secondaryCategoryRevenue?.brands?.forEach((brand) => {
        brand?.monthly_revenue_data?.forEach((item) => {
            allMonthsSet.add(item.month);
        });
    });
    const months = Array.from(allMonthsSet).sort();

    const transformedData = months.map((month) => {
        const monthData = {
            month: new Date(month).toLocaleString("default", { month: "short" }),
        };

        secondaryCategoryRevenue.brands.forEach((brand) => {
            const brandMonthData = brand.monthly_revenue_data.find((m) => m.month === month);
            if (brandMonthData) {
                const key = brand.brand.toLowerCase();
                monthData[key] =
                    selectedMetric === "revenue"
                        ? parseFloat(brandMonthData.monthly_revenue)
                        : parseFloat(brandMonthData.monthly_invoices);
            } else {
                monthData[brand.brand.toLowerCase()] = 0;
            }
        });

        return monthData;
    });

    const brandKeys =
        transformedData.length > 0 ? Object.keys(transformedData[0]).filter((key) => key !== "month") : [];

    const brandColors = brandKeys.reduce((acc, key, index) => {
        acc[key] = COLORS[index % COLORS.length];
        return acc;
    }, {});

    return (
        <Paper variant="outlined" className="min-w-0 rounded-xl! p-3! md:p-4!">
            <div className="flex items-center justify-between gap-1 md:gap-2">
                <div className="text-lg md:text-xl font-semibold">Invoice Overview</div>
                <LegendToggle selected={selectedMetric} onChange={setSelectedMetric} />
            </div>

            <Box className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                {brandKeys.map((key) => (
                    <Box key={key} className="flex items-center gap-1">
                        <Box
                            component="span"
                            className="inline-block h-3 w-3 rounded"
                            sx={{ backgroundColor: brandColors[key] || "#000" }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {key}
                        </Typography>
                    </Box>
                ))}
            </Box>
            <div className="custom-scrollbar overflow-x-auto scroll-smooth">
                <div className="h-80 pt-6 @lg:pt-8 lg:h-96 3xl:h-[25rem]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={800}>
                        <AreaChart
                            data={transformedData}
                            margin={{ left: 5, right: 5, top: 10, bottom: 10 }}
                            className="[&_.recharts-cartesian-axis-tick-value]:fill-gray-500 rtl:[&_.recharts-cartesian-axis.yAxis]:-translate-x-12 [&_.recharts-cartesian-grid-vertical]:opacity-0"
                        >
                            <defs>
                                {brandKeys.map((brandKey) => (
                                    <linearGradient key={brandKey} id={brandKey} x1="0" y1="0" x2="0" y2="1">
                                        <stop
                                            offset="5%"
                                            stopColor={brandColors[brandKey] || "#000"}
                                            stopOpacity={0.1}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor={brandColors[brandKey] || "#000"}
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                ))}
                            </defs>
                            <CartesianGrid strokeOpacity={0.435} />
                            <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                className=" "
                                tick={{
                                    fontSize: isMobile ? 11 : 12,
                                    fill: "#6B7280",
                                }}
                            />
                            <YAxis
                                label={{
                                    value: "Revenue (INR)",
                                    angle: -90,
                                    position: "insideLeft",
                                    offset: 0,
                                    style: { fill: "#6B7280", fontSize: 12 },
                                }}
                                axisLine={false}
                                tickLine={false}
                                className=" "
                                tickFormatter={formatPrice}
                                tick={{
                                    fontSize: isMobile ? 11 : 12,
                                    fill: "#6B7280",
                                }}
                            />
                            <Tooltip content={<KitCustomTooltip />} wrapperStyle={{ pointerEvents: "auto" }} />
                            {brandKeys.map((brandKey) => (
                                <Area
                                    key={brandKey}
                                    dataKey={brandKey}
                                    stroke={brandColors[brandKey] || "#000"}
                                    strokeWidth={3}
                                    fillOpacity={0}
                                    fill={`url(#${brandKey})`}
                                    dot={<CustomizedDot color={brandColors[brandKey]} />}
                                    activeDot={<CustomizedDot color={brandColors[brandKey]} />}
                                />
                            ))}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Paper>
    );
}

function CustomizedDot(props) {
    const { cx, cy, color } = props;
    return (
        <svg
            x={cx - 6}
            y={cy - 8}
            width="14"
            height="14"
            viewBox="0 0 14 14"
            className="scale-150"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="7" cy="7" r="5.5" fill={color} stroke="white" strokeWidth="3" />
        </svg>
    );
}

function LegendToggle({ selected, onChange }) {
    return (
        <div className="flex w-auto text-xs @3xl:text-sm gap-3 lg:gap-4">
            {projectStatisticsTicketStatus.map((item, index) => {
                const value = item.name.toLowerCase();
                const isActive = selected === value;
                return (
                    <button
                        key={item.name}
                        onClick={() => onChange(value)}
                        className={`flex items-center gap-1.5 text-gray-600 hover:text-gray-900 ${isActive && "font-semibold text-gray-900"}`}
                    >
                        <span
                            className={`size-2.5 rounded-full opacity-40 ${isActive && "size-3.5  opacity-100"}`}
                            style={{ backgroundColor: PROJECT_STATISTICS_COLORS[index] }}
                        />
                        <span className="whitespace-nowrap">{item.name}</span>
                    </button>
                );
            })}
        </div>
    );
}
