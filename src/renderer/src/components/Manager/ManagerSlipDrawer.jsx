import React, { useEffect, useState } from 'react'
import KitDrawer from '../../../../kit/components/KitDrawer/KitDrawer'
import { createPortal } from 'react-dom'
import { Chip } from '@mui/material'
import { priceFormat } from '../../../../kit/utils/priceFormat'
import { getPersonDisplayName } from '../../../../kit/utils/invoiceBill'
import { STATUS_COLORS } from './ManagerAdvanceSlipsPanel'
import { format } from 'date-fns'

const ManagerSlipDrawer = ({ isOpen, onClose, detailSlip }) => {

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    return createPortal(
        <KitDrawer
            isOpen={isOpen}
            onClose={onClose}
            title={<div className="text-lg font-semibold">Slip Details</div>}
            children={
                <div className="flex flex-col gap-5 p-5">
                    <div className="rounded-2xl border border-gray-200 p-5 shadow-sm">
                        <div className="text-xl font-bold">
                            {detailSlip?.slipNumber}
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                            <div className="text-3xl font-bold">
                                {priceFormat(detailSlip?.amount)}
                            </div>

                            <Chip
                                size="small"
                                label={detailSlip?.status}
                                color={STATUS_COLORS[detailSlip?.status] || "default"}
                            />
                        </div>
                    </div>

                    <div className="rounded-xl border p-4">
                        <div className="font-semibold mb-3">People</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-third-500">Cashier</div>
                                <div className="font-medium">
                                    {getPersonDisplayName(detailSlip?.cashier)}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-third-500">Manager</div>
                                <div className="font-medium">
                                    {getPersonDisplayName(detailSlip?.manager)}
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="rounded-xl border p-4">
                        <div className="font-semibold mb-3">Timeline</div>

                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span>Slip Date</span>
                                <span>{detailSlip?.slipDate}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Time</span>
                                <span>{detailSlip?.timeOfDay}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Cashier Remark</span>
                                <span>{detailSlip?.cashierRemark || "-"}</span>
                            </div>
                            {detailSlip?.rejectedReason && (
                                <div className="flex justify-between">
                                    <span>Rejection Reason</span>
                                    <span>{detailSlip?.rejectedReason}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>Created</span>
                                <span>
                                    {detailSlip?.createdAt
                                        ? format(new Date(detailSlip.createdAt), "dd MMM yyyy hh:mm aa")
                                        : "-"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Approved</span>
                                <span>
                                    {detailSlip?.approvedAt
                                        ? format(new Date(detailSlip.approvedAt), "dd MMM yyyy hh:mm aa")
                                        : "-"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Approved By</span>
                                <span>
                                    {getPersonDisplayName(detailSlip?.approvedBy)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            }
        />,
        document.body
    )
}

export default ManagerSlipDrawer