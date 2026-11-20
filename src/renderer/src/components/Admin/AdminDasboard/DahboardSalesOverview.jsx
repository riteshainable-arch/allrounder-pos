import { useState } from "react";
import { Alert, Paper, Typography } from "@mui/material";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import KitLoader from "../../../../../kit/components/KitLoader/KitLoader";
import KitSelect from "../../../../../kit/components/KitSelect";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import { ALL_RANGE_OPTIONS } from "../../../../../kit/configs/general";
import { useGetAllDashboardSalesOverview } from "../../../../../kit/hooks/data/dashboard";
import KitCustomTooltip from "../../../../../kit/components/KitCustomTooltip/KitCustomTooltip";
import KitReactDatepicker from "../../../../../kit/components/KitReactDatepicker";
import { InputAdornment } from "@mui/material";
import { CalendarMonthOutlined } from "@mui/icons-material";
import { format, startOfMonth, subMonths, endOfMonth } from "date-fns";

const formatRevenueCompact = (value) => {
    const amount = Number(value);
    if (!Number.isFinite(amount)) return "₹0";

    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(1).replace(/\.0$/, "")}Cr`;
    }

    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(1).replace(/\.0$/, "")}L`;
    }

    if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    }

    return `₹${amount}`;
};

export default function DahboardSalesOverview() {
    const [pickerMode, setPickerMode] = useState("monthly");
    const [startDate, setStartDate] = useState(() => format(subMonths(startOfMonth(new Date()), 11), "yyyy-MM-dd"));
    const [endDate, setEndDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
    const maxDate = format(new Date(), "yyyy-MM-dd");

    const salesOverviewQuery = {
        type: pickerMode,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    };
    const shouldFetch = Boolean(startDate && endDate && startDate <= endDate);

    const { dashboardSalesOverview, dashboardSalesOverviewError, isDashboardSalesOverviewLoading } =
        useGetAllDashboardSalesOverview(salesOverviewQuery, shouldFetch);

    const chartData = Array.isArray(dashboardSalesOverview?.data?.data)
        ? dashboardSalesOverview.data.data.map((item) => ({
              label: item.period,
              revenue: Number(item.revenue) || 0,
              volume: Number(item.total_transactions) || 0,
          }))
        : [];

    const handleDateChange = (dates) => {
        const [start, end] = dates;

        if (!start) {
            setStartDate("");
            setEndDate("");
            return;
        }

        const today = new Date();
        let startFinal = start;
        let endFinal = end;

        if (end) {
            if (pickerMode === "monthly") {
                startFinal = startOfMonth(start);
                endFinal = endOfMonth(end) > today ? today : endOfMonth(end);
            } else if (pickerMode === "yearly") {
                startFinal = new Date(start.getFullYear(), 0, 1);

                const yearEnd = new Date(end.getFullYear(), 11, 31);
                endFinal = yearEnd > today ? today : yearEnd;
            }
        }

        setStartDate(format(startFinal, "yyyy-MM-dd"));
        setEndDate(end ? format(endFinal, "yyyy-MM-dd") : "");
    };

    return (
        <Paper variant="outlined" className="min-w-0 rounded-xl! p-3! md:p-4!">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm md:text-base font-semibold!">Sales Overview</div>
                <div className="flex w-full flex-col gap-2 md:gap-3 sm:w-auto sm:flex-row sm:items-end">
                    <div className="w-full sm:w-36">
                        <KitSelect
                            aria-label="Sales overview period"
                            size="small"
                            placeholderFontSize={14}
                            inputFontSize={14}
                            options={ALL_RANGE_OPTIONS}
                            value={ALL_RANGE_OPTIONS.find((option) => option.value === pickerMode) || null}
                            onChange={(option) => {
                                setPickerMode(option?.value || "monthly");
                                setStartDate("");
                                setEndDate("");
                            }}
                            isClearable={false}
                            isSearchable={false}
                        />
                    </div>

                    <KitReactDatepicker
                        selectsRange
                        selected={startDate ? new Date(`${startDate}T00:00:00`) : null}
                        startDate={startDate ? new Date(`${startDate}T00:00:00`) : null}
                        endDate={endDate ? new Date(`${endDate}T00:00:00`) : null}
                        onChange={handleDateChange}
                        showMonthYearPicker={pickerMode === "monthly"}
                        showYearPicker={pickerMode === "yearly"}
                        maxDate={new Date()}
                        dateFormat={
                            pickerMode === "monthly" ? "MM/yyyy" : pickerMode === "yearly" ? "yyyy" : "dd/MM/yyyy"
                        }
                        placeholderText={
                            pickerMode === "monthly"
                                ? "Select month range"
                                : pickerMode === "yearly"
                                  ? "Select year range"
                                  : pickerMode === "weekly"
                                    ? "Select week range"
                                    : "Select date range"
                        }
                        popperClassName="!z-[99999]"
                        popperPlacement="bottom-start"
                        customInput={
                            <KitTextField
                                size="small"
                                placeholderFontSize={14}
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

            <Typography variant="caption" color="text.secondary">
                Revenue shown in INR (₹)
            </Typography>
            <div className="mt-2 h-64 min-w-0">
                {isDashboardSalesOverviewLoading ? (
                    <div className="flex h-full items-center justify-center">
                        <KitLoader isLoading />
                    </div>
                ) : dashboardSalesOverviewError ? (
                    <Alert severity="error">
                        {dashboardSalesOverviewError?.message || "Unable to load sales overview."}
                    </Alert>
                ) : !shouldFetch ? (
                    <Alert severity="info">Select a valid start and end date to view sales.</Alert>
                ) : chartData.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <Typography variant="body2" color="text.secondary">
                            No sales data for this period.
                        </Typography>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 40 }}>
                            <CartesianGrid vertical={false} strokeOpacity={0.435} />

                            <XAxis
                                dataKey="label"
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

                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                width={55}
                                tick={{ fill: "#6B7280", fontSize: 11 }}
                                tickFormatter={(value) => formatRevenueCompact(Number(value))}
                            />

                            <Tooltip content={<KitCustomTooltip prefix="₹" postfix="" formattedNumber />} />

                            <Bar dataKey="revenue" fill="#3562fc" barSize={12} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </Paper>
    );
}
