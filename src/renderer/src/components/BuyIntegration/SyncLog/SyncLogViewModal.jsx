import KitModal from "../../../../../kit/components/KitModal";
import KitButton from "../../../../../kit/components/KitButton/KitButton";
import { useSyncLogDetail } from "../../../../../kit/hooks/data/busy";
import { Divider, Paper, Typography } from "@mui/material";
import { entityLabels } from "../../../pages/busy-Integration/sync-logs";
import { SyncBadge } from "../../../../../kit/utils/syncBadge";
import KitLoader from "../../../../../kit/components/KitLoader/KitLoader";

export default function SyncLogViewModal({ open, onClose, selectedItem }) {
    const { syncLogDetails, isSyncLogDetailsLoading, syncLogDetailsError } = useSyncLogDetail(
        Boolean(selectedItem?.id),
        String(selectedItem?.id)
    );

    const detail = syncLogDetails?.data || {};

    const formatJson = (value) => JSON.stringify(value ?? null, null, 2);

    const JsonSection = ({ title, value }) => (
        <div className="flex flex-col gap-2">
            <Typography variant="subtitle2" fontWeight={600}>
                {title}
            </Typography>

            <Paper elevation={0} className="rounded-lg! overflow-hidden! border! border-gray-200!">
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap wrap-break-words bg-gray-900 p-3 text-xs leading-5 text-gray-100">
                    {formatJson(value)}
                </pre>
            </Paper>
        </div>
    );

    return (
        <KitModal
            maxWidth="lg"
            isOpen={open}
            onClose={onClose}
            title={
                <div className="flex flex-col gap-1">
                    <div className="text-base font-semibold text-third-950">
                        {entityLabels[syncLogDetails?.data?.entityType]} {syncLogDetails?.localRef}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-third-500">
                        <span>Reference: {detail.reference || "—"}</span>
                        <span>·</span>
                        <span>HTTP: {detail.httpStatus ?? "—"}</span>
                        <span>·</span>
                        <span>Request: {detail.requestId || "—"}</span>
                    </div>
                </div>
            }
            titleClass="p-3! border-b"
        >
            <div className="p-4 flex flex-col gap-4">
                {isSyncLogDetailsLoading ? (
                    <div className="h-80 flex justify-center">
                        <KitLoader logo={false} isLoading={true} />
                    </div>
                ) : syncLogDetailsError ? (
                    <div className="items-center h-[70vh] flex justify-center">
                        <Typography variant="h6" color="error">
                            Something went wrong!
                        </Typography>
                    </div>
                ) : detail ? (
                    <>
                        <Paper elevation={0} className="rounded-xl! border! border-gray-200! p-3!">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-col gap-1">
                                    <Typography variant="caption" color="text.secondary">
                                        Entity
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {entityLabels[detail.entityType] ?? detail.entityType}
                                    </Typography>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <Typography variant="caption" color="text.secondary">
                                        Direction
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {detail.direction === "pull" ? "BUSY → CRM" : "CRM → BUSY"}
                                    </Typography>
                                </div>

                                <div className="flex flex-col gap-1">
                                    <Typography variant="caption" color="text.secondary">
                                        Status
                                    </Typography>
                                    <SyncBadge status={detail.status} />
                                </div>

                                <div className="flex flex-col gap-1">
                                    <Typography variant="caption" color="text.secondary">
                                        BUSY Company
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {detail.companyCode || "—"}
                                    </Typography>
                                </div>
                            </div>
                        </Paper>

                        {detail.errorMessage && (
                            <Paper elevation={0} className="rounded-xl! border! border-red-200! bg-red-50! p-3!">
                                {detail.errorCode && (
                                    <Typography variant="caption" fontWeight={600} className="text-red-700!">
                                        {detail.errorCode}
                                    </Typography>
                                )}
                                <Typography variant="body2" className="text-red-800!">
                                    {detail.errorMessage}
                                </Typography>
                            </Paper>
                        )}

                        <Divider />

                        <JsonSection title="Sent to BUSY" value={detail.requestPayload} />
                        <JsonSection title="BUSY Answer" value={detail.responseBody} />
                    </>
                ) : (
                    <Typography variant="body2" color="text.secondary">
                        No sync log details found.
                    </Typography>
                )}
            </div>

            <div className="px-4 py-3 flex justify-end gap-3">
                <KitButton variant="outlined" className="w-auto" size="small" onClick={onClose}>
                    Cancel
                </KitButton>
            </div>
        </KitModal>
    );
}
