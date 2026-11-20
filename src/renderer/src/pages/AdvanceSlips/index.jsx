import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Backdrop, Chip, CircularProgress, Paper, Popper, Tooltip, Typography } from "@mui/material";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitMuiTable from "../../../../kit/components/KitMuiTable";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import {
    fetchAdvanceSlips,
    useAdvanceSlips,
    useCancelAdvanceSlip,
    useUpdateAdvanceSlip,
} from "../../../../kit/hooks/data/cashierAdvance";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { getPersonDisplayName } from "../../../../kit/utils/invoiceBill";
import CreateAdvanceSlipModal from "../../components/advanceSlip/CreateAdvanceSlipModal";
import AdvanceSlipPrintLayout from "../../components/advanceSlip/AdvanceSlipPrintLayout";
import useUser from "../../../../kit/hooks/useUser";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import KitDataGrid from "../../../../kit/components/KitDataGrid/KitDataGrid";
import KitSelect from "../../../../kit/components/KitSelect";
import { advanceSlipFilterOptions, EXPORT_LIMIT } from "../../../../kit/configs/general";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import ShortcutBadge from "../../components/Dashboard/ShortcutBadge";
import KitDeleteDialog from "../../../../kit/components/KitDeleteDialog";
import { downloadCsv, downloadXlsx } from "../../../../kit/utils/exportFile";
import useKeyboardShortcuts from "../../../../kit/hooks/useKeyboardShortcuts";
import KitHeader from "../../../../kit/components/KitHeader/KitHeader";

const STATUS_COLORS = {
    pending: "warning",
    approved: "success",
    rejected: "error",
    cancelled: "error",
};

export default function CashierAdvanceSlips() {
    const navigate = useNavigate();
    const userData = useUser();
    const printRef = useRef(null);
    const backButtonRef = useRef(null);
    const createButtonRef = useRef(null);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const paymentTypeRef = useRef(null);
    const amountInputRef = useRef(null);
    const editButtonRefs = useRef({});

    const today = format(new Date(), "yyyy-MM-dd");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [statusFilter, setStatusFilter] = useState("");
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [createOpen, setCreateOpen] = useState(false);
    const [printSlip, setPrintSlip] = useState(null);
    const [editingSlip, setEditingSlip] = useState(null);
    const [deletingSlip, setDeletingSlip] = useState(null);
    const [editAmount, setEditAmount] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [activeRowIndex, setActiveRowIndex] = useState(0);
    const [isExporting, setIsExporting] = useState(false);

    const queryParams = {
        page: page,
        limit: pageSize,
        status: statusFilter,
        ...startDate && { startDate: startDate },
        ...endDate && { endDate: endDate },
    }

    const { advanceSlips, isAdvanceSlipsLoading, advanceSlipsError, refreshAdvanceSlips } = useAdvanceSlips(queryParams);
    const { cancelAdvanceSlip, isCancellingAdvanceSlip } = useCancelAdvanceSlip();
    const { updateAdvanceSlip, isUpdatingAdvanceSlip } = useUpdateAdvanceSlip();

    const toggleDeleteDialog = () => setShowDeleteDialog(!showDeleteDialog);

    const handleCancel = (slip) => {
        setDeletingSlip(slip);
        toggleDeleteDialog();
    }

    const onDelete = async () => {
        try {
            await cancelAdvanceSlip({
                id: deletingSlip.id,
                body: { cashierRemark: "Cancelled by cashier" },
            });
            toast.success("Advance slip cancelled.");
            toggleDeleteDialog();
            setDeletingSlip(null);
            refreshAdvanceSlips();
        } catch (error) {
            toast.error(error?.message || "Unable to cancel slip.");
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: "Advance Slip",
    });

    const handleSaveEdit = useCallback(async () => {
        if (!editingSlip) return;
        const amount = Number(editAmount);
        if (!amount || amount <= 0) {
            toast.warning("Enter a valid amount.");
            return;
        }

        try {
            await updateAdvanceSlip({
                id: editingSlip.id,
                body: { amount },
            });
            toast.success("Advance slip updated.");
            setEditingSlip(null);
            refreshAdvanceSlips();
        } catch (error) {
            toast.error(error?.message || "Unable to update slip.");
        }
    }, [editAmount, editingSlip, refreshAdvanceSlips, updateAdvanceSlip]);

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
            field: 'manager',
            headerName: 'Given To',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {getPersonDisplayName(params.row.manager)}
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
        {
            field: 'status',
            headerName: 'Status',
            minWidth: 220,
            flex: 1,
            renderCell: (params) => {
                return (
                    <Tooltip title={params.row.rejectedReason || ""} placement="top">
                        <Chip
                            label={params.row.status}
                            color={STATUS_COLORS[params.row.status] || "default"}
                            variant='outlined'
                            size='small'
                            className="text-xs!"
                        />
                    </Tooltip>
                );
            }
        },
        {
            field: 'approvedAt',
            headerName: 'Approved At',
            minWidth: 170,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params.row.approvedAt ? format(new Date(params.row.approvedAt), "dd MMM yyyy, hh:mm a") : "-"}
                </Typography>
            )
        },
        {
            field: "actions",
            headerName: "Actions",
            width: 250,
            sortable: false,
            disableColumnMenu: true,
            headerClassName: "sticky-column",
            cellClassName: "sticky-column",
            renderHeader: () => (
                <div className="flex flex-col gap-1 text-start">
                    <span>Actions</span>
                    <div className="flex items-center gap-6">
                        <span className="rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-700 h-[16px]!">
                            Shift + P
                        </span>
                        <span className="rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-700 h-[16px]!">
                            Shift + E
                        </span>
                        <span className="rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-700 h-[16px]!">
                            Shift + D
                        </span>
                    </div>
                </div>
            ),
            renderCell: (params) => (
                <div className="flex gap-2">
                    {(params.row.status === "pending" || params.row.status === "approved") && (
                        <KitButton
                            size="small"
                            variant="outlined"
                            className="w-auto!"
                            onClick={() => {
                                setPrintSlip(params.row);
                                setTimeout(() => handlePrint(), 100);
                            }}
                        >
                            Print
                        </KitButton>
                    )}
                    {params.row.status === "pending" && (
                        <>
                            <KitButton
                                ref={(el) => {
                                    if (el) {
                                        editButtonRefs.current[params.row.id] = el;
                                    }
                                }}
                                size="small"
                                variant="outlined"
                                className="w-auto!"
                                onClick={(e) => {
                                    setAnchorEl(e.currentTarget);
                                    setEditingSlip(params.row);
                                    setEditAmount(String(params.row.amount));
                                }}
                            >
                                Edit
                            </KitButton>
                            <KitButton
                                size="small"
                                variant="outlined"
                                color="error"
                                className="w-auto!"
                                onClick={() => handleCancel(params.row)}
                            >
                                Cancel
                            </KitButton>
                        </>
                    )}
                </div>
            )
        },
    ];

    const getExportParams = {
        page: page,
        limit: EXPORT_LIMIT,
        status: statusFilter,
        ...(startDate && { startDate: startDate }),
        ...(endDate && { endDate: endDate }),
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
                "Slip No": bill.slipNumber ?? "-",
                Date: bill.slipDate ?? "-",
                Time: bill.timeOfDay ?? "-",
                "Given To": getPersonDisplayName(bill.manager),
                Amount: priceFormat(bill.amount),
                Status: bill.status ?? "-",
                "Approved At": bill.approvedAt
                    ? format(new Date(bill.approvedAt), "dd MMM yyyy, hh:mm a")
                    : "-",
            }));

            if (!exportRows.length) return;

            const timestamp = format(new Date(), "yyyyMMdd_HHmmss");

            if (type === "csv") {
                downloadCsv(exportRows, `my_advance_slips_${timestamp}.csv`);
            } else {
                downloadXlsx(exportRows, `my_advance_slips_${timestamp}.xlsx`, "Advance Slips");
            }
        } catch (error) {
            toast.error(error?.message || "Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    const isLoading = isAdvanceSlipsLoading || isCancellingAdvanceSlip || isUpdatingAdvanceSlip;

    useEffect(() => {
        if (advanceSlips?.data?.slips?.length) {
            setActiveRowIndex(0);
        }
    }, [advanceSlips]);

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
                    case "p":
                        e.preventDefault();
                        if (activeRow.status === "pending" || activeRow.status === "approved") {
                            setPrintSlip(activeRow);
                            setTimeout(handlePrint, 100);
                        }
                        break;

                    case "e":
                        e.preventDefault();
                        if (activeRow.status === "pending") {
                            setAnchorEl(editButtonRefs.current[activeRow.id]);
                            setEditingSlip(activeRow);
                            setEditAmount(String(activeRow.amount));
                        }
                        break;

                    case "d":
                        e.preventDefault();
                        if (activeRow.status === "pending") {
                            handleCancel(activeRow);
                        }
                        break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [advanceSlips, activeRowIndex, handlePrint]);

    useEffect(() => {
        if (!editingSlip) return;

        const handleKeyDown = (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleSaveEdit();
            }

            if (e.key === "Escape") {
                e.preventDefault();
                setEditingSlip(null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [editingSlip, handleSaveEdit]);

    useEffect(() => {
        if (!showDeleteDialog) return;

        const handleKeyDown = (e) => {
            switch (e.key) {
                case "Enter":
                    e.preventDefault();
                    onDelete();
                    break;

                case "Escape":
                    e.preventDefault();
                    toggleDeleteDialog();
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [showDeleteDialog, onDelete]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "b":
                    e.preventDefault();
                    backButtonRef.current?.click();
                    break;

                case "c":
                    e.preventDefault();
                    createButtonRef.current?.click();
                    break;

                case "s":
                    e.preventDefault();
                    startDateRef.current?.focus();
                    break;

                case "e":
                    e.preventDefault();
                    endDateRef.current?.focus();
                    break;

                case "t":
                    e.preventDefault();
                    paymentTypeRef.current?.focus();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [editingSlip, handleSaveEdit]);

    useEffect(() => {
        if (editingSlip && anchorEl) {
            requestAnimationFrame(() => {
                amountInputRef.current?.focus();
            });
        }
    }, [editingSlip, anchorEl]);

    useKeyboardShortcuts({
        handleExportCsv: () => handleExport("csv"),
        handleExportXlsx: () => handleExport("xlsx"),
    });

    return (
        <>
            <Backdrop open={isLoading || isExporting} sx={{ zIndex: 9999, color: "#fff" }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <div className="p-3 min-h-full">
                <div className="flex justify-between items-center mb-3">
                    <KitHeader
                        title='My Advance Slips'
                        subtitle="Manage advance payment slips"
                        icon="tabler:receipt"
                        count={advanceSlips?.data?.pagination?.totalItems ?? 0}
                        countLabel="records"
                    />

                    <div className="flex gap-2">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + B" />
                            <KitButton
                                ref={backButtonRef}
                                size="small"
                                variant="outlined"
                                className="w-auto"
                                startIcon={<KitIcon icon="tabler:arrow-left" />}
                                onClick={() => navigate("/dashboard")}
                            >
                                POS
                            </KitButton>
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + C" />
                            <KitButton
                                ref={createButtonRef}
                                size="small"
                                variant="contained"
                                className="w-auto"
                                startIcon={<KitIcon icon="tabler:plus" />}
                                onClick={() => setCreateOpen(true)}
                            >
                                Create Slip
                            </KitButton>
                        </div>
                    </div>
                </div>

                <Paper elevation={0} className="p-3 mb-3 border border-gray-200 rounded-xl bg-white">
                    <div className="flex flex-wrap gap-3 items-end">
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + S" className="top-0" />
                            <KitTextField
                                inputRef={startDateRef}
                                size="small"
                                type="date"
                                label="Start Date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + E" className="top-0" />
                            <KitTextField
                                inputRef={endDateRef}
                                size="small"
                                type="date"
                                label="End Date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-44"
                            />
                        </div>
                        <div className="relative w-44">
                            <ShortcutBadge shortcut="Alt + T" className="top-0!" />
                            <KitSelect
                                ref={paymentTypeRef}
                                label="Payment type"
                                placeholder="Filter Payment Type"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                size="small"
                                options={advanceSlipFilterOptions}
                                menuShouldScrollIntoView={false}
                                styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
                                value={advanceSlipFilterOptions.find((opt) => opt.value === statusFilter) ?? null}
                                onChange={(option) => setStatusFilter(option?.value || '')}
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
                    </div>
                </Paper>

                <div className="rounded-xl overflow-hidden">
                    <KitDataGrid
                        columns={columns}
                        rows={advanceSlips?.data?.slips}
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
            </div>

            <KitShow show={createOpen}>
                <CreateAdvanceSlipModal
                    open={createOpen}
                    onClose={() => setCreateOpen(false)}
                    onCreated={() => refreshAdvanceSlips()}
                />
            </KitShow>

            {editingSlip && (
                <Popper
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    placement="top"
                >
                    <Paper className="p-3 w-72 shadow-lg rounded-lg">
                        <Typography className="font-semibold! mb-2">Edit Slip {editingSlip.slipNumber}</Typography>
                        <KitTextField
                            inputRef={amountInputRef}
                            label="Amount"
                            type="number"
                            size="small"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                            className="my-3! w-full!"
                        />
                        <div className="flex gap-2 justify-end">
                            <KitButton size="small" variant="outlined" className="w-auto" onClick={() => setEditingSlip(null)}>
                                Cancel
                            </KitButton>
                            <KitButton size="small" variant="contained" className="w-auto" onClick={handleSaveEdit}>
                                Save
                            </KitButton>
                        </div>
                    </Paper>
                </Popper>
            )}

            <div className="fixed -left-[10000px] top-0 -z-10">
                <div ref={printRef}>
                    <AdvanceSlipPrintLayout slip={printSlip || {}} userData={userData} />
                </div>
            </div>

            <KitShow show={showDeleteDialog}>
                <KitDeleteDialog
                    isOpen={showDeleteDialog}
                    onClose={toggleDeleteDialog}
                    title={`Cancel the slip`}
                    subTitle={`Are you sure to cancel this Slip?`}
                    onDelete={onDelete}
                    isBtnLoading={isCancellingAdvanceSlip}
                />
            </KitShow>
        </>
    );
}
