import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Backdrop, Box, Chip, CircularProgress, Paper, Tooltip, Typography } from "@mui/material";
import { format } from "date-fns";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitDebouncedInput from "../../../../kit/components/KitDebouncedInput";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitMuiTable from "../../../../kit/components/KitMuiTable";
import KitSelect from "../../../../kit/components/KitSelect";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { useReconciliation, useSettleCashier } from "../../../../kit/hooks/data/settlement";
import { useUsersDropdown } from "../../../../kit/hooks/data/users";
import useUser from "../../../../kit/hooks/useUser";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { parseApiList, buildUserLabel } from "../../../../kit/utils/parseApiList";
import { canSettleRow, computeDraftDifference, computeDraftStatus, formatPaymentModeLabel, getDefaultReceivedAmount, getIdealCashTooltip, getSettlementStatusColor, withBasePaymentModes } from "../../../../kit/utils/settlement";
import { EllipsisText } from "../../../../kit/utils/ellipsisText";
import { toast } from "react-toastify";
import ShortcutBadge from "../Dashboard/ShortcutBadge";
import KitHeader from "../../../../kit/components/KitHeader/KitHeader";

const DEFAULT_STORE_ID = 1;

export default function ManagerCollectPanel({ onOpenCashier }) {
    const userData = useUser();
    const searchRef = useRef(null);
    const cashierRef = useRef(null);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const amountRefs = useRef({});
    const collectButtonRefs = useRef({});
    const today = format(new Date(), "yyyy-MM-dd");

    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [selectedCashierId, setSelectedCashierId] = useState("");
    const [search, setSearch] = useState("");
    const [draftAmounts, setDraftAmounts] = useState({});
    const [settlingUserId, setSettlingUserId] = useState(null);
    const [activeRowIndex, setActiveRowIndex] = useState(0);

    const storeId = userData?.storeId || DEFAULT_STORE_ID;

    const queryParams = {
        startDate: startDate,
        endDate: endDate,
        storeId: storeId,
        ...(selectedCashierId && { cashierId: selectedCashierId }),
    }

    const { reconciliation, isReconciliationLoading, refreshReconciliation } = useReconciliation(queryParams);
    const { usersDropdown, isUsersDropdownLoading } = useUsersDropdown({ role: "cashier" });
    const { settleCashier } = useSettleCashier();

    const report = reconciliation?.data || {};
    const apiRows = report.rows || [];
    const modes = useMemo(() => withBasePaymentModes(report.modes || []), [report.modes]);
    const totals = report.totals || null;

    const cashierOptions = useMemo(() => {
        const users = parseApiList(usersDropdown);
        return [
            { label: "All Cashiers", value: "" },
            ...users.map((user) => ({
                label: user.displayName || buildUserLabel(user),
                value: user.id,
            })),
        ];
    }, [usersDropdown]);

    useEffect(() => {
        setDraftAmounts({});
    }, [startDate, endDate, selectedCashierId, storeId]);

    useEffect(() => {
        if (!apiRows.length) return;

        setDraftAmounts((prev) => {
            const next = { ...prev };
            apiRows.forEach((row) => {
                if (next[row.userId] === undefined) {
                    next[row.userId] = getDefaultReceivedAmount(row);
                }
            });
            return next;
        });
    }, [apiRows]);

    const tableRows = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return apiRows
            .filter((row) => {
                if (!keyword) return true;
                return (
                    String(row.userId).includes(keyword) ||
                    String(row.userName || "").toLowerCase().includes(keyword) ||
                    String(row.cashier?.email || "").toLowerCase().includes(keyword)
                );
            })
            .map((row) => ({
                ...row,
                id: row.userId,
                draftReceived: draftAmounts[row.userId] ?? getDefaultReceivedAmount(row),
            }));
    }, [apiRows, draftAmounts, search]);

    const handleDraftChange = useCallback((userId, value) => {
        setDraftAmounts((prev) => ({
            ...prev,
            [userId]: Number(value) || 0,
        }));
    }, []);

    const handleCollectRow = useCallback(async (row) => {
        if (!canSettleRow(row, row.draftReceived)) {
            toast.warning("Enter the amount to collect for this cashier.");
            return;
        }

        setSettlingUserId(row.userId);

        try {
            await settleCashier({
                cashierId: row.userId,
                receivedAmount: Number(row.draftReceived || 0),
                startDate,
                endDate,
                storeId,
            });

            toast.success(`Collected ${priceFormat(row.draftReceived)} from ${row.userName || "cashier"}.`);

            setDraftAmounts((prev) => {
                const next = { ...prev };
                delete next[row.userId];
                return next;
            });

            await refreshReconciliation();
        } catch (error) {
            toast.error(error?.message || "Unable to collect amount.");
        } finally {
            setSettlingUserId(null);
        }
    }, [endDate, refreshReconciliation, settleCashier, startDate, storeId]);

    const columns = useMemo(() => {
        const modeColumns = modes.map((mode) => ({
            field: `mode_${mode}`,
            headerName: formatPaymentModeLabel(mode),
            minWidth: 110,
            renderCell: ({ row }) => (
                <Typography className="text-sm!">
                    {priceFormat(row.paymentBreakdown?.[mode] || 0)}
                </Typography>
            ),
            renderSummary: ({ row }) => (
                <Typography className="text-sm! font-semibold!">
                    {priceFormat(row.paymentBreakdown?.[mode] || 0)}
                </Typography>
            ),
        }));

        return [
            {
                field: "userId",
                headerName: "User Id",
                minWidth: 80,
                renderCell: ({ row }) => (
                    <Typography className="text-sm!">{row.userId}</Typography>
                ),
                renderSummary: () => (
                    <Typography className="text-sm! font-semibold!">Total</Typography>
                ),
            },
            {
                field: "userName",
                headerName: "User Name",
                minWidth: 130,
                renderCell: ({ row }) => (
                    <Tooltip title="Open day-wise cashier collection" placement="top">
                        <button
                            type="button"
                            className="cursor-pointer text-left text-primary underline max-w-full"
                            onClick={() => onOpenCashier?.({ cashierId: row.userId, startDate, endDate })}
                        >
                            <EllipsisText className="text-sm!" text={row.userName || "-"} />
                        </button>
                    </Tooltip>
                ),
                renderSummary: () => "",
            },
            {
                field: "noOfInvoices",
                headerName: "Invoices",
                minWidth: 90,
                renderCell: ({ row }) => (
                    <Typography className="text-sm!">{row.noOfInvoices ?? 0}</Typography>
                ),
                renderSummary: ({ row }) => (
                    <Typography className="text-sm! font-semibold!">{row.noOfInvoices ?? 0}</Typography>
                ),
            },
            ...modeColumns,
            {
                field: "advanceAmount",
                headerName: "Advance",
                minWidth: 100,
                renderCell: ({ row }) => (
                    <Typography className="text-sm!">{priceFormat(row.advanceAmount || 0)}</Typography>
                ),
                renderSummary: ({ row }) => (
                    <Typography className="text-sm! font-semibold!">
                        {priceFormat(row.advanceAmount || 0)}
                    </Typography>
                ),
            },
            {
                field: "voucherAmount",
                headerName: "Voucher",
                minWidth: 100,
                renderCell: ({ row }) => (
                    <Typography className="text-sm!">{priceFormat(row.voucherAmount || 0)}</Typography>
                ),
                renderSummary: ({ row }) => (
                    <Typography className="text-sm! font-semibold!">
                        {priceFormat(row.voucherAmount || 0)}
                    </Typography>
                ),
            },
            {
                field: "totalSales",
                headerName: "Total Sales",
                minWidth: 110,
                renderCell: ({ row }) => (
                    <Typography className="text-sm!">{priceFormat(row.totalSales || 0)}</Typography>
                ),
                renderSummary: ({ row }) => (
                    <Typography className="text-sm! font-semibold!">
                        {priceFormat(row.totalSales || 0)}
                    </Typography>
                ),
            },
            {
                field: "eodNetCash",
                headerName: "EOD Cash",
                minWidth: 100,
                renderCell: ({ row }) => (
                    <Tooltip
                        title={`Opening ${priceFormat(row.eodOpeningCash || 0)} → Closing ${priceFormat(row.eodClosingCash || 0)} (${row.logDaysCount ?? 0} day log(s))`}
                        placement="top"
                    >
                        <Typography className="text-sm! cursor-help underline decoration-dotted">
                            {priceFormat(row.eodNetCash || 0)}
                        </Typography>
                    </Tooltip>
                ),
                renderSummary: ({ row }) => (
                    <Typography className="text-sm! font-semibold!">
                        {priceFormat(row.eodNetCash || 0)}
                    </Typography>
                ),
            },
            {
                field: "idealCash",
                headerName: "Ideal Cash",
                minWidth: 110,
                renderCell: ({ row }) => (
                    <Tooltip title={getIdealCashTooltip(row)} placement="top">
                        <Typography className="text-sm! cursor-help underline decoration-dotted">
                            {priceFormat(row.idealCash || 0)}
                        </Typography>
                    </Tooltip>
                ),
                renderSummary: ({ row }) => (
                    <Tooltip title={getIdealCashTooltip(row)} placement="top">
                        <Typography className="text-sm! font-semibold! cursor-help underline decoration-dotted">
                            {priceFormat(row.idealCash || 0)}
                        </Typography>
                    </Tooltip>
                ),
            },
            {
                field: "amountReceived",
                headerName: "Amount Received",
                minWidth: 140,
                renderCell: ({ row }) => (
                    <KitTextField
                        inputRef={(el) => {
                            amountRefs.current[row.rowKey] = el;
                        }}
                        type="number"
                        size="small"
                        value={row.draftReceived}
                        onChange={(e) => handleDraftChange(row.userId, e.target.value)}
                        sx={{ width: 120 }}
                    />
                ),
                renderSummary: ({ row }) => (
                    <Typography className="text-sm! font-semibold!">
                        {priceFormat(row.alreadyReceived ?? row.amountReceived ?? 0)}
                    </Typography>
                ),
            },
            {
                field: "difference",
                headerName: "Difference",
                minWidth: 110,
                renderCell: ({ row }) => {
                    const difference = computeDraftDifference(row.draftReceived, row.idealCash);
                    return (
                        <Typography
                            className={`text-sm! ${difference < 0
                                ? "text-red-600!"
                                : difference > 0
                                    ? "text-orange-600!"
                                    : "text-green-600!"
                                }`}
                        >
                            {priceFormat(difference)}
                        </Typography>
                    );
                },
                renderSummary: ({ row }) => (
                    <Typography className="text-sm! font-semibold!">
                        {priceFormat(row.difference || 0)}
                    </Typography>
                ),
            },
            {
                field: "status",
                headerName: "Status",
                minWidth: 100,
                renderCell: ({ row }) => {
                    const status = computeDraftStatus(
                        row.draftReceived,
                        row.idealCash,
                        row.status
                    );

                    return (
                        <Chip
                            label={status}
                            color={getSettlementStatusColor(status)}
                            variant="outlined"
                            size="small"
                            className={`text-xs! ${status === "NA" || status === "PENDING" ? "opacity-70" : ""}`}
                        />
                    );
                },
                renderSummary: () => "",
            },
            {
                field: "actions",
                headerName: "Action",
                minWidth: 120,
                align: "center",
                renderCell: ({ row }) => {
                    const isRowSettling = settlingUserId === row.userId;
                    const canCollect = canSettleRow(row, row.draftReceived);

                    return (
                        <KitButton
                            ref={(el) => {
                                if (el) {
                                    collectButtonRefs.current[row.userId] = el;
                                }
                            }}
                            type="button"
                            variant="contained"
                            size="small"
                            color="warning"
                            className="w-auto! min-w-[96px]!"
                            isLoading={isRowSettling}
                            disabled={!canCollect || Boolean(settlingUserId && !isRowSettling)}
                            onClick={() => handleCollectRow(row)}
                            startIcon={!isRowSettling ? <KitIcon icon="tabler:cash" className="text-sm!" /> : undefined}
                        >
                            Collect
                        </KitButton>
                    );
                },
                renderSummary: () => "",
            },
        ];
    }, [modes, handleDraftChange, handleCollectRow, settlingUserId, onOpenCashier, startDate, endDate]);

    const isLoading = isReconciliationLoading || Boolean(settlingUserId);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "c":
                    e.preventDefault();
                    cashierRef.current?.focus();
                    break;

                case "s":
                    e.preventDefault();
                    startDateRef.current?.focus();
                    break;

                case "e":
                    e.preventDefault();
                    endDateRef.current?.focus();
                    break;

                case "o":
                    e.preventDefault();
                    searchRef.current?.focus();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (!tableRows.length) return;

        const handleKeyDown = (e) => {
            const typing =
                document.activeElement?.tagName === "INPUT" ||
                document.activeElement?.tagName === "TEXTAREA";

            if (typing && !["ArrowUp", "ArrowDown", "Enter"].includes(e.key)) {
                return;
            }

            switch (e.key) {
                case "ArrowDown": {
                    e.preventDefault();
                    const next = Math.min(activeRowIndex + 1, tableRows.length - 1);
                    setActiveRowIndex(next);
                    requestAnimationFrame(() => { amountRefs.current[tableRows[next].userId]?.focus() });
                    break;
                }

                case "ArrowUp": {
                    e.preventDefault();
                    const prev = Math.max(activeRowIndex - 1, 0);
                    setActiveRowIndex(prev);
                    requestAnimationFrame(() => { amountRefs.current[tableRows[prev].userId]?.focus() });
                    break;
                }

                case "Enter":
                    e.preventDefault();
                    collectButtonRefs.current[tableRows[activeRowIndex].userId]?.click();
                    break;

                default:
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [tableRows, activeRowIndex]);

    useEffect(() => {
        if (!tableRows.length) return;
        requestAnimationFrame(() => {
            amountRefs.current[tableRows[0].rowKey]?.focus();
        });
    }, [tableRows]);

    return (
        <>
            <Backdrop open={isLoading} sx={{ zIndex: 9999, color: "#fff" }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <div className="flex flex-col gap-3 w-full min-w-0">
                <KitHeader
                    title="Collection Amount"
                    subtitle="Cashier collection summary"
                    icon="tabler:cash"
                    count={tableRows?.length ?? 0}
                    countLabel="records"
                />

                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-52 relative">
                            <ShortcutBadge shortcut="Alt + C" className="top-0!" />
                            <KitSelect
                                ref={cashierRef}
                                label="Cashier"
                                placeholder="All Cashiers"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={cashierOptions}
                                isDisabled={isUsersDropdownLoading}
                                value={cashierOptions.find((option) => String(option.value) === String(selectedCashierId)) ?? cashierOptions[0]}
                                onChange={(option) => setSelectedCashierId(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + S" className="top-0!" />
                            <KitTextField
                                inputRef={startDateRef}
                                size="small"
                                height="32px"
                                type="date"
                                label="Start Date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + E" className="top-0!" />
                            <KitTextField
                                inputRef={endDateRef}
                                size="small"
                                height="32px"
                                type="date"
                                label="End Date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + O" className="-top-5!" />
                            <KitDebouncedInput
                                ref={searchRef}
                                value={search}
                                onChange={(value) => setSearch(String(value))}
                                placeholder="Search cashier..."
                                className="w-52"
                                size="small"
                            />
                        </div>
                    </div>
                </Paper>

                {!tableRows.length && !isReconciliationLoading ? (
                    <Paper elevation={0} className="p-8 border border-gray-200 rounded-xl text-center">
                        <Typography className="text-third-500">
                            No cashier activity in this date range.
                        </Typography>
                    </Paper>
                ) : (
                    <div className="w-full min-w-0 overflow-hidden rounded-sm">
                        <Box
                            sx={(theme) => ({
                                "& .active-row > td": {
                                    backgroundColor: `${theme.palette.customColors.activeBackground} !important`,
                                },
                                "& .active-row:hover > td": {
                                    backgroundColor: `${theme.palette.customColors.activeBackground} !important`,
                                },
                            })}
                        >
                            <KitMuiTable
                                columns={columns}
                                rows={tableRows}
                                getRowId={(row) => row.userId}
                                paginationMode="client"
                                summaryRow={totals}
                                getRowClassName={(params) =>
                                    params.indexRelativeToCurrentPage === activeRowIndex
                                        ? "active-row"
                                        : ""
                                }
                            />
                        </Box>
                    </div>
                )}
            </div>
        </>
    );
}
