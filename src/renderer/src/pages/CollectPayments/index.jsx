import { useEffect, useMemo, useRef, useState } from "react";
import KitDataGrid from "../../../../kit/components/KitDataGrid/KitDataGrid";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import { useNavigate } from "react-router-dom";
import { Chip, Typography, Grid, CardContent, styled, Backdrop, CircularProgress, Paper } from "@mui/material";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitDebouncedInput from "../../../../kit/components/KitDebouncedInput";
import InvoiceModal from "../../components/Bills/InvoiceModal";
import KitSelect from "../../../../kit/components/KitSelect";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { EXPORT_LIMIT, paymentMethodConst, paymentTypeOptions } from "../../../../kit/configs/general";
import { billHasCashPayment, formatBillPaymentsSummary, getPaymentModeLabel, normalizeBillPayments } from "../../../../kit/utils/billPayments";
import { filterBillsForCashier } from "../../../../kit/utils/cashierBills";
import useUser from "../../../../kit/hooks/useUser";
import MuiCard from "@mui/material/Card";
import { DEFAULT_STORE_ID, uploadInvoicesToServer } from "../../../../kit/utils/syncOperations";
import { useAutoSyncContext } from "../../../../kit/hooks/AutoSyncProvider";
import { toast } from "react-toastify";
import KOTPrintModal from "../../components/Dashboard/KOTPrintModal";
import { fetchInvoiceBills, useInvoiceBills } from "../../../../kit/hooks/data/invoice";
import useOnlineStatus from "../../../../kit/hooks/useOnlineStatus";
import ManagerUnlockModal from "../../components/Dashboard/ManagerUnlockModal";
import { format } from "date-fns";
import ShortcutBadge from "../../components/Dashboard/ShortcutBadge";
import { downloadCsv, downloadXlsx } from "../../../../kit/utils/exportFile";
import { useGetAllCustomerList } from "../../../../kit/hooks/data/customer";
import KitHeader from "../../../../kit/components/KitHeader/KitHeader";

const getBillPayable = (row) => Number(row?.netPayable ?? row?.payAmount ?? row?.totalAmount ?? 0);
const getCustomerKey = (row) => String(row?.customerPhone ?? row?.customerName ?? row?.customer?.phone ?? row?.customer?.firstName ?? "unknown");
const getCustomerLabel = (row) => {
    const customerName = row?.customerName ?? row?.customer?.firstName;
    const customerPhone = row?.customerPhone ?? row?.customer?.phone;

    if (customerName && customerPhone) {
        return `${customerName} (${customerPhone})`;
    }
    return customerName || customerPhone || "Unknown Customer";
};

const Card = styled(MuiCard)(({ color }) => ({
    transition: 'border 0.3s ease-in-out, box-shadow 0.3s ease-in-out, margin 0.3s ease-in-out',
    borderBottomWidth: '2px',
    borderBottomColor: `var(--mui-palette-${color}-main) !important`,
    '[data-skin="bordered"] &:hover': {
        boxShadow: 'none'
    },
}))

export default function CollectPayments() {
    const isOnline = useOnlineStatus();
    const navigate = useNavigate();
    const userData = useUser();
    const searchRef = useRef(null);
    const customerRef = useRef(null);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const invoiceRef = useRef(null);
    const paymentRef = useRef(null);
    const posRef = useRef(null);
    const syncRef = useRef(null);
    const collectRequestRef = useRef(null);
    const clearFiltersRef = useRef(null);
    const today = format(new Date(), "yyyy-MM-dd");

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('')
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [isKOTModalOpen, setIsKOTModalOpen] = useState(false);
    const [isManagerUnlockModalOpen, setIsManagerUnlockModalOpen] = useState(false);
    const [selectedInvoiceList, setSelectedInvoiceList] = useState(null);
    const [paymentType, setPaymentType] = useState('')
    const [selectedCustomer, setSelectedCustomer] = useState('')
    const [invoiceNo, setInvoiceNo] = useState("");
    const [startDate, setStartDate] = useState(today)
    const [endDate, setEndDate] = useState(today);
    const [selectedRows, setSelectedRows] = useState([]);
    const [isSyncLoading, setIsStoreLoading] = useState(false);
    const [activeRowIndex, setActiveRowIndex] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const [rowSelectionModel, setRowSelectionModel] = useState({
        type: "include",
        ids: new Set(),
    });

    const storeId = userData?.storeId || DEFAULT_STORE_ID;
    const params = {
        page: page,
        limit: pageSize,
        storeId,
        ...(search && { search: search }),
        ...(startDate && { startDate: startDate }),
        ...(endDate && { endDate: endDate }),
        ...(paymentType && { paymentType: paymentType }),
        ...(selectedCustomer && { customerId: selectedCustomer }),
        ...(invoiceNo && { invoiceNo: invoiceNo }),
    };

    const { invoiceBills, isInvoiceBillsLoading, invoiceBillsError, refreshInvoiceBills } = useInvoiceBills(params);
    const { customerList, isCustomerListLoading } = useGetAllCustomerList();

    const toggleInvoiceModal = () => setIsInvoiceModalOpen(!isInvoiceModalOpen);
    const toggleKOTModal = () => setIsKOTModalOpen(!isKOTModalOpen);
    const toggleManagerUnlockModal = () => setIsManagerUnlockModalOpen(!isManagerUnlockModalOpen);

    const handleKOTPrint = (item) => {
        setSelectedInvoiceList(item);
        toggleManagerUnlockModal()
    };

    const handleViewItems = (items) => {
        setSelectedInvoiceList(items);
        toggleInvoiceModal();
    }

    const handleSelectionChange = (model) => {
        setRowSelectionModel(model);
        if (isOnline) {
            const selectedData = (invoiceBills?.data?.bills || []).filter((row) =>
                model.ids.has(row.invoiceNo)
            );
            setSelectedRows(selectedData);
        } else {
            const selectedData = rows.filter((row) => model.ids.has(row.indexNo));
            setSelectedRows(selectedData);
        }
    };

    const handleCollectRequest = () => {
        console.log("CollectRequest", selectedRows);
    }

    const customerOptions = useMemo(() => {
        return [
            { label: "All Customers", value: "" },
            ...(customerList?.data?.map((customer) => ({
                label: `${customer.firstName}${customer.lastName ? ` - ${customer.lastName}` : ""}`,
                value: customer.id,
            })) ?? []),
        ];
    }, [customerList]);

    const filteredRows = useMemo(() => rows.filter((row) => {
        const keyword = search.trim().toLowerCase();

        const matchesSearch =
            !keyword ||
            row?.transactionId?.toLowerCase().includes(keyword) ||
            row?.date?.includes(keyword) ||
            row?.customerName?.toLowerCase().includes(keyword) ||
            row?.customerPhone?.includes(keyword)

        const matchesPaymentType =
            !paymentType ||
            row.paymentMethod === paymentType ||
            normalizeBillPayments(row).some((payment) => payment.paymentMode === paymentType);

        const matchesCustomer =
            !selectedCustomer ||
            getCustomerKey(row) === selectedCustomer;

        const matchesDate = !startDate || row.date === startDate;

        const matchesInvoiceNo = !invoiceNo || String(row?.indexNo ?? "").toLowerCase().includes(invoiceNo.toLowerCase());

        return matchesSearch && matchesPaymentType && matchesCustomer && matchesDate && matchesInvoiceNo;
    }), [rows, search, paymentType, selectedCustomer, startDate, invoiceNo]);

    const summaryStats = useMemo(() => {
        const data = isOnline ? (invoiceBills?.data?.bills || []) : filteredRows;
        const totalOrders = data.length;
        const totalPayable = data.reduce((sum, row) => sum + getBillPayable(row), 0);
        const totalItems = data.reduce((sum, row) => sum + Number(row.totalItems || row.totalQty || 0), 0);

        return {
            totalOrders,
            totalPayable,
            totalItems,
        };
    }, [isOnline, invoiceBills, filteredRows]);

    const summaryCards = useMemo(() => ([
        {
            title: "Total Orders",
            stats: isOnline ? invoiceBills?.data?.summary?.totalOrders : summaryStats.totalOrders,
            color: "secondary",
            icon: "tabler:receipt",
        },
        {
            title: "Total Payable",
            stats: isOnline ? priceFormat(invoiceBills?.data?.summary?.totalPayable) : priceFormat(summaryStats.totalPayable),
            color: "primary",
            icon: "tabler:cash",
        },
        {
            title: "Total Items Sold",
            stats: isOnline ? invoiceBills?.data?.summary?.totalItemsSold : summaryStats.totalItems,
            color: "success",
            icon: "tabler:shopping-cart",
        },
    ]), [summaryStats]);

    const handleSync = async () => {
        if (!rows.length) {
            toast.warning("Nothing available to sync.");
            return;
        }
        setIsStoreLoading(true);
        try {
            await uploadInvoicesToServer({ userData });
            toast.success("Sync completed successfully.");
        } catch (error) {
            toast.error("Unable to sync day bills data.");
        } finally {
            setIsStoreLoading(false);
        }
    };

    const columns = [
        {
            field: isOnline ? "invoiceNo" : "indexNo",
            headerName: "Order ID",
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant="body1" className="text-sm!">
                    {isOnline ? params.row.invoiceNo : params.row.indexNo}
                </Typography>
            ),
        },
        {
            field: 'customerName',
            headerName: 'Customer',
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params?.row?.customerName ?? params?.row?.customer?.firstName ?? "-"}
                </Typography>
            )
        },
        {
            field: 'customerPhone',
            headerName: 'Customer Phone',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params?.row?.customerPhone ?? params?.row?.customer?.phone ?? "-"}
                </Typography>
            )
        },
        {
            field: 'paymentMethod',
            headerName: 'Payment Type',
            minWidth: 220,
            flex: 1,
            renderCell: (params) => {
                const payments = normalizeBillPayments(params.row);

                if (payments.length > 1) {
                    return (
                        <Chip
                            label={formatBillPaymentsSummary(params.row)}
                            color="info"
                            variant='outlined'
                            size='small'
                            className="text-xs!"
                        />
                    );
                }

                return (
                    <Chip
                        label={getPaymentModeLabel(params.row.paymentMethod) || "-"}
                        color={params.row.paymentMethod === paymentMethodConst.ONLINE ? "success" : "warning"}
                        variant='outlined'
                        size='small'
                        className="text-xs!"
                    />
                );
            }
        },
        {
            field: 'payAmount',
            headerName: 'Payable Amount',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {priceFormat(getBillPayable(params.row))}
                </Typography>
            )
        },
        {
            field: 'totalItems',
            headerName: 'Total Items',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params.row.totalItems ?? params?.row?.totalQty ?? 0}
                </Typography>
            )
        },
        {
            field: 'status',
            headerName: 'Status',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Chip
                    label='Completed'
                    variant='outlined'
                    color="success"
                    size='small'
                    className="text-xs!"
                />
            )
        },
        {
            field: 'date',
            headerName: 'Date',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params.row.date || '-'}
                </Typography>
            )
        },
        {
            field: 'actions',
            headerName: 'Actions',
            width: 120,
            sortable: false,
            disableColumnMenu: true,
            headerClassName: 'sticky-column',
            cellClassName: 'sticky-column',
            renderHeader: () => (
                <div className="flex flex-col gap-1 text-start">
                    <span>Actions</span>
                    <div className="flex items-center gap-10">
                        <span className="rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-700 h-4!">
                            F3
                        </span>
                        {/* <span className="rounded bg-blue-100 px-1 py-0.5 text-[9px] font-semibold text-blue-700 h-[16px]!">
                            Shift + I
                        </span> */}
                    </div>
                </div>
            ),
            renderCell: (params) => (
                <div className="flex gap-2">
                    <KitButton
                        size="small"
                        className='w-fit'
                        variant="contained"
                        onClick={() => handleKOTPrint(params.row)}
                    >
                        Print Invoice
                    </KitButton>
                    {/* <KitButton
                        size="small"
                        className='w-fit'
                        variant="contained"
                        onClick={() => handleViewItems(params.row)}
                    >
                        View Invoice
                    </KitButton> */}
                </div>
            )
        },
    ];

    const getExportParams = {
        page: 1,
        limit: EXPORT_LIMIT,
        storeId: storeId,
        ...(search && { search: search.trim() }),
        ...(startDate && { startDate: startDate }),
        ...(endDate && { endDate: endDate }),
        ...(paymentType && { paymentType: paymentType }),
        ...(selectedCustomer && { customerId: selectedCustomer }),
        ...(invoiceNo && { invoiceNo: invoiceNo }),
    };

    const handleExport = async (type) => {
        if (!dataRows.length) {
            toast.warning("No data available to export.");
            return;
        }

        setIsExporting(true);

        try {
            let bills = [];

            if (isOnline) {
                const response = await fetchInvoiceBills(getExportParams);
                bills = response?.data?.bills ?? [];
            } else {
                bills = filteredRows;
            }

            const exportRows = bills.slice(0, EXPORT_LIMIT).map((bill) => ({
                "Order ID": isOnline ? bill.invoiceNo ?? "-" : bill.indexNo ?? "-",
                Customer: bill.customerName ?? bill.customer?.firstName ?? "-",
                "Customer Phone": bill.customerPhone ?? bill.customer?.phone ?? "-",
                "Payment Type": formatBillPaymentsSummary(bill),
                "Payable Amount": priceFormat(bill.netPayable ?? bill.payAmount ?? bill.totalAmount ?? 0),
                "Total Items": bill.totalItems ?? bill.totalQty ?? 0,
                Status: "Completed",
                Date: bill.date ?? "-",
            }));

            const timestamp = format(new Date(), "yyyyMMdd_HHmmss");

            if (type === "csv") {
                downloadCsv(exportRows, `cashier_invoices_${timestamp}.csv`);
            } else {
                downloadXlsx(exportRows, `cashier_invoices_${timestamp}.xlsx`, "Cashier Invoices");
            }
        } catch (error) {
            toast.error(error?.message || "Export failed");
        } finally {
            setIsExporting(false);
        }
    };

    const dataRows = isOnline ? invoiceBills?.data?.bills || [] : filteredRows;

    useEffect(() => {
        if (dataRows.length > 0) {
            setActiveRowIndex(0);
        }
    }, [dataRows]);

    useEffect(() => {
        async function loadBills() {
            try {
                setLoading(true);
                if (!window.api) {
                    throw new Error('Electron API is not available. Make sure preload script is loaded.');
                }
                const data = await window.api.getBills();
                setRows(filterBillsForCashier(data, userData));
            } catch (error) {
                toast.error('Error loading bills: ' + error.message);
            } finally {
                setLoading(false);
            }
        }

        loadBills();
    }, [userData?.id, userData?.userId, userData?.email]);


    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!e.altKey) return;

            switch (e.key.toLowerCase()) {
                case "o":
                    searchRef.current?.focus();
                    return;

                case "c":
                    customerRef.current?.focus();
                    return;

                case "s":
                    startDateRef.current?.focus();
                    return;

                case "e":
                    endDateRef.current?.focus();
                    return;

                case "i":
                    invoiceRef.current?.focus();
                    return;

                case "p":
                    paymentRef.current?.focus();
                    return;

                case "b":
                    posRef.current?.click();
                    return;

                case "y":
                    syncRef.current?.click();
                    return;

                case "r":
                    collectRequestRef.current?.click();
                    return;

                case "x":
                    clearFiltersRef.current?.click();
                    return;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!dataRows.length) return;

            if (e.key === "F3") {
                e.preventDefault();
                handleKOTPrint(dataRows[activeRowIndex]);
                return;
            }

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setActiveRowIndex(prev => Math.min(prev + 1, dataRows.length - 1));
                    break;

                case "ArrowUp":
                    e.preventDefault();
                    setActiveRowIndex(prev => Math.max(prev - 1, 0));
                    break;

                case "Enter":
                    e.preventDefault();
                    const row = dataRows[activeRowIndex];
                    const rowId = isOnline ? row.invoiceNo : row.indexNo;
                    const ids = new Set(rowSelectionModel.ids);

                    if (ids.has(rowId)) {
                        ids.delete(rowId);      // optional: Enter toggles selection
                    } else {
                        ids.add(rowId);         // keep previous selections
                    }
                    handleSelectionChange({ type: "include", ids });
                    break;

                default:
                    break;
            }

        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeRowIndex, dataRows, rowSelectionModel]);

    return (
        <>
            <Backdrop open={isSyncLoading || loading || isExporting} sx={{ zIndex: 9999, color: "#fff" }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <div className="p-3">
                <div className="mb-3 flex flex-col gap-3">
                    <div className="flex justify-between">
                        <KitHeader
                            title='Invoices'
                            subtitle="View and manage invoices"
                            icon="tabler:file-invoice"
                            count={invoiceBills?.data?.pagination?.totalItems ?? 0}
                            countLabel="records"
                        />
                        
                        <div className="flex flex-wrap items-center gap-2 ml-auto">
                            <div className="relative">
                                <ShortcutBadge shortcut="Alt + R" />
                                <KitButton
                                    ref={collectRequestRef}
                                    type="button"
                                    variant="contained"
                                    size="small"
                                    className='w-fit! h-fit!'
                                    color="warning"
                                    disabled={selectedRows.length === 0}
                                    onClick={() => handleCollectRequest()}
                                    startIcon={<KitIcon icon='tabler:cash' className="text-sm!" />}
                                >
                                    Collect Request
                                </KitButton>
                            </div>

                            <div className="relative">
                                <ShortcutBadge shortcut="Alt + B" />
                                <KitButton
                                    ref={posRef}
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
                                <ShortcutBadge shortcut="Alt + Y" />
                                <KitButton
                                    ref={syncRef}
                                    size="small"
                                    variant="contained"
                                    className="w-auto"
                                    startIcon={<KitIcon icon="tabler:refresh" className="text-sm!" />}
                                    isLoading={isSyncLoading}
                                    disabled={isSyncLoading}
                                    onClick={handleSync}
                                >
                                    Sync
                                </KitButton>
                            </div>
                        </div>
                    </div>

                    <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl bg-white">
                        <div className="flex flex-wrap items-end gap-x-2 gap-y-6">
                            <div className="relative">
                                <ShortcutBadge shortcut="Alt + O" />
                                <KitDebouncedInput
                                    ref={searchRef}
                                    value={search}
                                    onChange={(value) => setSearch(String(value))}
                                    placeholder="Search order, customer, date..."
                                    className='w-52'
                                    size="small"
                                />
                            </div>

                            <div className="relative min-w-52 w-52">
                                <ShortcutBadge shortcut="Alt + C" className="top-0" />
                                <KitSelect
                                    ref={customerRef}
                                    label="Customer"
                                    placeholder="Filter by Customer"
                                    placeholderFontSize={14}
                                    inputFontSize={14}
                                    size="small"
                                    options={customerOptions}
                                    menuShouldScrollIntoView={false}
                                    styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
                                    value={customerOptions.find((opt) => opt.value === selectedCustomer) ?? customerOptions[0]}
                                    onChange={(option) => setSelectedCustomer(option?.value || '')}
                                />
                            </div>

                            <div className="relative">
                                <ShortcutBadge shortcut="Alt + S" className="top-0" />
                                <KitTextField
                                    inputRef={startDateRef}
                                    label="Start Date"
                                    size="small"
                                    height="32px"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-44"
                                />
                            </div>

                            <div className="relative">
                                <ShortcutBadge shortcut="Alt + E" className="top-0" />
                                <KitTextField
                                    inputRef={endDateRef}
                                    label="End Date"
                                    size="small"
                                    height="32px"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-44"
                                />
                            </div>

                            <div className="relative">
                                <ShortcutBadge shortcut="Alt + I" className="top-0" />
                                <KitTextField
                                    inputRef={invoiceRef}
                                    size="small"
                                    height="32px"
                                    label="Invoice No"
                                    value={invoiceNo}
                                    placeholderFontSize={14}
                                    onChange={(e) => setInvoiceNo(e.target.value)}
                                    placeholder="e.g. BILL-1784"
                                    className="w-44"
                                />
                            </div>

                            <div className="relative w-44">
                                <ShortcutBadge shortcut="Alt + P" className="top-0" />
                                <KitSelect
                                    ref={paymentRef}
                                    label="Payment type"
                                    placeholder="Filter Payment Type"
                                    placeholderFontSize={14}
                                    inputFontSize={14}
                                    size="small"
                                    options={paymentTypeOptions}
                                    menuShouldScrollIntoView={false}
                                    styles={{ menu: (provided) => ({ ...provided, zIndex: 9999 }) }}
                                    value={paymentTypeOptions.find((opt) => opt.value === paymentType) ?? null}
                                    onChange={(option) => setPaymentType(option?.value || '')}
                                />
                            </div>

                            {(startDate || endDate || selectedCustomer || paymentType || invoiceNo) && (
                                <div className="relative">
                                    <ShortcutBadge shortcut="Alt + X" />
                                    <KitButton
                                        ref={clearFiltersRef}
                                        type="button"
                                        variant="outlined"
                                        size="small"
                                        className="w-fit! h-fit!"
                                        onClick={() => {
                                            setStartDate(today);
                                            setEndDate(today)
                                            setSelectedCustomer("");
                                            setPaymentType("");
                                            setInvoiceNo("")
                                        }}
                                    >
                                        Clear Filters
                                    </KitButton>
                                </div>
                            )}
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
                </div>

                <Grid container spacing={2} className="mb-3">
                    {summaryCards.map((item, index) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                            <Card color={item?.color || 'primary'}>
                                <CardContent className='flex flex-col gap-1 p-3!'>
                                    <div className='flex items-center gap-2'>
                                        <div
                                            className="flex items-center justify-center rounded-lg w-9 h-9"
                                            style={{
                                                backgroundColor: `rgba(var(--mui - palette - ${item.color} -mainChannel) / 0.15)`
                                            }}
                                        >
                                            <KitIcon
                                                icon={item.icon}
                                                fontSize={20}
                                                style={{
                                                    color: `var(--mui - palette - ${item.color} -main)`
                                                }}
                                            />
                                        </div>
                                        <Typography variant='h5'>{item?.stats}</Typography>
                                    </div>
                                    <Typography className="text-third-950 text-sm!">{item?.title}</Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>

                {isOnline ? (
                    <KitDataGrid
                        rows={invoiceBills?.data?.bills}
                        columns={columns}
                        rowCount={invoiceBills?.data?.pagination?.totalItems}
                        getRowId={(row) => row.invoiceNo}
                        rowHeight={50}
                        pageSize={pageSize}
                        setPage={setPage}
                        setPageSize={setPageSize}
                        error={!!invoiceBillsError}
                        disableRowSelectionOnClick
                        checkboxSelection
                        rowSelection
                        isRowSelectable={(params) => billHasCashPayment(params.row)}
                        rowSelectionModel={rowSelectionModel}
                        onRowSelectionModelChange={handleSelectionChange}
                        getRowClassName={(params) => {
                            const index = dataRows.findIndex(
                                row => (row.invoiceNo) === (params.row.invoiceNo)
                            );
                            return index === activeRowIndex ? "active-row" : "";
                        }}
                        sx={(theme) => ({
                            "& .MuiDataGrid-row.Mui-selected": {
                                backgroundColor: "inherit !important",
                            },

                            "& .MuiDataGrid-row.Mui-selected:hover": {
                                backgroundColor: "inherit !important",
                            },

                            "& .active-row": {
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "rgba(59, 130, 246, 0.25) !important"
                                        : "#E3F2FD !important",
                            },

                            "& .active-row:hover": {
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "rgba(59, 130, 246, 0.35) !important"
                                        : "#BBDEFB !important",
                            },

                            "& .active-row.Mui-selected": {
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "rgba(59, 130, 246, 0.25) !important"
                                        : "#E3F2FD !important",
                            },

                            "& .active-row.Mui-selected:hover": {
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "rgba(59, 130, 246, 0.35) !important"
                                        : "#BBDEFB !important",
                            },
                        })}
                        onRowClick={(params) => {
                            const index = dataRows.findIndex(
                                row => (row.invoiceNo) === (params.row.invoiceNo)
                            );
                            setActiveRowIndex(index);
                        }}
                    />
                ) : (
                    <KitDataGrid
                        rows={filteredRows}
                        columns={columns}
                        rowCount={filteredRows?.length}
                        paginationMode="client"
                        rowHeight={60}
                        getRowId={(row) => row.indexNo}
                        disableRowSelectionOnClick
                        checkboxSelection
                        rowSelection
                        isRowSelectable={(params) => billHasCashPayment(params.row)}
                        rowSelectionModel={rowSelectionModel}
                        onRowSelectionModelChange={handleSelectionChange}
                        getRowClassName={(params) => {
                            const index = dataRows.findIndex(
                                row => (row.indexNo) === (params.row.indexNo)
                            );
                            return index === activeRowIndex ? "active-row" : "";
                        }}
                        sx={{
                            "& .MuiDataGrid-row.Mui-selected": {
                                backgroundColor: "inherit !important",
                            },

                            "& .MuiDataGrid-row.Mui-selected:hover": {
                                backgroundColor: "inherit !important",
                            },

                            "& .active-row": {
                                backgroundColor: "#E3F2FD !important",
                            },

                            "& .active-row:hover": {
                                backgroundColor: "#BBDEFB !important",
                            },

                            "& .active-row.Mui-selected": {
                                backgroundColor: "#E3F2FD !important",
                            },

                            "& .active-row.Mui-selected:hover": {
                                backgroundColor: "#BBDEFB !important",
                            },
                        }}
                        onRowClick={(params) => {
                            const index = dataRows.findIndex(
                                row => (row.indexNo) === (params.row.indexNo)
                            );
                            setActiveRowIndex(index);
                        }}
                    />
                )}
            </div>

            <KitShow show={isInvoiceModalOpen}>
                <InvoiceModal
                    isOpen={isInvoiceModalOpen}
                    onClose={toggleInvoiceModal}
                    selectedInvoiceList={selectedInvoiceList}
                />
            </KitShow>

            <KitShow show={isKOTModalOpen}>
                <KOTPrintModal
                    isOpen={isKOTModalOpen}
                    onClose={toggleKOTModal}
                    selectedItems={selectedInvoiceList}
                />
            </KitShow>

            <KitShow show={isManagerUnlockModalOpen}>
                <ManagerUnlockModal
                    isOpen={isManagerUnlockModalOpen}
                    onClose={toggleManagerUnlockModal}
                    onSuccess={() => {
                        toggleManagerUnlockModal();
                        toggleKOTModal();
                    }}
                />
            </KitShow>
        </>
    );
}
