import KitModal from "../../../../kit/components/KitModal";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import { priceFormat } from "../../../../kit/utils/priceFormat";
import { Typography } from "@mui/material";
import { getDifference, getIdealCash, getStatus } from "../../../../kit/utils/general";
import KitMuiTable from "../../../../kit/components/KitMuiTable";
import { EllipsisText } from "../../../../kit/utils/ellipsisText";

const ManagerCollectModal = ({ isOpen, onClose, rows }) => {
    const columns = [
        {
            field: 'userId',
            headerName: 'User Id',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <Typography variant='body1' className="text-sm!">
                    {params.row.userId}
                </Typography>
            )
        },
        {
            field: 'userName',
            headerName: 'User Name',
            minWidth: 150,
            flex: 1,
            renderCell: (params) => (
                <EllipsisText className='text-sm!' text={params.row.userName || "-"} />
            )
        },
        {
            field: "totalSales",
            headerName: "Total Sales",
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Typography className="text-sm!">
                    {priceFormat(params.row.online + params.row.cash)}
                </Typography>
            ),
        },
        {
            field: "amountReceived",
            headerName: "Amount Received",
            flex: 1,
            minWidth: 170,
            renderCell: (params) => (
                <Typography className="text-sm!">
                    {priceFormat(params.row.amountReceived)}
                </Typography>
            ),
        },
        {
            field: "difference",
            headerName: "Difference",
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Typography
                    className={`text-sm! ${getDifference(params.row) < 0
                        ? "text-red-600!"
                        : getDifference(params.row) > 0
                            ? "text-orange-600!"
                            : "text-green-600!"
                        }`}
                >
                    {priceFormat(getDifference(params.row))}
                </Typography>
            ),
        },
    ];

    const handleCollect = () => {
        const payload = rows.map(row => ({
            id: row.id,
            userId: row.userId,
            userName: row.userName,
            invoices: row.invoices,
            online: row.online,
            sodexo: row.sodexo,
            cash: row.cash,
            advance: row.advance,
            voucher: row.voucher,
            totalSales: row.online + row.cash,
            noOfSalesReturn: row.noOfSalesReturn,
            saleReturnAmount: row.saleReturnAmount,
            idealCash: getIdealCash(row),
            amountReceived: row.amountReceived,
            difference: getDifference(row),
            status: getStatus(row),
        }));
    }

    return (
        <>
            <KitModal
                maxWidth="lg"
                isOpen={isOpen}
                onClose={onClose}
                title={<div className="text-base font-semibold">Collect Preview</div>}
                titleClass="border-b p-3"
            >
                <div className="p-4 pb-0">
                    <KitMuiTable
                        columns={columns}
                        rows={rows}
                        paginationMode="client"
                    />
                </div>

                <div className="p-4 flex justify-end gap-3">
                    <KitButton
                        className='w-auto'
                        variant="outlined"
                        size='small'
                        onClick={onClose}
                    >
                        Cancel
                    </KitButton>
                    <KitButton
                        variant="contained"
                        className="w-auto"
                        size='small'
                        onClick={handleCollect}
                    >
                        Save
                    </KitButton>
                </div>
            </KitModal>
        </>
    );
};

export default ManagerCollectModal;