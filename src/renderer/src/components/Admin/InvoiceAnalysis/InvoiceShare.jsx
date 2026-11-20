"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import KitCustomTooltip from "../../../../../kit/components/KitCustomTooltip/KitCustomTooltip";
import { Box, Paper, Typography } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";

function CustomYAxisTick({ x, y, payload, prefix, postfix, dy = 4 }) {
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={dy} textAnchor="end" className="fill-gray-500">
                {prefix && prefix}
                {payload.value.toLocaleString()}
                {postfix && postfix}
            </text>
        </g>
    );
}

export default function InvoiceShare({ invoiceInvoiceStatsList }) {
    const is2XL = useMediaQuery("(min-width: 1780px)");
    const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
    const isMobile = useMediaQuery("(max-width: 767px)");
    const isLg = useMediaQuery("(min-width: 1024px) and (max-width: 1779px)");

    const barSize = is2XL ? 24 : isLg || isMobile ? 32 : isTablet ? 40 : 32;
    const FormattedData = useMemo(() => {
        const data = {
            "First Invoice": { quickstop: 0, fillin: 0, stockup: 0, horeca: 0 },
            "2-4 Invoices": { quickstop: 0, fillin: 0, stockup: 0, horeca: 0 },
            "5-12 Invoices": { quickstop: 0, fillin: 0, stockup: 0, horeca: 0 },
            "Above 13 Invoices": { quickstop: 0, fillin: 0, stockup: 0, horeca: 0 },
        };

        const getKey = (category) => {
            const c = category?.toLowerCase();
            if (c?.includes("quick")) return "quickstop";
            if (c?.includes("fill")) return "fillin";
            if (c?.includes("stock")) return "stockup";
            if (c?.includes("horeca")) return "horeca";
            return "quickstop";
        };

        invoiceInvoiceStatsList.forEach((item) => {
            const key = getKey(item.invoice_category);

            data[item.invoice_order_type][key]++;
        });

        return Object.entries(data).map(([category, values]) => ({
            category,
            ...values,
        }));
    }, [invoiceInvoiceStatsList]);

    const legendItems = [
        { label: "Quick stop", color: "#10b981" },
        { label: "Fill In", color: "#0470f2" },
        { label: "Stockup", color: "#facc15" },
        { label: "HORECA", color: "#f472b6" },
    ];

    return (
        <Paper variant="outlined" className="min-w-0 rounded-xl! p-3! md:p-4!">
            <div className="flex flex-col items-start md:items-center justify-between gap-2 md:flex-row">
                <div className="text-base md:text-xl font-semibold">Invoice Share</div>
            </div>

            <Box className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                {legendItems.map((item) => (
                    <Box key={item.label} className="flex items-center gap-1.5">
                        <Box
                            component="span"
                            className="h-2.5 w-2.5 rounded-full"
                            sx={{ backgroundColor: item.color }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {item.label}
                        </Typography>
                    </Box>
                ))}
            </Box>

            <div className="custom-scrollbar overflow-x-auto scroll-smooth">
                <div className="h-87.5 overflow-hidden">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={FormattedData}
                            margin={{
                                top: 12,
                                right: 12,
                                bottom: 48,
                                left: 8,
                            }}
                            className="[&_.recharts-tooltip-cursor]:fill-opacity-20 dark:[&_.recharts-tooltip-cursor]:fill-opacity-10 [&_.recharts-cartesian-axis-tick-value]:fill-gray-500 [&_.recharts-cartesian-grid-vertical]:opacity-0"
                        >
                            <CartesianGrid strokeOpacity={0.435} />
                            <XAxis
                                dataKey="category"
                                axisLine={false}
                                tickLine={false}
                                interval={0}
                                height={56}
                                tick={({ x, y, payload }) => {
                                    const words = String(payload.value).split(" ");
                                    return (
                                        <text x={x} y={y + 12} textAnchor="middle" fontSize={10} fill="#6B7280">
                                            {words.map((word, index) => (
                                                <tspan key={index} x={x} dy={index === 0 ? 0 : 12}>
                                                    {word}
                                                </tspan>
                                            ))}
                                        </text>
                                    );
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                width={48}
                                tick={({ payload, ...rest }) => {
                                    const pl = {
                                        ...payload,
                                        value: Number(payload.value),
                                    };
                                    return <CustomYAxisTick payload={pl} {...rest} dy={4} />;
                                }}
                            />
                            <Tooltip content={<KitCustomTooltip prefix="" postfix="%" formattedNumber />} />
                            <Bar barSize={barSize} dataKey="quickstop" fill="#10b981" stackId="a" />
                            <Bar barSize={barSize} dataKey="fillin" fill="#0470f2" stackId="a" />
                            <Bar barSize={barSize} dataKey="stockup" fill="#facc15" stackId="a" />
                            <Bar barSize={barSize} dataKey="horeca" fill="#f472b6" stackId="a" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Paper>
    );
}
