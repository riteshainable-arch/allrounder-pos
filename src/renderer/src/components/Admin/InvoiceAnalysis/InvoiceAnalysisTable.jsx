"use client";

import { Typography } from "@mui/material";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { formatPrice } from "../../../../../kit/utils/priceFormat";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

function renderSparklineCell(value) {
    if (value === null || value === undefined || String(value).trim() === "") {
        return <Typography variant="body2">-</Typography>;
    }

    const change = parseFloat(value);

    if (!Number.isFinite(change)) {
        return <Typography variant="body2">-</Typography>;
    }

    const isUp = change >= 0;

    return (
        <div className="flex items-center gap-1">
            {isUp ? (
                <TrendingUpIcon fontSize="small" className="text-green-500" />
            ) : (
                <TrendingDownIcon fontSize="small" className="text-red-500" />
            )}

            <Typography variant="body2" className={isUp ? "text-green-500!" : "text-red-500!"}>
                {Math.abs(change).toFixed(1)}%
            </Typography>
        </div>
    );
}

export default function InvoiceAnalysisTable({ invoiceCategoryStatsList }) {
    const columns = [
        {
            field: "categories",
            headerName: "Invoice Categories",
            minWidth: 180,
            flex: 1.2,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={500}>
                    {params.row.categories ?? "—"}
                </Typography>
            ),
        },
        {
            field: "averageInvoiceValue",
            headerName: "Avg. Order Value",
            minWidth: 140,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2">
                    {params.row.averageInvoiceValue != null ? parseInt(params.row.averageInvoiceValue, 10) : "—"}
                </Typography>
            ),
        },
        {
            field: "monthOnMonthGrowth",
            headerName: "Month on Month Volume Growth",
            minWidth: 220,
            flex: 1.5,
            renderCell: (params) => renderSparklineCell(params.row.monthOnMonthGrowth),
        },
        {
            field: "noOfCustomers",
            headerName: "No. of Customers",
            minWidth: 140,
            flex: 1,
            renderCell: (params) => <Typography variant="body2">{params.row.noOfCustomers ?? "—"}</Typography>,
        },
        {
            field: "noOfInvoices",
            headerName: "No. of Invoices",
            minWidth: 130,
            flex: 1,
            renderCell: (params) => <Typography variant="body2">{params.row.noOfInvoices ?? "—"}</Typography>,
        },
        {
            field: "totalRevenue",
            headerName: "Total Revenue",
            minWidth: 150,
            flex: 1,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={500}>
                    ₹ {formatPrice(params.row.totalRevenue)}
                </Typography>
            ),
        },
    ];

    return (
        <KitDataGrid
            columns={columns}
            rows={invoiceCategoryStatsList ?? []}
            getRowId={(row) => `${row.id}`}
            rowCount={invoiceCategoryStatsList?.length ?? 0}
            paginationMode="client"
            loading={false}
            disableRowSelectionOnClick
        />
    );
}
