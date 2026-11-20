import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { Typography } from "@mui/material";
import KitDataGrid from "../../../../../../kit/components/KitDataGrid/KitDataGrid";
import { formatPrice } from "../../../../../../kit/utils/priceFormat";

function renderSparklineCell(value) {
    if (value === null || value === undefined || String(value).trim() === "") {
        return <span>-</span>;
    }

    const change = parseFloat(value);

    if (Number.isNaN(change)) {
        return <span>—</span>;
    }

    const isUp = change >= 0;

    return (
        <div className="flex items-center gap-1 text-sm">
            {isUp ? (
                <TrendingUpIcon fontSize="small" className="text-green-500" />
            ) : (
                <TrendingDownIcon fontSize="small" className="text-red-500" />
            )}

            <span className={isUp ? "text-green-500" : "text-red-500"}>{Math.abs(change).toFixed(1)}%</span>
        </div>
    );
}

export default function SecondaryCategoryTable({ secondaryCategoryRevenue }) {
    const columns = [
        {
            field: "brand",
            headerName: "Brand Name",
            minWidth: 160,
            flex: 1,
            renderCell: (params) => <Typography variant="body2">{params.row.brand ?? "—"}</Typography>,
        },
        {
            field: "no_of_products",
            headerName: "No. of Products",
            minWidth: 130,
            flex: 1,
            renderCell: (params) => <Typography variant="body2">{params.row.no_of_products ?? "—"}</Typography>,
        },
        {
            field: "total_qty",
            headerName: "Qty",
            minWidth: 100,
            flex: 0.8,
            renderCell: (params) => <Typography variant="body2">{params.row.total_qty ?? "—"}</Typography>,
        },
        {
            field: "total_revenue",
            headerName: "Revenue",
            minWidth: 140,
            flex: 1,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={500}>
                    ₹ {formatPrice(params.row.total_revenue)}
                </Typography>
            ),
        },
        {
            field: "month_on_month_growth",
            headerName: "Month on Month Volume Growth",
            minWidth: 220,
            flex: 1.5,
            renderCell: (params) => renderSparklineCell(params.row.month_on_month_growth),
        },
        {
            field: "no_of_customers",
            headerName: "No. of Customers",
            minWidth: 140,
            flex: 1,
            renderCell: (params) => <Typography variant="body2">{params.row.no_of_customers ?? "—"}</Typography>,
        },
        {
            field: "no_of_invoices",
            headerName: "No. of Invoices",
            minWidth: 130,
            flex: 1,
            renderCell: (params) => <Typography variant="body2">{params.row.no_of_invoices ?? "—"}</Typography>,
        },
    ];
    return (
        <>
            <KitDataGrid
                columns={columns}
                rows={secondaryCategoryRevenue ?? []}
                getRowId={(row) => `${row.id}`}
                rowCount={secondaryCategoryRevenue?.length ?? 0}
                paginationMode="client"
                loading={false}
                disableRowSelectionOnClick
            />
        </>
    );
}
