import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Backdrop,
    Chip,
    CircularProgress,
    ClickAwayListener,
    Drawer,
    IconButton,
    Paper,
    Popper,
    Tab,
    Tabs,
    Tooltip,
    Typography,
} from "@mui/material";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitMuiTable from "../../../../kit/components/KitMuiTable";
import KitSelect from "../../../../kit/components/KitSelect";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import {
    useAdvanceSlips,
    useAdvancePendingCount,
    useApproveAdvanceSlip,
    useRejectAdvanceSlip,
    fetchAdvanceSlips,
} from "../../../../kit/hooks/data/cashierAdvance";
import { useUsersDropdown } from "../../../../kit/hooks/data/users";
import { parseApiList, buildUserLabel } from "../../../../kit/utils/parseApiList";
import { getPersonDisplayName } from "../../../../kit/utils/invoiceBill";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import AdvanceSlipPrintLayout from "../advanceSlip/AdvanceSlipPrintLayout";
import { toast } from "react-toastify";
import ShortcutBadge from "../Dashboard/ShortcutBadge";
import KitDataGrid from "../../../../kit/components/KitDataGrid/KitDataGrid";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import ManagerSlipDrawer from "./ManagerSlipDrawer";
import { EXPORT_LIMIT } from "../../../../kit/configs/general";
import { downloadCsv, downloadXlsx } from "../../../../kit/utils/exportFile";
import useKeyboardShortcuts from "../../../../kit/hooks/useKeyboardShortcuts";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";

export const STATUS_COLORS = {
    pending: "warning",
    approved: "success",
    rejected: "error",
    cancelled: "default",
};

export default function ManagerAdvanceSlipsPanel() {
    const printRef = useRef(null);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const managerRemarkInputRef = useRef(null);
    const approveButtonRefs = useRef({});
    const rejectButtonRefs = useRef({});

    const today = format(new Date(), "yyyy-MM-dd");

    const [view, setView] = useState("pending");
    const [cashierId, setCashierId] = useState("");
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [detailSlip, setDetailSlip] = useState(null);
    const [approveSlip, setApproveSlip] = useState(null);
    const [rejectSlip, setRejectSlip] = useState(null);
    const [managerRemark, setManagerRemark] = useState("");
    const [rejectedReason, setRejectedReason] = useState("");
    const [printSlip, setPrintSlip] = useState(null);
    const [activeRowIndex, setActiveRowIndex] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [anchorEl, setAnchorEl] = useState(null);
    const [showSlipDrawer, setShowSlipDrawer] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const { pendingCount, refreshPendingCount } = useAdvancePendingCount({}, true);

    const queryParams = {
        page: page,
        limit: pageSize,
        ...(cashierId && { cashierId: cashierId }),
        ...(startDate && { startDate: startDate }),
        ...(endDate && { endDate: endDate }),
        ...(view === "pending" && { assignedToMe: true }),
        ...(view === "pending" && { status: "pending" }),
        ...(view !== "pending" && { status: "approved,rejected,cancelled" }),
    }

    const { advanceSlips, isAdvanceSlipsLoading, advanceSlipsError, refreshAdvanceSlips } = useAdvanceSlips(queryParams);
    const { usersDropdown } = useUsersDropdown({ role: "cashier" });
    const { approveAdvanceSlip, isApprovingAdvanceSlip } = useApproveAdvanceSlip();
    const { rejectAdvanceSlip, isRejectingAdvanceSlip } = useRejectAdvanceSlip();

    const cashierOptions = useMemo(() => {
        const users = parseApiList(usersDropdown);
        return [
            { label: "All Cashiers", value: "" },
            ...users.map((user) => ({
                label: buildUserLabel(user),
                value: user.id,
            })),
        ];
    }, [usersDropdown]);

    const toggleSlipDrawer = () => setShowSlipDrawer(!showSlipDrawer);

    const handleDetailSlip = (item) => {
        setDetailSlip(item);
        toggleSlipDrawer();
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Advance Slip",
    });

    const refreshAll = useCallback(() => {
        refreshAdvanceSlips();
        refreshPendingCount();
    }, [refreshAdvanceSlips, refreshPendingCount]);

    const handleApprove = async () => {
        if (!approveSlip) return;
        try {
            await approveAdvanceSlip({
                id: approveSlip.id,
                body: { managerRemark: managerRemark.trim() || undefined },
            });
            toast.success(`Slip ${approveSlip.slipNumber} approved.`);
            setApproveSlip(null);
            setAnchorEl(null);
            setManagerRemark("");
            refreshAll();
        } catch (error) {
            toast.error(error?.message || "Unable to approve slip.");
        }
    };

    const handleReject = async () => {
        if (!rejectSlip) return;
        if (!rejectedReason.trim()) {
            toast.warning("Rejection reason is required.");
            return;
        }
        try {
            await rejectAdvanceSlip({
                id: rejectSlip.id,
                body: {
                    rejectedReason: rejectedReason.trim(),
                    managerRemark: managerRemark.trim() || undefined,
                },
            });
            toast.success(`Slip ${rejectSlip.slipNumber} rejected.`);
            setRejectSlip(null);
            setAnchorEl(null);
            setRejectedReason("");
            setManagerRemark("");
            refreshAll();
        } catch (error) {
            toast.error(error?.message || "Unable to reject slip.");
        }
    };

    const columns = [
        {
            field: 'slipNumber',
            headerName: 'Slip No',
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params?.row?.slipNumber ?? "-"}
                </Typography>
            )
        },
        {
            field: 'slipDate',
            headerName: 'Date',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params?.row?.slipDate ?? "-"}
                </Typography>
            )
        },
        {
            field: 'timeOfDay',
            headerName: 'Time',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params.row.timeOfDay ?? '-'}
                </Typography>
            )
        },
        {
            field: 'cashier',
            headerName: 'Cashier',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {getPersonDisplayName(params.row.cashier)}
                </Typography>
            )
        },
        {
            field: 'amount',
            headerName: 'Amount',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {priceFormat(params.row.amount)}
                </Typography>
            )
        },
        ...(view !== "pending"
            ? [
                {
                    field: "status",
                    headerName: "Status",
                    minWidth: 150,
                    flex: 1,
                    renderCell: (params) => (
                        <Chip
                            size="small"
                            label={params.row.status}
                            color={STATUS_COLORS[params.row.status] || "default"}
                            variant="outlined"
                        />
                    ),
                },
            ]
            : []),
        {
            field: "actions",
            headerName: "Action",
            minWidth: 300,
            renderHeader: () => (
                <div className="flex flex-col gap-1 text-start">
                    <span>Actions</span>
                    <div className="flex items-center gap-6">
                        <span className="rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-700 h-[16px]!">
                            Shift + V
                        </span>
                        {view === "pending" && (
                            <div className="flex items-center gap-6">
                                <span className="rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-700 h-[16px]!">
                                    Shift + A
                                </span>
                                <span className="rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-700 h-[16px]!">
                                    Shift + R
                                </span>
                            </div>
                        )}
                        {view !== "pending" && (
                            <span className="rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-700 h-[16px]!">
                                Shift + P
                            </span>
                        )}
                    </div>
                </div >
            ),
            renderCell: (params) => (
                <div className="flex item-center gap-2">
                    <KitButton
                        size="small"
                        variant="contained"
                        className="w-auto!"
                        onClick={() => handleDetailSlip(params?.row)}
                    >
                        View
                    </KitButton>
                    {view === "pending" && (
                        <>
                            <KitButton
                                ref={(el) => {
                                    if (el) {
                                        approveButtonRefs.current[params.row.id] = el;
                                    }
                                }}
                                size="small"
                                variant="contained"
                                className="w-auto!"
                                color="success"
                                onClick={(e) => {
                                    setAnchorEl(e.currentTarget);
                                    setApproveSlip(params.row);
                                    setManagerRemark("");
                                }}
                            >
                                Approve
                            </KitButton>
                            <KitButton
                                ref={(el) => {
                                    if (el) {
                                        rejectButtonRefs.current[params.row.id] = el;
                                    }
                                }}
                                size="small"
                                variant="contained"
                                className="w-auto!"
                                color="error"
                                onClick={(e) => {
                                    setAnchorEl(e.currentTarget);
                                    setRejectSlip(params.row);
                                    setRejectedReason("");
                                    setManagerRemark("");
                                }}
                            >
                                Reject
                            </KitButton>
                        </>
                    )}
                    {params?.row?.status === "approved" && (
                        <KitButton
                            size="small"
                            variant="contained"
                            className="w-auto!"
                            onClick={() => {
                                setPrintSlip(params.row);
                                setTimeout(() => handlePrint(), 100);
                            }}
                        >
                            Print
                        </KitButton>
                    )}
                </div>
            ),
        },
    ];

    const getExportParams = {
        page: page,
        limit: EXPORT_LIMIT,
        ...(cashierId && { cashierId: cashierId }),
        ...(startDate && { startDate: startDate }),
        ...(endDate && { endDate: endDate }),
        ...(view === "pending" && { assignedToMe: true }),
        ...(view === "pending" && { status: "pending" }),
        ...(view !== "pending" && { status: "approved,rejected,cancelled" }),
    };

    const handleExport = async (type) => {
        if (!advanceSlips?.data?.slips?.length > 0) {
            toast.warning("No data available to export.");
            return;
        }

        setIsExporting(true);

        try {
            const response = await fetchAdvanceSlips(getExportParams);
            const bills = response?.data?.slips || [];

            const exportRows = bills.slice(0, EXPORT_LIMIT).map((bill) => ({
                "Slip No": bill.slipNumber || "-",
                Date: bill.slipDate || "-",
                Time: bill.timeOfDay || "-",
                Cashier: getPersonDisplayName(bill.cashier),
                Amount: priceFormat(bill.amount),
                ...(view !== "pending" && {
                    Status: bill.status ?? "-",
                }),
            }));

            if (!exportRows.length) return;

            const timestamp = format(new Date(), "yyyyMMdd_HHmmss");

            if (type === "csv") {
                downloadCsv(exportRows, `advance_slips_${timestamp}.csv`);
            } else {
                downloadXlsx(exportRows, `advance_slips_${timestamp}.xlsx`, "Advance Slips");
            }
        } catch (error) {
            toast.error(error?.message || "Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    const isLoading = isAdvanceSlipsLoading || isApprovingAdvanceSlip || isRejectingAdvanceSlip;

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.shiftKey) {
                switch (e.key) {
                    case "!":
                        e.preventDefault();
                        setView("pending");
                        break;

                    case "@":
                        e.preventDefault();
                        setView("all");
                        break;

                    default:
                        break;
                }
            }

            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case "s":
                        e.preventDefault();
                        startDateRef.current?.focus();
                        break;

                    case "e":
                        e.preventDefault();
                        endDateRef.current?.focus();
                        break;

                    case "r":
                        e.preventDefault();
                        refreshPendingCount();
                        break;

                    default:
                        break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const activeRow = advanceSlips?.data?.slips?.[activeRowIndex];

    useEffect(() => {
        const rows = advanceSlips?.data?.slips ?? [];

        const handleKeyDown = (e) => {
            if (!rows.length) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setActiveRowIndex((prev) => Math.min(prev + 1, rows.length - 1));
                    break;

                case "ArrowUp":
                    e.preventDefault();
                    setActiveRowIndex((prev) => Math.max(prev - 1, 0));
                    break;
            }

            if (e.shiftKey) {
                switch (e.key.toLowerCase()) {
                    case "v":
                        e.preventDefault();
                        if (activeRow) {
                            handleDetailSlip(activeRow);
                        }
                        break;

                    case "a":
                        e.preventDefault();
                        if (activeRow.status === "pending") {
                            setAnchorEl(approveButtonRefs.current[activeRow.id]);
                            setApproveSlip(activeRow);
                            setManagerRemark("");
                        }
                        break;

                    case "r":
                        e.preventDefault();
                        if (activeRow?.status === "pending") {
                            setAnchorEl(rejectButtonRefs.current[activeRow.id]);
                            setRejectSlip(activeRow);
                            setRejectedReason("");
                            setManagerRemark("");
                        }
                        break;

                    case "p":
                        e.preventDefault();
                        if (activeRow?.status === "approved") {
                            setPrintSlip(activeRow);
                            requestAnimationFrame(() => {
                                handlePrint();
                            });
                        }
                        break;

                    default:
                        break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [advanceSlips, activeRowIndex]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (approveSlip) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    handleApprove();
                }

                if (e.key === "Escape") {
                    e.preventDefault();
                    setApproveSlip(null);
                    setAnchorEl(null);
                    setManagerRemark("");
                }

                return;
            }

            if (rejectSlip) {
                if (e.key === "Enter") {
                    e.preventDefault();
                    handleReject();
                }

                if (e.key === "Escape") {
                    e.preventDefault();
                    setRejectSlip(null);
                    setAnchorEl(null);
                    setRejectedReason("");
                    setManagerRemark("");
                }

                return;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [approveSlip, rejectSlip, managerRemark, rejectedReason]);

    useEffect(() => {
        if (advanceSlips?.data?.slips?.length) {
            setActiveRowIndex(0);
        }
    }, [advanceSlips]);

    useEffect(() => {
        if (approveSlip && anchorEl) {
            requestAnimationFrame(() => {
                managerRemarkInputRef.current?.focus();
            });
        }
    }, [approveSlip, anchorEl]);

    useKeyboardShortcuts({
        handleExportCsv: () => handleExport("csv"),
        handleExportXlsx: () => handleExport("xlsx"),
    });

    return (
        <>
            <Backdrop open={isLoading || isExporting} sx={{ zIndex: 9999, color: "#fff" }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <Tabs value={view} onChange={(_, value) => { setView(value); setPage(1); }}>
                        <Tab
                            value="pending"
                            className="pt-6!"
                            label={
                                <span className="relative flex items-center gap-2">
                                    Pending Queue
                                    {pendingCount > 0 && (
                                        <Chip size="small" color="error" label={pendingCount} />
                                    )}
                                    <ShortcutBadge shortcut="Shift + 1" className="left-0! w-fit!" />
                                </span>
                            }
                        />
                        <Tab
                            value="all"
                            className="pt-6!"
                            label={
                                <div className="relative">
                                    <span>All Slips (Audit)</span>
                                    <ShortcutBadge shortcut="Shift + 2" className="left-0! w-fit!" />
                                </div>
                            }
                        />
                    </Tabs>
                    {view === "all" && advanceSlips?.data?.byStatus?.approved && (
                        <Typography className="text-sm! font-semibold! text-green-700">
                            Approved total: {priceFormat(advanceSlips?.data?.byStatus?.approved?.totalAmount || 0)}
                        </Typography>
                    )}
                </div>

                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl bg-white">
                    <div className="flex flex-wrap gap-3 items-end">
                        {view === "all" && (
                            <div className="w-52">
                                <KitSelect
                                    label="Cashier"
                                    size="small"
                                    options={cashierOptions}
                                    value={
                                        cashierOptions.find((o) => String(o.value) === String(cashierId)) ??
                                        cashierOptions[0]
                                    }
                                    onChange={(option) => setCashierId(option?.value ?? "")}
                                />
                            </div>
                        )}
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + S" className="top-0" />
                            <KitTextField
                                inputRef={startDateRef}
                                size="small"
                                type="date"
                                label="Start"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + E" className="top-0" />
                            <KitTextField
                                inputRef={endDateRef}
                                size="small"
                                type="date"
                                label="End"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-40"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Shift + C" className="-top-5!" />
                            <KitButton
                                size="small"
                                variant="contained"
                                className="w-auto"
                                onClick={() => handleExport("csv")}
                            >
                                Export as CSV
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Shift + X" className="-top-5!" />
                            <KitButton
                                size="small"
                                variant="contained"
                                className="w-auto"
                                onClick={() => handleExport("xlsx")}
                            >
                                Export as XLSX
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + R" className="-top-5" />
                            <IconButton
                                className="w-10.5! h-7.5! rounded-sm! min-w-fit! p-1! border! border-blue-600!"
                                onClick={() => refreshAll()}
                            >
                                <KitIcon icon="tabler:refresh" className="text-xl! text-primary" />
                            </IconButton>
                        </div>
                    </div>
                </Paper>

                <KitDataGrid
                    columns={columns}
                    rows={advanceSlips?.data?.slips ?? []}
                    getRowId={(row) => row?.id}
                    rowCount={advanceSlips?.data?.pagination?.totalItems}
                    pageSize={pageSize}
                    setPage={setPage}
                    setPageSize={setPageSize}
                    isLoading={isAdvanceSlipsLoading}
                    error={!!advanceSlipsError}
                    disableRowSelectionOnClick
                    getRowClassName={(params) =>
                        params.indexRelativeToCurrentPage === activeRowIndex
                            ? "active-row"
                            : ""
                    }
                    sx={(theme) => ({
                        "& .active-row": {
                            backgroundColor: `${theme.palette.customColors.activeBackground} !important`,
                        },
                        "& .active-row:hover": {
                            backgroundColor: `${theme.palette.customColors.activeBackground} !important`,
                        },
                    })}
                />
            </div>

            {approveSlip && (
                <ClickAwayListener
                    onClickAway={() => {
                        setApproveSlip(null);
                        setAnchorEl(null);
                    }}
                >
                    <Popper
                        open={Boolean(anchorEl)}
                        anchorEl={anchorEl}
                        placement="top"
                    >
                        <Paper className="fixed bottom-4 right-4 z-50 p-4 border shadow-lg w-96">
                            <Typography className="font-semibold! mb-2">Approve {approveSlip.slipNumber}</Typography>
                            <KitTextField
                                inputRef={managerRemarkInputRef}
                                label="Manager remark (optional)"
                                size="small"
                                multiline
                                minRows={2}
                                value={managerRemark}
                                onChange={(e) => setManagerRemark(e.target.value)}
                                className="my-3! w-full!"
                            />
                            <div className="flex gap-2 justify-end">
                                <KitButton
                                    size="small"
                                    variant="outlined"
                                    className="w-auto"
                                    onClick={() => {
                                        setApproveSlip(null);
                                        setAnchorEl(null);
                                        setManagerRemark("");
                                    }}
                                >
                                    Cancel
                                </KitButton>
                                <KitButton size="small" variant="contained" color="success" className="w-auto" onClick={handleApprove}>Approve</KitButton>
                            </div>
                        </Paper>
                    </Popper>
                </ClickAwayListener>
            )}

            {rejectSlip && (
                <ClickAwayListener
                    onClickAway={() => {
                        setRejectSlip(null);
                        setAnchorEl(null);
                    }}
                >
                    <Popper
                        open={Boolean(anchorEl)}
                        anchorEl={anchorEl}
                        placement="top"
                    >
                        <Paper className="fixed bottom-4 right-4 z-50 p-4 border shadow-lg w-96">
                            <Typography className="font-semibold! mb-2">Reject {rejectSlip.slipNumber}</Typography>
                            <div className="flex flex-col gap-2 my-3!">
                                <KitTextField
                                    label="Rejection reason"
                                    size="small"
                                    required
                                    value={rejectedReason}
                                    onChange={(e) => setRejectedReason(e.target.value)}
                                    className="w-full!"
                                />
                                <KitTextField
                                    label="Manager remark (optional)"
                                    size="small"
                                    value={managerRemark}
                                    onChange={(e) => setManagerRemark(e.target.value)}
                                    className="w-full!"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <KitButton
                                    size="small"
                                    variant="outlined"
                                    className="w-auto"
                                    onClick={() => {
                                        setRejectSlip(null);
                                        setAnchorEl(null);
                                        setRejectedReason("");
                                        setManagerRemark("");
                                    }}
                                >
                                    Cancel
                                </KitButton>
                                <KitButton size="small" variant="contained" color="error" className="w-auto" onClick={handleReject}>Reject</KitButton>
                            </div>
                        </Paper>
                    </Popper>
                </ClickAwayListener>
            )}

            <div className="fixed -left-[10000px] top-0 -z-10">
                <div ref={printRef}>
                    <AdvanceSlipPrintLayout slip={printSlip || {}} />
                </div>
            </div>

            <KitShow show={showSlipDrawer}>
                <ManagerSlipDrawer
                    isOpen={showSlipDrawer}
                    onClose={toggleSlipDrawer}
                    detailSlip={detailSlip}
                />
            </KitShow>
        </>
    );
}
