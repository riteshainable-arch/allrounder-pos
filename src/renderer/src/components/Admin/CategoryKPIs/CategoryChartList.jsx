import React from "react";
import { Box, Tooltip } from "@mui/material";
import { calculatePercentage } from "./CategoryRevenue";

export const CategoryChartList = ({
    data,
    colors,
    total,
    brandColorMap,
    tooltipContent = (item) => item.name,
}) => (
    <>
        {data.map((item, index) => {
            return (
                <Box key={item.name} className="flex flex-col">
                    <Box className="flex items-center gap-1">
                        <Tooltip title={tooltipContent(item, index)} arrow>
                            <Box
                                component="span"
                                className="me-2 h-2.5 w-3.5 shrink-0"
                                sx={{
                                    backgroundColor: brandColorMap
                                        ? brandColorMap[item.name] ||
                                          colors[(index + 6) % colors.length]
                                        : colors[index % colors.length],
                                }}
                            />
                        </Tooltip>

                        <span
                            className="max-w-30 truncate text-sm"
                            title={item.name}
                        >
                            {item.name}
                        </span>
                    </Box>

                    <p className="ms-6.5 text-sm font-medium">
                        {total
                            ? `${calculatePercentage(item.value, total)}%`
                            : `${item.revenue_percentage || 0}%`}
                    </p>
                </Box>
            );
        })}
    </>
);
