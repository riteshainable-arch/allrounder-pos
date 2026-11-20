"use client";

import { useState } from "react";
import { Paper } from "@mui/material";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { COLORS } from "../../../../../../kit/configs/colors";
import { formatPrice } from "../../../../../../kit/utils/priceFormat";
import KitShow from "../../../../../../kit/components/KitShow/KitShow";
import { renderActiveShape } from "../CategoryRevenue";
import { CategoryChartList } from "../CategoryChartList";

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 shadow-md rounded-md border border-gray-100">
                <p className="text-sm font-medium">{`${payload[0].name}`}</p>
                <p className="text-sm text-gray-600">{`Revenue: ${payload[0].value.toLocaleString()}`}</p>
            </div>
        );
    }
    return null;
};

export default function BrandShare({ secondaryCategoryRevenue }) {
    const [activeIndex, setActiveIndex] = useState(0);

    const data =
        secondaryCategoryRevenue?.brands?.map((item) => ({
            name: item.brand,
            value: parseFloat(item.total_revenue),
        })) ?? [];

    const onPieEnter = (_, index) => {
        setActiveIndex(index);
    };

    return (
        <Paper variant="outlined" className="min-w-0 rounded-xl! p-3! md:p-4!">
            <div className="flex flex-col gap-0 md:gap-1">
                <div className="text-lg md:text-xl font-semibold">Categories</div>
                <div className="text-xs md:text-sm text-third-300">Revenue Share by Product Categories</div>
            </div>
            <KitShow show={data?.length !== 0}>
                <div className="relative mx-auto size-72.5 @sm:size-85">
                    <ResponsiveContainer width="100%" height="100%" className="relative z-10">
                        <PieChart>
                            <Pie
                                cx="50%"
                                cy="50%"
                                dataKey="value"
                                innerRadius="42%"
                                outerRadius="70%"
                                fill="#8884d8"
                                paddingAngle={4}
                                data={data}
                                onMouseEnter={onPieEnter}
                                activeIndex={activeIndex}
                                cornerRadius={6}
                                activeShape={data.length === 1 ? undefined : renderActiveShape}
                            >
                                {data.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={COLORS[index % COLORS.length]}
                                        stroke={COLORS[index % COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="absolute inset-24 flex flex-col items-center justify-center rounded-full bg-white shadow-[0px_4px_20px_0px_#00000029] @sm:inset-28 dark:bg-gray-200">
                        <div className="text-xs text-center text-gray-500">Total Revenue</div>
                        <div className="text-base font-semibold dark:text-white">
                            {secondaryCategoryRevenue?.totalRevenue?.toLocaleString() || 0}
                        </div>
                    </div>
                </div>
            </KitShow>
            <KitShow show={data?.length === 0}>
                <div className="flex min-h-full justify-center items-center">
                    <p className="text-center font-medium text-gray-500 text-[16px]">No data</p>
                </div>
            </KitShow>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <CategoryChartList
                    data={(secondaryCategoryRevenue?.brands ?? []).map((item) => ({
                        name: item.brand,
                        value: item.total_revenue,
                        revenue_percentage: item.revenue_percentage,
                    }))}
                    colors={COLORS}
                    tooltipContent={(item, index) => (
                        <div className="flex flex-col gap-1 p-2 text-start text-black text-sm">
                            <strong>{item.name}</strong>
                            <div>Revenue: {formatPrice(item.value?.toLocaleString())}</div>
                        </div>
                    )}
                />
            </div>
        </Paper>
    );
}
