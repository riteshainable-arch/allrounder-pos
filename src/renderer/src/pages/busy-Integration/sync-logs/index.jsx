import { Divider, Grid, IconButton, Paper, Typography } from "@mui/material";
import KitHeader from "../../../../../kit/components/KitHeader/KitHeader";
import { useEffect, useMemo, useRef, useState } from "react";
import ShortcutBadge from "../../../components/Dashboard/ShortcutBadge";
import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import KitDataGrid from "../../../../../kit/components/KitDataGrid/KitDataGrid";
import { priceFormat } from "../../../../../kit/utils/priceFormat";
import KitTextField from "../../../../../kit/components/KitTextField/KitTextField";
import { format } from "date-fns";
import { useGetAllSyncLogs } from "../../../../../kit/hooks/data/busy";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import KitShow from "../../../../../kit/components/KitShow/KitShow";
import KitSelect from "../../../../../kit/components/KitSelect";
import { entityTypeOptions, syncStatusOptions } from "../../../../../kit/configs/general";
import { SyncBadge } from "../../../../../kit/utils/syncBadge";
import SyncLogViewModal from "../../../components/BuyIntegration/SyncLog/SyncLogViewModal";

export const entityLabels = {
    sales_invoice: "Sales Invoice",
    sales_invoice_import: "Bill Import",
    sales_return: "Sales Return",
    sales_return_import: "Sales Return Import",
    sales_order: "Sales Order",
    product: "Item",
    account: "Customer",
};

export default function SyncLogs() {
    const nameRef = useRef(null);
    const refreshRef = useRef(null);
    const statusRef = useRef(null);
    const entityTypeRef = useRef(null);

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState("");
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState();
    const [status, setStatus] = useState("");
    const [entityType, setEntityType] = useState("");
    const [activeRowIndex, setActiveRowIndex] = useState(0);

    const query = {
        page,
        size: pageSize,
        ...(search && { search: search }),
        ...(status && { status: status }),
        ...(entityType && { entityType: entityType }),
    };
    const { SyncLogsList, isSyncLogsListLoading, SyncLogsListError, refreshSyncLogsList } = useGetAllSyncLogs(query);

    const toggleViewModal = () => setShowViewModal(!showViewModal);

    const handleView = (data) => {
        setSelectedItem(data);
        toggleViewModal();
    };

    const columns = [
        {
            field: "createdAt",
            headerName: "When",
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="caption">
                    {params.row.createdAt ? format(params.row.createdAt, "yyyy-MM-dd hh:mm aa") : "—"}
                </Typography>
            ),
        },
        {
            field: "entityType",
            headerName: "Entity Type",
            minWidth: 190,
            flex: 1.1,
            renderCell: (params) => (
                <div className="flex flex-col justify-center leading-tight">
                    <Typography variant="body2" fontWeight={600}>
                        {entityLabels[params.row.entityType] ?? params.row.entityType ?? "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.direction === "pull" ? "BUSY → CRM" : "CRM → BUSY"}
                    </Typography>
                </div>
            ),
        },
        {
            field: "localRef",
            headerName: "CRM Reference",
            minWidth: 150,
            flex: 0.9,
            renderCell: (params) => (
                <div className="flex flex-col justify-center leading-tight">
                    <Typography variant="body2" fontWeight={500}>
                        {params.row.localRef ?? "—"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.localDate ?? ""}
                    </Typography>
                </div>
            ),
        },
        {
            field: "busyNumber",
            headerName: "BUSY",
            minWidth: 150,
            flex: 0.9,
            renderCell: (params) => (
                <div className="flex flex-col justify-center items-start leading-tight">
                    <Typography variant="body2">{params.row.busyNumber ?? params.row.busyId ?? "—"}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {params.row.companyCode ?? ""}
                    </Typography>
                </div>
            ),
        },
        {
            field: "amount",
            headerName: "Amount",
            minWidth: 140,
            flex: 0.8,
            align: "right",
            headerAlign: "right",
            renderCell: (params) => (
                <div className="flex flex-col justify-center items-end leading-tight">
                    <Typography variant="body2" fontWeight={600}>
                        {params.row.amount != null ? priceFormat(params.row.amount) : "—"}
                    </Typography>
                    {params.row.busyAmount != null && (
                        <Typography variant="caption" color="text.secondary">
                            BUSY {priceFormat(params.row.busyAmount)}
                        </Typography>
                    )}
                </div>
            ),
        },
        {
            field: "status",
            headerName: "Status",
            minWidth: 130,
            flex: 0.8,
            renderCell: (params) => <SyncBadge status={params.row.status} />,
        },
        {
            field: "errorMessage",
            headerName: "Message",
            minWidth: 400,
            flex: 1.5,
            renderCell: (params) => (
                <div className="flex flex-col justify-center items-start leading-tight min-w-0 w-full">
                    {params.row.errorCode && (
                        <Typography variant="caption" color="text.secondary">
                            {params.row.errorCode}
                        </Typography>
                    )}

                    <Typography variant="body2" className="truncate w-full" title={params.row.errorMessage ?? ""}>
                        {params.row.errorMessage || "—"}
                    </Typography>
                </div>
            ),
        },
        {
            field: "actions",
            headerName: "Actions",
            minWidth: 100,
            sortable: false,
            filterable: false,
            align: "center",
            headerAlign: "center",
            renderCell: (params) => (
                <KitButton size="small" variant="outlined" className="w-auto!" onClick={() => handleView(params.row)}>
                    Details
                </KitButton>
            ),
        },
    ];

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "n":
                    nameRef.current?.focus();
                    break;
                case "a":
                    e.preventDefault();
                    statusRef.current?.focus();
                    break;
                case "e":
                    entityTypeRef.current?.focus();
                    return;
                case "r":
                    refreshRef.current?.click();
                    break;
                default:
                    return;
            }

            e.preventDefault();
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const dataRows = SyncLogsList?.data?.items ?? [];

    useEffect(() => {
        const handleKeyDown = (e) => {
            const target = e.target;

            if (
                target instanceof HTMLElement &&
                (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
            ) {
                return;
            }

            if (!dataRows.length) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveRowIndex((prev) => Math.min(prev + 1, dataRows.length - 1));
                return;
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveRowIndex((prev) => Math.max(prev - 1, 0));
                return;
            }

            if (e.key === "Enter" || (e.shiftKey && e.key.toLowerCase() === "v")) {
                e.preventDefault();
                const row = dataRows[activeRowIndex];
                if (row) {
                    handleView(row);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [dataRows, activeRowIndex, handleView]);

    useEffect(() => {
        setActiveRowIndex(0);
    }, [page, pageSize, search, entityType, status]);

    const summary = SyncLogsList?.data?.summary ?? {};

    const summaryCards = useMemo(
        () => [
            {
                title: "Verified",
                value: summary.verified ?? 0,
                icon: "tabler:shield-check",
            },
            {
                title: "In BUSY",
                value: summary.success ?? 0,
                icon: "tabler:cloud-check",
            },
            {
                title: "Unconfirmed",
                value: summary.uncertain ?? 0,
                icon: "tabler:alert-circle",
            },
            {
                title: "Failed",
                value: summary.failed ?? 0,
                icon: "tabler:alert-triangle",
            },
            {
                title: "Pending",
                value: summary.pending ?? 0,
                icon: "tabler:clock",
            },
        ],
        [SyncLogsList, summary]
    );

    return (
        <div>
            <Divider className="mb-3!" />
            <div className="flex flex-col gap-3 w-full min-w-0">
                <KitHeader
                    title="Sync Logs"
                    subtitle="Every write to BUSY and every import from BUSY, with BUSY's own answer."
                    icon="tabler:file-invoice"
                    count={SyncLogsList?.data?.totalItems ?? 0}
                    countLabel="records"
                />

                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                    <div className="flex flex-wrap items-end gap-x-3 gap-y-7">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + N" className="top-0" />
                            <KitTextField
                                inputRef={nameRef}
                                size="small"
                                height="32px"
                                label="Search"
                                placeholderFontSize={14}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Bill / SO / item / BUSY no."
                                className="w-48"
                            />
                        </div>
                        <div className="relative w-60">
                            <ShortcutBadge shortcut="Alt + E" className="top-0" />
                            <KitSelect
                                ref={entityTypeRef}
                                label="Entity Type"
                                placeholder="Select Entity Type"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={entityTypeOptions}
                                value={
                                    entityTypeOptions.find((option) => String(option.value) === String(entityType)) ??
                                    ""
                                }
                                onChange={(option) => setEntityType(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative w-60">
                            <ShortcutBadge shortcut="Alt + A" className="top-0" />
                            <KitSelect
                                ref={statusRef}
                                label="Status"
                                placeholder="Select Status"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={syncStatusOptions}
                                value={
                                    syncStatusOptions.find((option) => String(option.value) === String(status)) ?? ""
                                }
                                onChange={(option) => setStatus(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                            <IconButton
                                ref={refreshRef}
                                onClick={() => refreshSyncLogsList()}
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                <Grid container spacing={2}>
                    {summaryCards.map((card) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }} key={card.title}>
                            <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl h-full">
                                <div className="flex items-center gap-2 mb-1">
                                    <KitIcon icon={card.icon} className="text-primary text-xl!" />
                                    <Typography className="text-lg! font-bold!">{card.value}</Typography>
                                </div>
                                <Typography className="text-sm! text-third-500">{card.title}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                <KitDataGrid
                    columns={columns}
                    rows={SyncLogsList?.data?.items ?? []}
                    getRowId={(row) => row.id}
                    rowCount={SyncLogsList?.data?.totalItems ?? 0}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    rowHeight={58}
                    isLoading={isSyncLogsListLoading}
                    error={!!SyncLogsListError}
                    getRowClassName={(params) =>
                        dataRows[activeRowIndex]?.id === params.id ? "keyboard-active-row" : ""
                    }
                    disableRowSelectionOnClick
                />
            </div>

            <KitShow show={showViewModal}>
                <SyncLogViewModal open={showViewModal} onClose={toggleViewModal} selectedItem={selectedItem} />
            </KitShow>
        </div>
    );
}
