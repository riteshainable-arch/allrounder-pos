import { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Chip,
    CircularProgress,
    Collapse,
    Divider,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { format, parseISO, subDays } from "date-fns";
import debounce from "lodash/debounce";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitTextField from "../../../../kit/components/KitTextField/KitTextField";
import { useInvoiceBillDetail, useInvoiceBills } from "../../../../kit/hooks/data/invoice";
import useUser from "../../../../kit/hooks/useUser";
import { paymentMethodConst } from "../../../../kit/configs/general";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import {
    getPersonDisplayName,
    normalizeInvoiceBillResponse,
    getInvoiceItemName,
    getInvoiceItemQty,
    getInvoiceItemRate,
    getInvoiceItemTotal,
    getInvoiceItemCode,
    getInvoiceItemMrp,
    isInvoiceFreeItem,
    mergeInvoiceBillWithLocal,
} from "../../../../kit/utils/invoiceBill";
import {
    getPaymentModeLabel,
    normalizeBillPayments,
} from "../../../../kit/utils/billPayments";
import ShortcutBadge from "../Dashboard/ShortcutBadge";

const DEFAULT_STORE_ID = 1;
const MIN_SEARCH_LEN = 2;

const getCustomerLabel = (bill = {}) =>
    getPersonDisplayName(bill.customer) !== "-"
        ? getPersonDisplayName(bill.customer)
        : bill.customer?.phone || "-";

const formatBillWhen = (bill = {}) => {
    const datePart = bill.date || "-";
    const timePart = bill.createdAt ? format(parseISO(bill.createdAt), "hh:mm a") : "";
    return timePart ? `${datePart}, ${timePart}` : datePart;
};

const buildQueryParams = ({
    storeId,
    startDate,
    endDate,
    search,
    customerPhone,
    customerName,
    orderNo,
}) => {
    const params = {
        page: 1,
        limit: 25,
        storeId,
        startDate,
        endDate,
    };

    const phone = customerPhone.trim();
    const name = customerName.trim();
    const invoice = orderNo.trim();
    const keyword = search.trim();

    if (phone.length >= MIN_SEARCH_LEN) {
        params.search = phone;
        return params;
    }
    if (invoice.length >= MIN_SEARCH_LEN) {
        params.invoiceNo = invoice;
        return params;
    }
    if (name.length >= MIN_SEARCH_LEN) {
        params.customerName = name;
        return params;
    }
    if (keyword.length >= MIN_SEARCH_LEN) {
        params.search = keyword;
        return params;
    }

    return null;
};

const hasActiveFilter = ({ search, customerPhone, customerName, orderNo }) =>
    search.trim().length >= MIN_SEARCH_LEN ||
    customerPhone.trim().length >= MIN_SEARCH_LEN ||
    customerName.trim().length >= MIN_SEARCH_LEN ||
    orderNo.trim().length >= MIN_SEARCH_LEN;

export default function SaleReturnInvoicePicker({
    initiatedBy,
    onProceed,
    onCancel,
    isLoadingOriginal = false,
}) {
    const userData = useUser();
    const startReturnButtonRef = useRef(null);
    const storeId = userData?.storeId || DEFAULT_STORE_ID;
    const today = format(new Date(), "yyyy-MM-dd");
    const monthAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [debouncedPhone, setDebouncedPhone] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [debouncedName, setDebouncedName] = useState("");
    const [orderNo, setOrderNo] = useState("");
    const [debouncedOrderNo, setDebouncedOrderNo] = useState("");
    const [startDate, setStartDate] = useState(monthAgo);
    const [endDate, setEndDate] = useState(today);
    const [selectedInvoiceNo, setSelectedInvoiceNo] = useState("");
    const [selectedListRow, setSelectedListRow] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const [localBill, setLocalBill] = useState(null);

    const debounceSearch = useMemo(
        () => debounce((value) => setDebouncedSearch(value), 350),
        []
    );
    const debouncePhone = useMemo(
        () => debounce((value) => setDebouncedPhone(value), 350),
        []
    );
    const debounceName = useMemo(
        () => debounce((value) => setDebouncedName(value), 350),
        []
    );
    const debounceOrder = useMemo(
        () => debounce((value) => setDebouncedOrderNo(value), 350),
        []
    );

    useEffect(() => () => {
        debounceSearch.cancel();
        debouncePhone.cancel();
        debounceName.cancel();
        debounceOrder.cancel();
    }, [debounceSearch, debouncePhone, debounceName, debounceOrder]);

    const filterValues = useMemo(
        () => ({
            search: debouncedSearch,
            customerPhone: debouncedPhone,
            customerName: debouncedName,
            orderNo: debouncedOrderNo,
        }),
        [debouncedSearch, debouncedPhone, debouncedName, debouncedOrderNo]
    );

    const isFiltering = hasActiveFilter(filterValues);
    const isSearchPending =
        search.trim() !== debouncedSearch.trim() ||
        customerPhone.trim() !== debouncedPhone.trim() ||
        customerName.trim() !== debouncedName.trim() ||
        orderNo.trim() !== debouncedOrderNo.trim();

    const queryParams = useMemo(
        () =>
            buildQueryParams({
                storeId,
                startDate,
                endDate,
                ...filterValues,
            }),
        [storeId, startDate, endDate, filterValues]
    );

    const { invoiceBills, isInvoiceBillsLoading } = useInvoiceBills(
        queryParams,
        Boolean(queryParams)
    );
    const { invoiceBillDetail, isInvoiceBillDetailLoading } = useInvoiceBillDetail(
        selectedInvoiceNo,
        Boolean(selectedInvoiceNo)
    );

    useEffect(() => {
        if (!selectedInvoiceNo) {
            setLocalBill(null);
            return;
        }

        let cancelled = false;

        const loadLocalBill = async () => {
            if (!window.api?.getBills) return;

            try {
                const bills = await window.api.getBills();
                const match = bills.find(
                    (bill) =>
                        bill.billNumber === selectedInvoiceNo ||
                        bill.invoiceNo === selectedInvoiceNo
                );

                if (!cancelled && match) {
                    setLocalBill(match);
                }
            } catch {
                if (!cancelled) {
                    setLocalBill(null);
                }
            }
        };

        loadLocalBill();

        return () => {
            cancelled = true;
        };
    }, [selectedInvoiceNo]);

    const bills = (invoiceBills?.data?.bills || []).filter((bill) => !bill.isReturnBill);

    const detailBill = useMemo(() => {
        const apiBill = normalizeInvoiceBillResponse(invoiceBillDetail);
        const merged = mergeInvoiceBillWithLocal(apiBill, localBill);

        if (selectedListRow && !merged.items?.length) {
            return mergeInvoiceBillWithLocal(merged, selectedListRow);
        }

        return merged;
    }, [invoiceBillDetail, localBill, selectedListRow]);

    const detailItems = detailBill.items || [];
    const payments = normalizeBillPayments(detailBill);

    const handleSelectBill = (bill) => {
        setSelectedInvoiceNo(bill.invoiceNo);
        setSelectedListRow(bill);
    };

    const clearSelection = () => {
        setSelectedInvoiceNo("");
        setSelectedListRow(null);
        setLocalBill(null);
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key.toLowerCase() === "s") {
                e.preventDefault();

                if (selectedInvoiceNo && !isLoadingOriginal) {
                    startReturnButtonRef.current?.click();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedInvoiceNo, isLoadingOriginal]);

    return (
        <div className="flex flex-col gap-3 min-h-[520px] max-h-[70vh]">
            <Alert severity="info" className="text-sm! shrink-0">
                Unlocked by <b>{getPersonDisplayName(initiatedBy)}</b>. Search by phone, customer name, or
                invoice number to find the order for return.
            </Alert>

            {!selectedInvoiceNo ? (
                <Paper elevation={0} className="p-3 border border-gray-200 rounded-xl bg-transparent! shrink-0">
                    <KitTextField
                        autoFocus
                        size="small"
                        placeholderFontSize={14}
                        value={search}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSearch(value);
                            debounceSearch(value);
                        }}
                        placeholder="Search by mobile, customer name, or invoice no..."
                        startIcon={<SearchIcon fontSize="small" color="action" />}
                        className="w-full"
                    />

                    <div className="flex items-center justify-between mt-2">
                        <Typography className="text-xs! text-third-500">
                            {isFiltering
                                ? "Select an order from search results below"
                                : "Enter phone, name, or invoice number to search"}
                        </Typography>
                        <KitButton
                            size="small"
                            variant="text"
                            className="w-auto! min-w-0! text-xs!"
                            onClick={() => setShowFilters((prev) => !prev)}
                            endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        >
                            {showFilters ? "Hide filters" : "More filters"}
                        </KitButton>
                    </div>

                    <Collapse in={showFilters}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                            <KitTextField
                                label="Customer Phone"
                                size="small"
                                placeholderFontSize={14}
                                value={customerPhone}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                                    setCustomerPhone(value);
                                    debouncePhone(value);
                                }}
                                placeholder="10-digit mobile"
                            />
                            <KitTextField
                                label="Customer Name"
                                size="small"
                                placeholderFontSize={14}
                                value={customerName}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setCustomerName(value);
                                    debounceName(value);
                                }}
                                placeholder="e.g. Raj"
                            />
                            <KitTextField
                                label="Invoice / Order No"
                                size="small"
                                placeholderFontSize={14}
                                value={orderNo}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    setOrderNo(value);
                                    debounceOrder(value);
                                }}
                                placeholder="e.g. BILL-1784"
                            />
                            <div className="grid grid-cols-2 gap-2">
                                <KitTextField
                                    label="From"
                                    type="date"
                                    size="small"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                                <KitTextField
                                    label="To"
                                    type="date"
                                    size="small"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </Collapse>

                    {isFiltering && (
                        <Paper
                            elevation={0}
                            className="mt-3 border border-gray-200 rounded-lg overflow-hidden bg-transparent!"
                        >
                            <div className="px-3 py-2 border-b flex items-center justify-between">
                                <Typography className="text-sm! font-semibold!">
                                    Search Results
                                </Typography>
                                {isInvoiceBillsLoading && <CircularProgress size={16} />}
                            </div>
                            <div className="max-h-56 overflow-y-auto">
                                {isSearchPending || (isInvoiceBillsLoading && !bills.length) ? (
                                    <div className="flex items-center gap-2 px-3 py-4 text-sm text-third-500">
                                        <CircularProgress size={16} />
                                        Searching orders...
                                    </div>
                                ) : bills.length ? (
                                    bills.map((bill) => (
                                        <button
                                            key={bill.invoiceNo}
                                            type="button"
                                            className="w-full text-left px-3 py-2.5 border-b border-gray-100 bg-transparent! last:border-b-0 flex justify-between gap-3 hover:bg-third-50!"
                                            onClick={() => handleSelectBill(bill)}
                                        >
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold truncate">
                                                    {bill.invoiceNo}
                                                </div>
                                                <div className="text-xs text-third-500 truncate">
                                                    {getCustomerLabel(bill)}
                                                    {bill.customer?.phone ? ` · ${bill.customer.phone}` : ""}
                                                </div>
                                                <div className="text-xs text-third-500">
                                                    {formatBillWhen(bill)} · {bill.itemCount ?? 0} items
                                                </div>
                                            </div>
                                            <div className="text-sm font-bold text-green-700 shrink-0">
                                                {priceFormat(bill.payAmount ?? bill.totalAmount ?? 0)}
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="px-3 py-4 text-sm text-third-500 text-center">
                                        No orders found. Try another phone number or invoice no.
                                    </div>
                                )}
                            </div>
                        </Paper>
                    )}
                </Paper>
            ) : (
                <Paper
                    elevation={0}
                    className="px-3 py-2 border border-orange-200 rounded-xl bg-orange-50 shrink-0 flex items-center justify-between gap-3"
                >
                    <div className="min-w-0">
                        <Typography className="text-sm! font-semibold! truncate">
                            {selectedListRow?.invoiceNo || selectedInvoiceNo}
                        </Typography>
                        <Typography className="text-xs! text-third-500 truncate">
                            {getCustomerLabel(selectedListRow || detailBill)}
                            {selectedListRow?.customer?.phone || detailBill.customer?.phone
                                ? ` · ${selectedListRow?.customer?.phone || detailBill.customer?.phone}`
                                : ""}
                            {" · "}
                            {priceFormat(detailBill.payAmount ?? selectedListRow?.payAmount ?? detailBill.totalAmount ?? 0)}
                        </Typography>
                    </div>
                    <KitButton
                        size="small"
                        variant="outlined"
                        className="w-auto shrink-0"
                        onClick={clearSelection}
                    >
                        Change Order
                    </KitButton>
                </Paper>
            )}

            <Paper
                elevation={0}
                className="border border-gray-200 rounded-xl flex flex-col flex-1 min-h-0 bg-transparent!"
            >
                <div className="px-3 py-2 border-b bg-transparent! shrink-0">
                    <Typography className="text-sm! font-semibold!">Invoice Details</Typography>
                </div>

                <div className="p-3 flex-1 overflow-y-auto min-h-0">
                    {!selectedInvoiceNo ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <VisibilityIcon sx={{ fontSize: 40, color: "#94a3b8", mb: 1 }} />
                            <Typography className="text-sm! text-third-500">
                                Search and select an order to view invoice details.
                            </Typography>
                        </div>
                    ) : isInvoiceBillDetailLoading ? (
                        <div className="flex justify-center py-16">
                            <CircularProgress size={28} />
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 mb-3 text-sm">
                                <div>
                                    <span className="text-third-500">Invoice</span>
                                    <div className="font-semibold">{detailBill.invoiceNo || selectedInvoiceNo}</div>
                                </div>
                                <div>
                                    <span className="text-third-500">Date</span>
                                    <div>{formatBillWhen(detailBill)}</div>
                                </div>
                                <div>
                                    <span className="text-third-500">Customer</span>
                                    <div>{getCustomerLabel(detailBill)}</div>
                                </div>
                                <div>
                                    <span className="text-third-500">Phone</span>
                                    <div>{detailBill.customer?.phone || selectedListRow?.customer?.phone || "-"}</div>
                                </div>
                                <div>
                                    <span className="text-third-500">Cashier</span>
                                    <div>{getPersonDisplayName(detailBill.createdBy || selectedListRow?.createdBy)}</div>
                                </div>
                                <div>
                                    <span className="text-third-500">Items</span>
                                    <div>
                                        {detailBill.itemCount ?? detailItems.length}
                                        {detailBill.totalQty != null ? ` (${detailBill.totalQty} pcs)` : ""}
                                    </div>
                                </div>
                                <div>
                                    <span className="text-third-500">MRP Total</span>
                                    <div className="font-semibold">{priceFormat(detailBill.totalAmount || 0)}</div>
                                </div>
                                {detailBill.savingAmount != null && Number(detailBill.savingAmount) > 0 && (
                                    <div>
                                        <span className="text-third-500">Saving</span>
                                        <div className="font-semibold text-primary">
                                            {priceFormat(detailBill.savingAmount)}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <span className="text-third-500">Paid</span>
                                    <div className="font-bold text-green-700">
                                        {priceFormat(detailBill.payAmount ?? selectedListRow?.payAmount ?? 0)}
                                    </div>
                                </div>
                            </div>

                            {payments.length > 0 && (
                                <div className="mb-3">
                                    <Typography className="text-xs! font-semibold! text-third-500 mb-1">
                                        Payments
                                    </Typography>
                                    <div className="flex flex-wrap gap-1">
                                        {payments.map((payment, index) => (
                                            <Chip
                                                key={`${payment.paymentMode}-${index}`}
                                                size="small"
                                                variant="outlined"
                                                color={
                                                    payment.paymentMode === paymentMethodConst.CASH
                                                        ? "warning"
                                                        : "success"
                                                }
                                                label={`${getPaymentModeLabel(payment.paymentMode)} ${priceFormat(payment.amount)}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            <Divider className="my-2" />

                            <div className="flex items-center gap-2 mb-2">
                                <Typography className="text-sm! font-semibold!"> Line Items</Typography>
                                <Typography className="text-sm! text-third-500">
                                    ({detailItems.length ?? 0} records)
                                </Typography>
                            </div>
                            {!detailItems.length ? (
                                <Typography className="text-xs! text-third-500">No line items.</Typography>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>#</TableCell>
                                                <TableCell>Item</TableCell>
                                                <TableCell align="right">Qty</TableCell>
                                                <TableCell align="right">Rate</TableCell>
                                                <TableCell align="right">Total</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {detailItems.map((item, index) => {
                                                const isFree = isInvoiceFreeItem(item);
                                                const itemCode = getInvoiceItemCode(item);
                                                const mrp = getInvoiceItemMrp(item);

                                                return (
                                                    <TableRow key={item.id ?? `${itemCode}-${index}`}>
                                                        <TableCell>{index + 1}</TableCell>
                                                        <TableCell>
                                                            <div>{getInvoiceItemName(item)}</div>
                                                            {itemCode && (
                                                                <Typography className="text-xs! text-third-500">
                                                                    {itemCode}
                                                                </Typography>
                                                            )}
                                                            {isFree && (
                                                                <Chip
                                                                    size="small"
                                                                    label="Free (Offer)"
                                                                    color="success"
                                                                    variant="outlined"
                                                                    className="mt-1!"
                                                                />
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {getInvoiceItemQty(item)}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {isFree ? (
                                                                <div>
                                                                    <Typography className="text-sm! text-green-600!">
                                                                        Free
                                                                    </Typography>
                                                                    {mrp > 0 && (
                                                                        <Typography className="text-xs! text-third-500 line-through">
                                                                            MRP {priceFormat(mrp)}
                                                                        </Typography>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                priceFormat(getInvoiceItemRate(item))
                                                            )}
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            {isFree ? (
                                                                <Typography className="text-sm! text-green-600!">
                                                                    Free
                                                                </Typography>
                                                            ) : (
                                                                priceFormat(getInvoiceItemTotal(item))
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="p-3 pt-6 border-t flex justify-end gap-2 shrink-0">
                    <KitButton
                        variant="outlined"
                        size="small"
                        className="w-auto"
                        onClick={onCancel}
                    >
                        Cancel
                    </KitButton>
                    <div className="relative">
                        <ShortcutBadge shortcut="Alt + S" className="-top-5" />
                        <KitButton
                            ref={startReturnButtonRef}
                            variant="contained"
                            color="warning"
                            size="small"
                            className="w-auto"
                            disabled={!selectedInvoiceNo || isLoadingOriginal}
                            isLoading={isLoadingOriginal}
                            onClick={() => onProceed?.(selectedInvoiceNo)}
                        >
                            Start Return
                        </KitButton>
                    </div>
                </div>
            </Paper>
        </div>
    );
}
