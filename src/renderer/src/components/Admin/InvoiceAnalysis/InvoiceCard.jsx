import { Box, CircularProgress, Paper, Typography } from "@mui/material";
import KitShow from "../../../../../kit/components/KitShow/KitShow";

export default function InvoiceCard({ invoiceRevenueList }) {
    const invoiceData = invoiceRevenueList?.data ?? [];

    const filteredData = invoiceData.filter((stat) => stat.classifiedCategory && stat.classifiedCategory.trim() !== "");

    return (
        <>
            <KitShow show={filteredData.length > 0}>
                <Box className="grid grid-cols-2 gap-2 md:gap-4 md:grid-cols-3 2xl:grid-cols-2">
                    {filteredData.map((stat, index) => {
                        const percentage = Math.min(100, Math.max(0, Number(stat.revenuePercentage) || 0));

                        return (
                            <Paper
                                key={index}
                                variant="outlined"
                                className="flex flex-col items-center justify-center rounded-2xl! px-6! py-4! text-center"
                            >
                                <Box className="relative flex items-center justify-center">
                                    <CircularProgress
                                        variant="determinate"
                                        value={100}
                                        size={80}
                                        thickness={4}
                                        sx={{ color: "#E5E7EB", position: "absolute" }}
                                    />

                                    <CircularProgress
                                        variant="determinate"
                                        value={percentage}
                                        size={80}
                                        thickness={4}
                                        sx={{ color: "#3872FA" }}
                                    />

                                    <Typography
                                        variant="body1"
                                        className="absolute! font-bold!"
                                        sx={{ color: "text.primary" }}
                                    >
                                        {stat.revenuePercentage}%
                                    </Typography>
                                </Box>

                                <Typography variant="h5" className="mt-4! font-bold!" sx={{ color: "text.primary" }}>
                                    {parseFloat(stat.category_qty)?.toFixed(2).replace(/\.00$/, "")}
                                </Typography>

                                <Typography variant="caption" color="text.secondary">
                                    {stat.classifiedCategory}
                                </Typography>
                            </Paper>
                        );
                    })}
                </Box>
            </KitShow>

            <KitShow show={invoiceData.length === 0 || filteredData.length === 0}>
                <Paper variant="outlined" className="flex h-full items-center justify-center rounded-2xl! p-4!">
                    <Typography variant="body2" color="text.secondary">
                        No invoice data available for the selected date range.
                    </Typography>
                </Paper>
            </KitShow>
        </>
    );
}
