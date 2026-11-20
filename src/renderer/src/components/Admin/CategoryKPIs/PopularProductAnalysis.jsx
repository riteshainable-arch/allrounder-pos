"use client";

import { useState, useRef, useEffect } from "react";
import { Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Paper } from "@mui/material";
import { formatPrice } from "../../../../../kit/utils/priceFormat";
import { encodeCategoryKpiSlug } from "../../../../../kit/utils/categoryKpiSlug";
import { PopularProductAnalysisTooltip } from "./PopularProductAnalysisTooltip";
import { useNavigate } from "react-router-dom";

export default function PopularProductAnalysis({ categoryPopularList, queryParams }) {
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const [containerWidth, setContainerWidth] = useState(0);

    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        updateWidth();
        window.addEventListener("resize", updateWidth);

        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    const handleLabelClick = (label) => {
        const slug = encodeCategoryKpiSlug(label);
        const queryParamString = new URLSearchParams(queryParams).toString();
        navigate(`/category-kpis/${slug}?${queryParamString}`);
    };

    const truncateText = (text) => {
        if (!containerWidth) return text;

        const charLimit = containerWidth < 500 ? 5 : containerWidth < 768 ? 8 : containerWidth < 1024 ? 12 : 15;

        return text.length > charLimit ? `${text.substring(0, charLimit)}...` : text;
    };

    const maxRevenue = Math.max(...categoryPopularList.map((d) => Number(d.total_revenue) || 0));
    const step = Math.ceil(maxRevenue / 5 / 100) * 100 || 100;
    const ticks = Array.from({ length: 6 }, (_, i) => i * step);

    return (
        <Paper variant="outlined" className="min-w-0 rounded-xl! p-3! md:p-4!">
            <div className="flex flex-col items-start md:items-center justify-between gap-2 md:flex-row">
                <div className="text-base md:text-xl font-semibold">Top 10 Popular Product Categories</div>
            </div>
            <div ref={containerRef} className="custom-scrollbar overflow-x-auto scroll-smooth">
                <div className="h-80 pt-6 @lg:pt-8 lg:h-96 3xl:h-[25rem]">
                    <ResponsiveContainer width="100%" height="100%" minWidth={800}>
                        <ComposedChart
                            data={categoryPopularList}
                            margin={{ left: 5, right: 0, top: 20, bottom: 0 }}
                            className="[&_.recharts-tooltip-cursor]:fill-opacity-20 dark:[&_.recharts-tooltip-cursor]:fill-opacity-10 [&_.recharts-cartesian-axis-tick-value]:fill-gray-500 [&_.recharts-cartesian-axis.yAxis]:-translate-y-3 rtl:[&_.recharts-cartesian-axis.yAxis]:-translate-x-12"
                        >
                            <CartesianGrid vertical={false} strokeOpacity={0.435} />
                            <XAxis
                                dataKey="categories"
                                angle={-90}
                                tick={({ x, y, payload }) => {
                                    const truncatedText = truncateText(payload.value);
                                    return (
                                        <text
                                            x={x}
                                            y={y + 10}
                                            textAnchor="middle"
                                            onClick={() => handleLabelClick(payload.value)}
                                            style={{
                                                cursor: "pointer",
                                                fontSize: containerWidth < 768 ? 10 : 12,
                                            }}
                                        >
                                            <title>{payload.value}</title>
                                            {truncatedText}
                                        </text>
                                    );
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
                                domain={[0, step * 5]}
                                ticks={ticks}
                                tick={{ fontSize: 12, fill: "#6B7280" }}
                                tickFormatter={formatPrice}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip content={<PopularProductAnalysisTooltip />} />

                            <defs>
                                <linearGradient
                                    id="total_revenue"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="100%"
                                    gradientUnits="userSpaceOnUse"
                                >
                                    <stop offset="0" stopColor="#3562FC" />
                                    <stop offset="0.8" stopColor="#3562FC" />
                                    <stop offset="1" stopColor="#3562FC" />
                                </linearGradient>
                            </defs>

                            <Bar
                                dataKey="total_revenue"
                                fill="url(#total_revenue)"
                                stroke="#3562FC"
                                barSize={14}
                                radius={[4, 4, 0, 0]}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </Paper>
    );
}
