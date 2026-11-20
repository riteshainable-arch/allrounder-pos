import { Alert, Paper, Typography } from "@mui/material";
import { useState } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useGetCustomerSegmentsDashboardChart } from "../../../../../kit/hooks/data/dashboard";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import { getCustomerSegmentColor } from "../../../../../kit/configs/colors";
import KitCustomTooltip from "../../../../../kit/components/KitCustomTooltip/KitCustomTooltip";
import KitLoader from "../../../../../kit/components/KitLoader/KitLoader";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import KitReactDatepicker from "../../../../../kit/components/KitReactDatepicker";
import { InputAdornment } from "@mui/material";
import { CalendarMonthOutlined } from "@mui/icons-material";

const excludedSegments = ["Unclassified", "No Purchase"];

export default function DashboardCustomerSegmentsBars() {
    const [startDate, setStartDate] = useState(() => format(subMonths(startOfMonth(new Date()), 5), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
    const maxDate = format(new Date(), "yyyy-MM-dd");

    const handleDateChange = (dates) => {
        const [start, end] = dates;

        if (!start) {
            setStartDate("");
            setEndDate("");
            return;
        }

        const startFinal = startOfMonth(start);
        const today = new Date();
        const monthEnd = end ? endOfMonth(end) : null;
        const endFinal = monthEnd && monthEnd > today ? today : monthEnd;

        setStartDate(format(startFinal, "yyyy-MM-dd"));
        setEndDate(endFinal ? format(endFinal, "yyyy-MM-dd") : "");
    };

    const customSegmentQuery = {
        startMonth: startDate || undefined,
        endMonth: endDate || undefined,
    };

    const shouldFetch = !!startDate && !!endDate;

    const {
        customerSegmentDashboardChart,
        isCustomerSegmentDashboardChartLoading,
        customerSegmentDashboardChartError,
    } = useGetCustomerSegmentsDashboardChart(customSegmentQuery, shouldFetch);

    const segmentNames = customerSegmentDashboardChart?.data?.segmentNames ?? [];

    const transformed =
        customerSegmentDashboardChart?.data?.monthlyData?.map((item) => {
            const row = {
                name: `${item.monthLabel.split(" ")[0]} ${item.monthLabel.split(" ")[1].slice(2)}`,
                totalCustomers: segmentNames
                    .filter((segmentName) => !excludedSegments.includes(segmentName))
                    .reduce((sum, segmentName) => sum + (item.segments[segmentName] ?? 0), 0),
            };

            segmentNames
                .filter((segmentName) => !excludedSegments.includes(segmentName))
                .forEach((segmentName) => {
                    row[segmentName] = item.segments[segmentName] ?? 0;
                });

            return row;
        }) ?? [];

    const chartKeys =
        transformed?.length > 0
            ? Object.keys(transformed[0]).filter((key) => key !== "name" && key !== "totalCustomers")
            : [];

    const keyColors = chartKeys.reduce((acc, key, idx) => {
        acc[key] = getCustomerSegmentColor(key, idx);
        return acc;
    }, {});

    return (
        <Paper variant="outlined" className="min-w-0 rounded-xl! p-3! md:p-4!">
            <div className="mb-3 md:mb-4 flex flex-wrap items-center justify-between gap-2 md:gap-3">
                <div className="text-sm md:text-base font-semibold!">Customer Shopping Behaviour</div>
                <div className="w-full sm:w-auto">
                    <KitReactDatepicker
                        selectsRange
                        selected={startDate ? new Date(`${startDate}T00:00:00`) : null}
                        startDate={startDate ? new Date(`${startDate}T00:00:00`) : null}
                        endDate={endDate ? new Date(`${endDate}T00:00:00`) : null}
                        onChange={handleDateChange}
                        showMonthYearPicker
                        maxDate={new Date()}
                        dateFormat="MMM yyyy"
                        placeholderText="Select month range"
                        popperClassName="!z-[99999]"
                        popperPlacement="bottom-start"
                        customInput={
                            <KitTextField
                                size="small"
                                placeholderFontSize={14}
                                placeholder="Select month range"
                                fullWidth
                                slotProps={{
                                    input: {
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <CalendarMonthOutlined sx={{ fontSize: 18 }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        }
                    />
                </div>
            </div>
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2">
                {Object.entries(keyColors).map(([segment, color]) => (
                    <div key={segment} className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
                        <Typography variant="caption">{segment}</Typography>
                    </div>
                ))}
            </div>
            <div className="h-64 min-w-0">
                {isCustomerSegmentDashboardChartLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <KitLoader isLoading />
                    </div>
                ) : customerSegmentDashboardChartError ? (
                    <Alert severity="error">
                        {customerSegmentDashboardChartError?.message || "Unable to load sales overview."}
                    </Alert>
                ) : !shouldFetch ? (
                    <Alert severity="info">Select a valid start and end date to view sales.</Alert>
                ) : transformed.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <Typography variant="body2" color="text.secondary">
                            No sales data for this period.
                        </Typography>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={transformed}
                            margin={{
                                top: 0,
                                right: 5,
                                bottom: 15,
                                left: -10,
                            }}
                        >
                            <CartesianGrid stroke="#f5f5f5" strokeOpacity={0.435} />

                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                angle={-90}
                                interval={0}
                                tick={({ x, y, payload }) => (
                                    <text
                                        x={x + 15}
                                        y={y + 5}
                                        textAnchor="end"
                                        fontSize={10}
                                        fill="#666"
                                        transform={`rotate(-90, ${x + 8}, ${y + 8})`}
                                    >
                                        {payload.value}
                                    </text>
                                )}
                            />

                            <YAxis width={40} tick={{ fontSize: 11, fill: "#6B7280" }} />

                            <Tooltip content={<KitCustomTooltip prefix="" postfix="" formattedNumber />} />

                            {chartKeys.map((key) => (
                                <Bar key={key} dataKey={key} stackId="a" fill={keyColors[key]} barSize={20} />
                            ))}

                            <Line type="linear" dataKey="totalCustomers" stroke="#9F245F" strokeWidth={2} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
        </Paper>
    );
}
