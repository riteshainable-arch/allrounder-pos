import { Chip } from "@mui/material";

const statusConfig = {
    verified: { label: "Verified in BUSY", bg: "#dcfce7", color: "#166534" },
    success: { label: "In BUSY", bg: "#d1fae5", color: "#047857" },
    linked: { label: "Linked", bg: "#d1fae5", color: "#047857" },
    created: { label: "Created", bg: "#d1fae5", color: "#047857" },
    updated: { label: "Updated", bg: "#d1fae5", color: "#047857" },
    imported: { label: "Imported", bg: "#d1fae5", color: "#047857" },
    partial: { label: "Partial", bg: "#ffedd5", color: "#9a3412" },
    running: { label: "Running", bg: "#dbeafe", color: "#1d4ed8" },
    pending: { label: "Pending", bg: "#fef3c7", color: "#92400e" },
    uncertain: { label: "Unconfirmed", bg: "#ffedd5", color: "#9a3412" },
    failed: { label: "Failed", bg: "#fee2e2", color: "#b91c1c" },
    skipped: { label: "Skipped", bg: "#f3f4f6", color: "#4b5563" },
    not_pushed: { label: "Not pushed", bg: "#f3f4f6", color: "#4b5563" },
};

export function SyncBadge({ status }) {
    const key = status?.toLowerCase() || "not_pushed";

    const config = statusConfig[key] || {
        label: key.replace(/_/g, " "),
        bg: "#f3f4f6",
        color: "#4b5563",
    };

    return (
        <Chip
            label={config.label}
            size="small"
            sx={{
                height: 23,
                width: "fit-content",
                borderRadius: "6px",
                backgroundColor: config.bg,
                color: config.color,
                fontSize: "11px",
                fontWeight: 600,
                "& .MuiChip-label": {
                    px: 1,
                },
            }}
        />
    );
}