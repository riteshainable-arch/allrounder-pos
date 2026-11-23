import { useEffect, useState } from "react";
import KitDataGrid from "../../../../kit/components/KitDataGrid/KitDataGrid";
import { EllipsisText } from "../../../../kit/utils/ellipsisText";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import { useNavigate } from "react-router-dom";
import { Backdrop, Chip, CircularProgress, Tooltip, Typography } from "@mui/material";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitDebouncedInput from "../../../../kit/components/KitDebouncedInput";
import InvoiceModal from "../../components/Bills/InvoiceModal";
import KOTPrintModal from "../../components/Dashboard/KOTPrintModal";
import EditBillDetailsModal from "../../components/Bills/EditBillDetailsModal";
import useOnlineStatus from "../../../../kit/hooks/useOnlineStatus";
import { toast } from "react-toastify";
import { formatBillPaymentsSummary, getPaymentModeLabel, normalizeBillPayments } from "../../../../kit/utils/billPayments";
import { filterBillsForCashier } from "../../../../kit/utils/cashierBills";
import useUser from "../../../../kit/hooks/useUser";
import { paymentMethodConst } from "../../../../kit/configs/general";
import { uploadInvoicesToServer } from "../../../../kit/utils/syncOperations";

export default function Bills() {
    const navigate = useNavigate();
    const userData = useUser();
    const isOnline = useOnlineStatus();
    const [editBill, setEditBill] = useState(null);
    const [search, setSearch] = useState('')
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
    const [selectedInvoiceList, setSelectedInvoiceList] = useState(null);
    const [isKOTModalOpen, setIsKOTModalOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const toggleInvoiceModal = () => setIsInvoiceModalOpen(!isInvoiceModalOpen);
    const toggleKOTModal = () => setIsKOTModalOpen(!isKOTModalOpen);

    useEffect(() => {
        loadBills();
    }, [userData?.id, userData?.userId, userData?.email]);

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


    const handleViewItems = (items) => {
        setSelectedInvoiceList(items);
        toggleInvoiceModal();
    }

    const handleKOTPrint = (item) => {
        setSelectedInvoiceList(item);
        toggleKOTModal()
    };

    const filteredRows = rows.filter((row) => {
        const keyword = search.trim().toLowerCase();

        if (!keyword) return true;

        return (
            row?.indexNo?.toLowerCase().includes(keyword) ||
            row?.customerName?.toLowerCase().includes(keyword) ||
            row?.date?.includes(keyword)
        );
    });

    const handleUploadBills = async () => {
        if (!rows.length) {
            toast.warning("No bills available to upload.");
            return;
        }

        setIsUploading(true);
        try {
            const result = await uploadInvoicesToServer({ userData });
            toast.success(result.message);
        } catch (error) {
            toast.error(error?.message || "Unable to upload bills.");
        } finally {
            setIsUploading(false);
        }
    };

    const columns = [
        {
            field: 'indexNo',
            headerName: 'Bill No',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params.row.indexNo}
                </Typography>
            )
        },
        {
            field: 'customerName',
            headerName: 'Customer Name',
            minWidth: 400,
            flex: 1,
            renderCell: (params) => (
                <EllipsisText className='text-sm!' text={params.row.customerName || "-"} />
            )
        },
        {
            field: 'customerPhone',
            headerName: 'Customer Number',
            minWidth: 180,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params.row.customerPhone || '-'}
                </Typography>
            )
        },
        {
            field: 'rating',
            headerName: 'Rating',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params.row.storeRating}
                </Typography>
            )
        },
        {
            field: 'paymentMethod',
            headerName: 'Payment',
            minWidth: 260,
            flex: 1.2,
            sortable: false,
            renderCell: (params) => {
                const payments = normalizeBillPayments(params.row);

                if (!payments.length) {
                    return (
                        <Typography variant='body1' className="text-sm!">
                            {getPaymentModeLabel(params.row.paymentMethod) || '-'}
                        </Typography>
                    );
                }

                return (
                    <Tooltip title={formatBillPaymentsSummary(params.row)} placement="top">
                        <div className="flex flex-wrap gap-1 py-1">
                            {payments.map((payment, index) => (
                                <Chip
                                    key={`${payment.paymentMode}-${index}`}
                                    size="small"
                                    label={`${getPaymentModeLabel(payment.paymentMode)} ${priceFormat(payment.amount)}`}
                                    color={
                                        payment.paymentMode === paymentMethodConst.CASH
                                            ? "warning"
                                            : payment.paymentMode === paymentMethodConst.CREDIT_SALE
                                                ? "error"
                                                : "success"
                                    }
                                    variant="outlined"
                                />
                            ))}
                        </div>
                    </Tooltip>
                );
            }
        },
        {
            field: 'totalAmount',
            headerName: 'Total',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {priceFormat(params.row.totalAmount)}
                </Typography>
            )
        },
        {
            field: 'payAmount',
            headerName: 'Pay Amount',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {priceFormat(params.row.payAmount)}
                </Typography>
            )
        },
        {
            field: 'savingAmount',
            headerName: 'Saving Amount',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {priceFormat(params.row.savingAmount)}
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
                    {params.row.totalItems}
                </Typography>
            )
        },
        {
            field: 'createdAt',
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
            width: 270,
            sortable: false,
            disableColumnMenu: true,
            headerClassName: 'sticky-column',
            cellClassName: 'sticky-column',
            renderCell: (params) => (
                <div className="flex gap-2">
                    <Tooltip
                        title={
                            !isOnline
                                ? "Internet is needed to edit a bill"
                                : params.row.syncStatus !== "SYNCED"
                                  ? "Upload this bill to the server first"
                                  : ""
                        }
                    >
                        <span>
                            <KitButton
                                size="small"
                                className='w-fit'
                                variant="outlined"
                                disabled={!isOnline || params.row.syncStatus !== "SYNCED"}
                                onClick={() => setEditBill(params.row)}
                            >
                                Edit
                            </KitButton>
                        </span>
                    </Tooltip>
                    <KitButton
                        size="small"
                        className='w-fit'
                        variant="contained"
                        onClick={() => handleKOTPrint(params.row)}
                    >
                        Print KOT
                    </KitButton>
                    <KitButton
                        size="small"
                        className='w-fit'
                        variant="contained"
                        onClick={() => handleViewItems(params.row)}
                    >
                        View
                    </KitButton>
                </div>
            )
        },
    ];

    return (
        <>
            <Backdrop open={isUploading} sx={{ zIndex: 9999, color: "#fff" }}>
                <CircularProgress color="inherit" />
            </Backdrop>

            <div className="p-3">
                <div className="flex justify-between items-center mb-3">
                    <div className="text-lg font-semibold">Bill History</div>
                    <div className="flex gap-2">
                        <KitDebouncedInput
                            value={search}
                            onChange={(value) => setSearch(String(value))}
                            placeholder="Search by Bill No or Customer Name"
                            className='w-72'
                        />

                        <KitButton
                            type="button"
                            variant="contained"
                            size="small"
                            className='w-fit! h-fit!'
                            startIcon={<KitIcon icon='tabler:home' className="text-sm!" />}
                            onClick={() => navigate('/dashboard')}
                        >
                            Home
                        </KitButton>

                        <KitButton
                            size="small"
                            variant="contained"
                            className="w-auto"
                            startIcon={<KitIcon icon="tabler:upload" className="text-sm!" />}
                            isLoading={isUploading}
                            disabled={isUploading}
                            onClick={handleUploadBills}
                        >
                            Upload to Server
                        </KitButton>
                    </div>
                </div>
                <KitDataGrid
                    rows={filteredRows}
                    columns={columns}
                    rowCount={filteredRows?.length}
                    paginationMode="client"
                    disableRowSelectionOnClick
                    getRowId={(row) => row.id}
                />
            </div>

            <KitShow show={Boolean(editBill)}>
                <EditBillDetailsModal
                    key={editBill?.indexNo}
                    isOpen={Boolean(editBill)}
                    onClose={() => setEditBill(null)}
                    bill={editBill}
                    onSaved={(updated) =>
                        setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)))
                    }
                />
            </KitShow>

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
        </>
    );
}