import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Backdrop, Box, Chip, CircularProgress, Grid, Paper, Typography } from "@mui/material";
import { format } from "date-fns";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitDebouncedInput from "../../../../kit/components/KitDebouncedInput";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitMuiTable from "../../../../kit/components/KitMuiTable";
import KitSelect from "../../../../kit/components/KitSelect";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { useOutstandingSummary, useSettleCashier } from "../../../../kit/hooks/data/settlement";
import { useUsersDropdown } from "../../../../kit/hooks/data/users";
import useUser from "../../../../kit/hooks/useUser";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { parseApiList, buildUserLabel } from "../../../../kit/utils/parseApiList";
import { EllipsisText } from "../../../../kit/utils/ellipsisText";
import { toast } from "react-toastify";
import ShortcutBadge from "../Dashboard/ShortcutBadge";
import KitHeader from "../../../../kit/components/KitHeader/KitHeader";

const DEFAULT_STORE_ID = 1;

const GROUP_BY_OPTIONS = [
    { label: "By Cashier", value: "cashier" },
    { label: "By Date", value: "date" },
    { label: "By Cashier & Date", value: "cashier-date" },
];

const getOutstandingAmount = (row = {}) => Number(row.remainingAmount ?? row.totalOutstandingAmount ?? 0);

const getRowKey = (row = {}, index = 0) => {
    if (row.cashierId && row.date) return `${row.cashierId}-${row.date}`;
    if (row.cashierId) return String(row.cashierId);
    if (row.date) return String(row.date);
    return String(index);
};

export default function ManagerOutstandingPanel() {
    const userData = useUser();
    const groupRef = useRef(null);
    const searchRef = useRef(null);
    const cashierRef = useRef(null);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const amountRefs = useRef({});
    const collectButtonRefs = useRef({});
    const today = format(new Date(), "yyyy-MM-dd");

    const [groupBy, setGroupBy] = useState("cashier-date");
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [selectedCashierId, setSelectedCashierId] = useState("");
    const [search, setSearch] = useState("");
    const [draftAmounts, setDraftAmounts] = useState({});
    const [settlingRowKey, setSettlingRowKey] = useState(null);
    const [activeRowIndex, setActiveRowIndex] = useState(0);

    const storeId = userData?.storeId || DEFAULT_STORE_ID;

    const queryParams = {
        groupBy: groupBy,
        storeId: storeId,
        ...(startDate && { startDate: startDate }),
        ...(endDate && { endDate: endDate }),
        ...(selectedCashierId && { cashierId: selectedCashierId }),
    };

    const { outstandingSummary, isOutstandingSummaryLoading, refreshOutstandingSummary } =
        useOutstandingSummary(queryParams);
    const { usersDropdown, isUsersDropdownLoading } = useUsersDropdown({ role: "cashier" });
    const { settleCashier } = useSettleCashier();

    const report = outstandingSummary?.data || {};
    const apiRows = report.rows || [];
    const cashierRollup = report.cashiers || [];
    const gridRows = report.grid || [];
    const totals = report.totals || {};

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
    }, [groupBy, startDate, endDate, selectedCashierId, storeId]);

    useEffect(() => {
        if (!apiRows.length) return;

        setDraftAmounts((prev) => {
            const next = { ...prev };
            apiRows.forEach((row, index) => {
                const key = getRowKey(row, index);
                if (next[key] === undefined) {
                    next[key] = getOutstandingAmount(row);
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
                    String(row.cashierId || "").includes(keyword) ||
                    String(row.cashierName || "")
                        .toLowerCase()
                        .includes(keyword) ||
                    String(row.date || "").includes(keyword)
                );
            })
            .map((row, index) => {
                const rowKey = getRowKey(row, index);
                return {
                    ...row,
                    id: rowKey,
                    rowKey,
                    draftReceived: draftAmounts[rowKey] ?? getOutstandingAmount(row),
                };
            });
    }, [apiRows, draftAmounts, search]);

    const handleDraftChange = useCallback((rowKey, value) => {
        setDraftAmounts((prev) => ({
            ...prev,
            [rowKey]: Number(value) || 0,
        }));
    }, []);

    const getSettleDates = useCallback(
        (row) => {
            if (row.date) {
                return { startDate: row.date, endDate: row.date };
            }
            return {
                startDate: startDate || row.oldestUnsettledDate || today,
                endDate: endDate || row.latestUnsettledDate || today,
            };
        },
        [endDate, startDate, today]
    );

    const handleCollectRow = useCallback(
        async (row) => {
            if (!row.cashierId) {
                toast.warning("Select a cashier row to collect.");
                return;
            }

            const amount = Number(row.draftReceived || 0);
            if (amount <= 0) {
                toast.warning("Enter the amount to collect.");
                return;
            }

            const dates = getSettleDates(row);
            setSettlingRowKey(row.rowKey);

            try {
                await settleCashier({
                    cashierId: row.cashierId,
                    receivedAmount: amount,
                    startDate: dates.startDate,
                    endDate: dates.endDate,
                    storeId,
                });

                toast.success(`Collected ${priceFormat(amount)} from ${row.cashierName || "cashier"}.`);

                setDraftAmounts((prev) => {
                    const next = { ...prev };
                    delete next[row.rowKey];
                    return next;
                });

                await refreshOutstandingSummary();
            } catch (error) {
                toast.error(error?.message || "Unable to collect amount.");
            } finally {
                setSettlingRowKey(null);
            }
        },
        [getSettleDates, refreshOutstandingSummary, settleCashier, storeId]
    );

    const summaryCards = useMemo(
        () => [
            {
                title: "Outstanding Rows",
                value: totals.rowCount ?? tableRows.length,
                icon: "tabler:list",
                color: "secondary",
            },
            {
                title: "Total Bills",
                value: totals.totalBills ?? 0,
                icon: "tabler:receipt",
                color: "primary",
            },
            {
                title: "Total Outstanding",
                value: priceFormat(totals.totalOutstandingAmount ?? totals.remainingAmount ?? 0),
                icon: "tabler:cash",
                color: "warning",
            },
        ],
        [tableRows.length, totals]
    );

    const columns = useMemo(() => {
        const showDate = groupBy === "date" || groupBy === "cashier-date";
        const showCashier = groupBy === "cashier" || groupBy === "cashier-date";

        const baseColumns = [];

        if (showDate) {
            baseColumns.push({
                field: "date",
                headerName: "Date",
                minWidth: 110,
                renderCell: ({ row }) => <Typography className="text-sm!">{row.date || "-"}</Typography>,
                renderSummary: () => <Typography className="text-sm! font-semibold!">Total</Typography>,
            });
        }

        if (showCashier) {
            baseColumns.push({
                field: "cashierName",
                headerName: "Cashier",
                minWidth: 130,
                renderCell: ({ row }) => (
                    <EllipsisText className="text-sm!" text={row.cashierName || row.cashier?.displayName || "-"} />
                ),
                renderSummary: () => "",
            });
        }

        return [
            ...baseColumns,
            {
                field: "totalBills",
                headerName: "Bills",
                minWidth: 80,
                renderCell: ({ row }) => <Typography className="text-sm!">{row.totalBills ?? 0}</Typography>,
                renderSummary: ({ row }) => (
                    <Typography className="text-sm! font-semibold!">{row.totalBills ?? 0}</Typography>
                ),
            },
            {
                field: "remainingAmount",
                headerName: "Outstanding",
                minWidth: 120,
                renderCell: ({ row }) => (
                    <Typography className="text-sm! font-semibold! text-amber-700!">
                        {priceFormat(getOutstandingAmount(row))}
                    </Typography>
                ),
                renderSummary: ({ row }) => (
                    <Typography className="text-sm! font-semibold!">
                        {priceFormat(getOutstandingAmount(row))}
                    </Typography>
                ),
            },
            {
                field: "oldestUnsettledDate",
                headerName: "Oldest",
                minWidth: 110,
                renderCell: ({ row }) => <Typography className="text-sm!">{row.oldestUnsettledDate || "-"}</Typography>,
                renderSummary: () => "",
            },
            {
                field: "latestUnsettledDate",
                headerName: "Latest",
                minWidth: 110,
                renderCell: ({ row }) => <Typography className="text-sm!">{row.latestUnsettledDate || "-"}</Typography>,
                renderSummary: () => "",
            },
            {
                field: "amountReceived",
                headerName: "Collect Amount",
                minWidth: 140,
                renderCell: ({ row }) =>
                    row.cashierId ? (
                        <KitTextField
                            inputRef={(el) => {
                                amountRefs.current[row.rowKey] = el;
                            }}
                            type="number"
                            size="small"
                            value={row.draftReceived}
                            onChange={(e) => handleDraftChange(row.rowKey, e.target.value)}
                            sx={{ width: 120 }}
                        />
                    ) : (
                        <Typography className="text-sm! text-third-500">-</Typography>
                    ),
                renderSummary: () => "",
            },
            {
                field: "actions",
                headerName: "Action",
                minWidth: 110,
                align: "center",
                renderCell: ({ row }) => {
                    if (!row.cashierId) return null;

                    const isRowSettling = settlingRowKey === row.rowKey;

                    return (
                        <KitButton
                            ref={(el) => {
                                collectButtonRefs.current[row.rowKey] = el;
                            }}
                            type="button"
                            variant="contained"
                            size="small"
                            color="warning"
                            className="w-auto! min-w-[96px]!"
                            isLoading={isRowSettling}
                            disabled={Boolean(settlingRowKey && !isRowSettling)}
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
    }, [groupBy, handleCollectRow, handleDraftChange, settlingRowKey]);

    const cashierIds = new Set();
    gridRows.forEach((entry) => {
        Object.keys(entry.byCashier || {}).forEach((id) => cashierIds.add(id));
    });

    const gridDynamicColumns = Array.from(cashierIds).map((cashierId) => {
        const sample = gridRows.find((entry) => entry.byCashier?.[cashierId]);
        const label = sample?.byCashier?.[cashierId]?.cashierName || `Cashier ${cashierId}`;

        return {
            field: `cashier_${cashierId}`,
            headerName: label,
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography className="text-sm!">
                    {priceFormat(params.row.byCashier?.[cashierId]?.remainingAmount || 0)}
                </Typography>
            ),
        };
    });

    const gridColumns = [
        {
            field: "date",
            headerName: "Date",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => <Typography className="text-sm!">{params.row.date ?? "-"}</Typography>,
        },
        ...gridDynamicColumns,
        {
            field: "total",
            headerName: "Day Total",
            flex: 1,
            minWidth: 150,
            renderCell: (params) => <Typography className="text-sm!">{priceFormat(params?.row?.total)}</Typography>,
        },
    ];

    const cashierColumns = [
        {
            field: "displayName",
            headerName: "Cashier",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <EllipsisText className="text-sm!" text={params.row?.cashier?.displayName || "-"} />
            ),
        },
        {
            field: "totalBills",
            headerName: "Bills",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => <Typography className="text-sm!">{params.row.totalBills ?? 0}</Typography>,
        },
        {
            field: "totalOutstandingAmount",
            headerName: "Outstanding",
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Typography className="text-sm!">
                    {priceFormat(Number(params?.row?.remainingAmount ?? params?.row?.totalOutstandingAmount))}
                </Typography>
            ),
        },
        {
            field: "oldestUnsettledDate",
            headerName: "Oldest",
            flex: 1,
            minWidth: 170,
            renderCell: (params) => (
                <Typography className="text-sm!">{params.row.oldestUnsettledDate ?? "-"}</Typography>
            ),
        },
        {
            field: "latestUnsettledDate",
            headerName: "Latest",
            flex: 1,
            minWidth: 170,
            renderCell: (params) => (
                <Typography className="text-sm!">{params.row.latestUnsettledDate ?? "-"}</Typography>
            ),
        },
    ];

    const isLoading = isOutstandingSummaryLoading || Boolean(settlingRowKey);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "g":
                    e.preventDefault();
                    groupRef.current?.focus();
                    break;

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
            if (
                document.activeElement?.tagName === "INPUT" &&
                e.key !== "ArrowUp" &&
                e.key !== "ArrowDown" &&
                e.key !== "Enter"
            ) {
                return;
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                const next = Math.min(activeRowIndex + 1, tableRows.length - 1);
                setActiveRowIndex(next);
                requestAnimationFrame(() => {
                    amountRefs.current[tableRows[next].rowKey]?.focus();
                });
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                const prev = Math.max(activeRowIndex - 1, 0);
                setActiveRowIndex(prev);
                requestAnimationFrame(() => {
                    amountRefs.current[tableRows[prev].rowKey]?.focus();
                });
            }

            if (e.key === "Enter") {
                e.preventDefault();
                collectButtonRefs.current[tableRows[activeRowIndex].rowKey]?.click();
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
                    title="Outstanding"
                    subtitle="Pending collection amounts"
                    icon="tabler:wallet"
                    count={tableRows?.length ?? 0}
                    countLabel="records"
                />

                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl bg-white">
                    <div className="grid grid-cols-2 items-end gap-x-2 gap-y-3 md:flex md:flex-wrap md:gap-y-7">
                        <div className="relative w-full min-w-0 md:w-48">
                            <ShortcutBadge shortcut="Alt + G" className="top-0 hidden md:block" />
                            <KitSelect
                                ref={groupRef}
                                label="Group By"
                                size="small"
                                placeholder="Select group by"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={GROUP_BY_OPTIONS}
                                value={
                                    GROUP_BY_OPTIONS.find((o) => String(o.value) === String(groupBy)) ??
                                    GROUP_BY_OPTIONS[0]
                                }
                                onChange={(option) => setGroupBy(option?.value || "cashier")}
                            />
                        </div>
                        <div className="relative w-full min-w-0 md:w-52">
                            <ShortcutBadge shortcut="Alt + C" className="top-0 hidden md:block" />
                            <KitSelect
                                ref={cashierRef}
                                label="Cashier"
                                placeholder="All Cashiers"
                                size="small"
                                placeholderFontSize={14}
                                inputFontSize={14}
                                options={cashierOptions}
                                isDisabled={isUsersDropdownLoading}
                                value={
                                    cashierOptions.find(
                                        (option) => String(option.value) === String(selectedCashierId)
                                    ) ?? cashierOptions[0]
                                }
                                onChange={(option) => setSelectedCashierId(option?.value ?? "")}
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + S" className="top-0 hidden md:block" />
                            <KitTextField
                                inputRef={startDateRef}
                                size="small"
                                height="32px"
                                type="date"
                                label="Start Date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full md:w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + E" className="top-0 hidden md:block" />
                            <KitTextField
                                inputRef={endDateRef}
                                size="small"
                                height="32px"
                                type="date"
                                label="End Date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full md:w-44"
                            />
                        </div>
                        <div className="relative">
                            <ShortcutBadge shortcut="Alt + O" className="-top-5! hidden md:block" />
                            <KitDebouncedInput
                                ref={searchRef}
                                value={search}
                                onChange={(value) => setSearch(String(value))}
                                placeholder="Search..."
                                className="w-full md:w-52"
                                size="small"
                            />
                        </div>
                    </div>
                </Paper>

                <Grid container spacing={{ xs: 1, md: 2 }}>
                    {summaryCards.map((card) => (
                        <Grid size={{ xs: 12, sm: 4 }} key={card.title}>
                            <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                    <KitIcon icon={card.icon} className="text-primary text-xl!" />
                                    <Typography className="text-lg! font-bold!">{card.value}</Typography>
                                </div>
                                <Typography className="text-sm! text-third-500">{card.title}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {!tableRows.length && !isOutstandingSummaryLoading ? (
                    <Paper elevation={0} className="p-8 border border-gray-200 rounded-xl text-center">
                        <Typography className="text-third-500">No outstanding amounts for selected filters.</Typography>
                    </Paper>
                ) : (
                    <div className="w-full min-w-0 overflow-hidden rounded-sm border border-gray-200">
                        <div className="px-4 py-3">
                            <Typography className="font-semibold!">Outstanding Details</Typography>
                        </div>
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
                                rowCount={tableRows?.length}
                                getRowId={(row) => row.rowKey}
                                paginationMode="client"
                                summaryRow={totals.rowCount != null ? totals : null}
                                getRowClassName={(params) =>
                                    params.indexRelativeToCurrentPage === activeRowIndex ? "active-row" : ""
                                }
                            />
                        </Box>
                    </div>
                )}

                {gridRows.length > 0 && (groupBy === "date" || groupBy === "cashier-date") && (
                    <div className="w-full min-w-0 overflow-hidden rounded-sm border border-gray-200">
                        <div className="px-4 py-3">
                            <Typography className="font-semibold!">Daily Grid</Typography>
                            <Typography className="text-sm! text-third-500">
                                Outstanding amount per cashier per day
                            </Typography>
                        </div>
                        <KitMuiTable
                            columns={gridColumns}
                            rows={outstandingSummary?.data?.grid ?? []}
                            rowCount={outstandingSummary?.data?.grid?.length}
                            getRowId={(row) => row.date || row.id}
                            paginationMode="client"
                        />
                    </div>
                )}

                {cashierRollup.length > 0 && groupBy !== "cashier" && (
                    <div className="w-full min-w-0 overflow-hidden rounded-sm border border-gray-200">
                        <div className="px-4 py-3">
                            <Typography className="font-semibold!">Cashier Rollup</Typography>
                        </div>
                        <KitMuiTable
                            columns={cashierColumns}
                            rows={outstandingSummary?.data?.cashiers ?? []}
                            rowCount={outstandingSummary?.data?.cashiers?.length}
                            getRowId={(row, index) => `cashier-${index}`}
                            paginationMode="client"
                        />
                    </div>
                )}
            </div>
        </>
    );
}
