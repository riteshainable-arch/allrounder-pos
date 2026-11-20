"use client";

import { Paper, Typography } from "@mui/material";
import { calculateMoMStats } from "../../../../../../kit/utils/secondaryCategoryGrowth";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

const MetricRow = ({ label, value, isPositive, showTrend = false }) => (
    <div className="flex justify-between gap-3 py-3">
        <div className="w-1/2">
            <Typography variant="body2" className="text-xs! md:text-[13px]! font-semibold! text-third-800!">
                {label}
            </Typography>
        </div>

        <div className="flex items-center gap-1 text-sm">
            {showTrend &&
                (isPositive ? (
                    <TrendingUpIcon fontSize="small" className="text-green-500" />
                ) : (
                    <TrendingDownIcon fontSize="small" className="text-red-500" />
                ))}

            <Typography
                variant="body2"
                className={`font-semibold! ${showTrend ? (isPositive ? "text-green-500!" : "text-red-500!") : ""}`}
            >
                {value}
            </Typography>
        </div>
    </div>
);

export default function SecondaryCategoryDetails({ secondaryCategoryRevenue }) {
    const result = calculateMoMStats(secondaryCategoryRevenue?.allMonthlyRevenueData);

    return (
        <Paper variant="outlined" className="min-w-0 rounded-xl! p-3! md:p-4!">
            <MetricRow
                label="MONTH ON MONTH VOLUME GROWTH"
                value={result?.volumeGrowth ? `${Math.abs(Number(result.volumeGrowth)).toFixed(1)}%` : "--"}
                isPositive={result?.isVolumeUp}
                showTrend
            />

            <hr className="border-third-200!"/>

            <MetricRow
                label="MONTH ON MONTH REVENUE GROWTH"
                value={result?.revenueGrowth ? `${Math.abs(Number(result.revenueGrowth)).toFixed(1)}%` : "--"}
                isPositive={result?.isRevenueUp}
                showTrend
            />

            <hr className="border-third-200!"/>

            <MetricRow
                label="% OF CUSTOMERS"
                value={result?.customerPercent ? `${Math.abs(Number(result.customerPercent)).toFixed(0)}%` : "--"}
            />

            <hr className="border-third-200!"/>

            <MetricRow label="FIRST INVOICE SHARE" value="20%" />
        </Paper>
    );
}
