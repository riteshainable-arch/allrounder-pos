import { Alert, Divider, Grid, Paper, Skeleton, Typography } from "@mui/material";
import KitHeader from "../../../../../kit/components/KitHeader/KitHeader";
import { useEffect, useMemo, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import { useGetAllCompanies, useGetAllHealth, useGetAllSalesSummary } from "../../../../../kit/hooks/data/busy";
import { useNavigate } from "react-router-dom";
import { priceFormat } from "../../../../../kit/utils/priceFormat";
import KitSelect from "../../../../../kit/components/KitSelect";
import { periodOptions } from "../../../../../kit/configs/general";

export default function HealthCompanies() {
    const navigate = useNavigate();
    const refreshRef = useRef(null);
    const periodRef = useRef(null);
    const [period, setPeriod] = useState("monthly");

    const { HealthList, HealthListError, isHealthListLoading, refreshHealthList } = useGetAllHealth();
    const health = HealthList?.data;
    const connected = !!health?.connected;
    const { CompaniesList, isCompaniesListLoading, CompaniesListError } = useGetAllCompanies(connected);
    const { SalesSummaryList, SalesSummaryListError, isSalesSummaryListLoading } = useGetAllSalesSummary(
        connected && !!health?.company?.yearAllowed
    );
    const summary = SalesSummaryList?.data;
    const summaryRows = useMemo(() => {
        const rows = summary?.data?.[period];
        if (!Array.isArray(rows)) return [];
        return period === "daily" ? rows.filter((r) => Number(r.invoiceCount) > 0).slice(-31) : rows;
    }, [SalesSummaryList, period]);

    const columns = [
        {
            field: "companyCode",
            headerName: "Code",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => <Typography variant="body2">{params.row.companyCode ?? "-"}</Typography>,
        },
        {
            field: "name",
            headerName: "Name",
            minWidth: 200,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" className="truncate" title={params.row.name ?? ""}>
                    {params.row.name ?? "-"}
                </Typography>
            ),
        },
        {
            field: "gstNumber",
            headerName: "GSTIN",
            minWidth: 170,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={500}>
                    {params.row.gstNumber ?? "-"}
                </Typography>
            ),
        },
        {
            field: "allowedFinancialYears",
            headerName: "Financial years",
            minWidth: 170,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={500}>
                    {params.row.allowedFinancialYears?.join(", ") ?? "-"}
                </Typography>
            ),
        },
        {
            field: "busyStatus",
            headerName: "Status",
            minWidth: 170,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={500}>
                    {params.row.busyStatus || (params.row.enabled ? "Active" : "Disabled") || "-"}
                </Typography>
            ),
        },
    ];

    const salesSummaryColumns = [
        {
            field: "period",
            headerName: "Period",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => {
                const row = params.row;
                const period = row.date ?? row.monthNumber ?? row.quarterNumber ?? "-";
                return <Typography variant="body2">{String(period)}</Typography>;
            },
        },
        {
            field: "invoiceCount",
            headerName: "Invoices",
            minWidth: 180,
            flex: 1,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => <Typography variant="body2">{params.row.invoiceCount ?? "-"}</Typography>,
        },
        {
            field: "sales",
            headerName: "Sales",
            minWidth: 150,
            flex: 1,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <Typography variant="body2" fontWeight={500}>
                    {priceFormat(params?.row?.totalSalesAmount ?? 0)}
                </Typography>
            ),
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;
            e.preventDefault();

            switch (e.key.toLowerCase()) {
                case "r":
                    e.preventDefault();
                    refreshRef.current?.click();
                    break;

                case "p":
                    e.preventDefault();
                    periodRef.current?.focus();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            periodRef.current?.focus();
        }, 300);

        return () => clearTimeout(timer);
    }, []);

    const pcOnline = health?.device?.ok
        ? Boolean(health.device.data?.online ?? health.device.data?.connected ?? health.device.data?.isOnline ?? true)
        : health?.device
          ? false
          : null;

    const summaryCards = useMemo(
        () => [
            {
                title: "Server token",
                icon: "tabler:key",
                ok: health?.configured,
                hint: health?.configured ? `Token ${health.token}` : "BUSY_CLOUD_API_TOKEN not set on the server",
            },
            {
                title: "Cloud relay (ping)",
                icon: "tabler:cloud",
                ok: connected,
                hint: health?.ping?.error?.message || (connected ? health?.baseUrl : null),
            },
            {
                title: "BUSY PC",
                icon: "tabler:device-desktop",
                ok: pcOnline,
                hint: health?.device?.error?.message || (pcOnline ? "Online" : "Offline"),
            },
            {
                title: `Company ${health?.settings?.companyCode ?? ""}`,
                icon: "tabler:building-store",
                ok: !!health?.company && health.company.yearAllowed,
                hint: health?.company
                    ? health.company.yearAllowed
                        ? `${health.company.name || ""} · FY ${health.company.financialYear}`
                        : health.message
                    : health?.message,
            },
        ],
        [health, connected, pcOnline]
    );

    return (
        <div>
            <Divider className="mb-3!" />
            <div className="flex flex-col gap-3 w-full min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <KitHeader
                        title="Health & Companies"
                        subtitle="Live status of the AI Zeny cloud relay, the BUSY PC and the configured company."
                        icon="tabler:file-invoice"
                    />
                    <div className="relative">
                        <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                        <KitButton
                            ref={refreshRef}
                            size="small"
                            variant="contained"
                            className="w-auto"
                            onClick={() => refreshHealthList()}
                        >
                            Refresh
                        </KitButton>
                    </div>
                </div>

                <Grid container spacing={2}>
                    {isHealthListLoading ? (
                        Array.from({ length: 4 }).map((_, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
                                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Skeleton variant="circular" width={22} height={22} />
                                        <Skeleton variant="text" width="65%" height={24} />
                                    </div>
                                    <Skeleton variant="text" width="85%" height={18} />
                                </Paper>
                            </Grid>
                        ))
                    ) : HealthListError ? (
                        <Grid size={12}>
                            <Alert severity="error" variant="outlined">
                                {HealthListError?.message || "Unable to load BUSY health information."}
                            </Alert>
                        </Grid>
                    ) : (
                        summaryCards.map((card) => {
                            const color =
                                card.ok === null || card.ok === undefined
                                    ? "bg-gray-300"
                                    : card.ok
                                      ? "bg-green-500"
                                      : "bg-red-500";

                            return (
                                <Grid size={{ xs: 12, sm: 6, md: 3, lg: 3 }} key={card.title}>
                                    <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl h-full">
                                        <div className="flex items-center gap-2 mb-1">
                                            <KitIcon icon={card.icon} className="text-primary text-xl!" />
                                            <Typography className="text-lg! font-bold!">{card.title}</Typography>
                                            <span className={`ml-auto h-2.5 w-2.5 rounded-full ${color}`} />
                                        </div>
                                        {card.hint && (
                                            <Typography className="text-xs! text-third-500 mt-1!">
                                                {card.hint}
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            );
                        })
                    )}
                </Grid>

                {health && !health.settings?.enabled && (
                    <Alert severity="warning" variant="outlined" className="rounded-lg">
                        <Typography variant="body2">
                            Pushing to BUSY is switched off. Choose sale type, material centre and POS party, then
                            enable it in{" "}
                            <Typography
                                component="span"
                                variant="body2"
                                fontWeight={600}
                                sx={{
                                    textDecoration: "underline",
                                    cursor: "pointer",
                                }}
                                onClick={() => navigate("/busy/settings")}
                            >
                                Busy Settings
                            </Typography>
                            .
                        </Typography>
                    </Alert>
                )}

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} className="border border-gray-200 rounded-xl p-4 h-full!">
                            <Typography variant="subtitle1" className="font-semibold! mb-3!">
                                Companies on the BUSY PC
                            </Typography>

                            <KitDataGrid
                                columns={columns}
                                rows={CompaniesList?.data?.data ?? []}
                                getRowId={(row) => row.companyCode}
                                rowCount={CompaniesList?.data?.data?.length ?? 0}
                                paginationMode="client"
                                loading={isCompaniesListLoading}
                                error={!!CompaniesListError}
                                disableRowSelectionOnClick
                                className="h-auto!"
                            />
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Paper elevation={0} className="border border-gray-200 rounded-xl p-4 h-full!">
                            <div className="mb-3! flex justify-between items-center">
                                <Typography variant="subtitle1" className="font-semibold!">
                                    BUSY sales summary
                                </Typography>

                                <div className="relative w-48">
                                    <ShortcutBadge shortcut="Alt + P" className="-top-5" />
                                    <KitSelect
                                        ref={periodRef}
                                        placeholder="Select period"
                                        size="small"
                                        placeholderFontSize={14}
                                        inputFontSize={14}
                                        options={periodOptions}
                                        value={periodOptions.find((option) => option.value === period)}
                                        onChange={(option) => setPeriod(option?.value ?? "monthly")}
                                    />
                                </div>
                            </div>

                            <KitDataGrid
                                columns={salesSummaryColumns}
                                rows={summaryRows ?? []}
                                getRowId={(row) => `${period}-${row.date ?? row.monthNumber ?? row.quarterNumber}`}
                                rowCount={summaryRows?.length ?? 0}
                                paginationMode="client"
                                loading={isSalesSummaryListLoading}
                                error={!!SalesSummaryListError}
                                disableRowSelectionOnClick
                                className="h-auto!"
                            />
                        </Paper>
                    </Grid>
                </Grid>
            </div>
        </div>
    );
}
