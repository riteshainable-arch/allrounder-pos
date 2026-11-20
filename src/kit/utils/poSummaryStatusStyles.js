export const normalizePoSummaryStatus = (status) => {
    const normalized = String(status ?? "").trim().toLowerCase();
    if (
        normalized === "pending" ||
        normalized === "partial" ||
        normalized === "fulfilled" ||
        normalized === "cancelled"
    ) {
        return normalized;
    }

    return "default";
};

export const poSummaryStatusLabel = {
    pending: "Pending",
    partial: "Partial",
    fulfilled: "Fulfilled",
    cancelled: "Cancelled",
    default: "Unknown",
};

export const poSummaryStatusBadgeClass = {
    pending: "bg-amber-100 ring-1 ring-inset ring-amber-200",
    partial: "bg-blue-100 ring-1 ring-inset ring-blue-300",
    fulfilled: "bg-green-100 ring-1 ring-inset ring-green-200",
    cancelled: "bg-rose-100 ring-1 ring-inset ring-rose-200",
    default: "bg-gray-100 ring-1 ring-inset ring-gray-200",
};

export const poSummaryStatusTextColor = {
    pending: "#92400e",
    partial: "#1e40af",
    fulfilled: "#166534",
    cancelled: "#9f1239",
    default: "#374151",
};

export const poSummaryStatusRowClass = {
    pending: "status-pending",
    partial: "status-partial",
    fulfilled: "status-fulfilled",
    cancelled: "status-cancelled",
    default: "status-default",
};

export const poSummaryStatusRowSx = {
    "& .status-pending": {
        backgroundColor: "#FEFCE8",
        borderLeft: "4px solid #FACC15",
    },
    "& .status-partial": {
        backgroundColor: "#EFF6FF",
        borderLeft: "4px solid #60A5FA",
    },
    "& .status-fulfilled": {
        backgroundColor: "#F0FDF4",
        borderLeft: "4px solid #22C55E",
    },
    "& .status-cancelled": {
        backgroundColor: "#FFF1F2",
        borderLeft: "4px solid #FB7185",
    },
    "& .status-default": {
        backgroundColor: "#FFFFFF",
        borderLeft: "4px solid #E5E7EB",
    },
    "& .MuiDataGrid-row:hover": {
        filter: "brightness(0.97)",
    },
};

export const getPoSummaryStatusRowClass = (status) =>
    poSummaryStatusRowClass[normalizePoSummaryStatus(status)];

export const getPoSummaryStatusBadgeClass = (status) =>
    poSummaryStatusBadgeClass[normalizePoSummaryStatus(status)];

export const getPoSummaryStatusLabel = (status) =>
    poSummaryStatusLabel[normalizePoSummaryStatus(status)];