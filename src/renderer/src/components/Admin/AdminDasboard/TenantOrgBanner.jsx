import KitIcon from "../../../../../kit/components/KitIcon/KitIcon";
import storage from "../../../../../kit/hooks/data/services/storage";

const toneClasses = {
    danger: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    neutral: "border-blue-100 bg-blue-50 text-blue-900",
};

const formatTenantExpiry = (value) => {
    if (!value) return "No expiry set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "No expiry set";

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const getTenantExpiryState = (user) => {
    const expiresAt = user?.tenantExpiresAt ? new Date(user.tenantExpiresAt) : null;
    const hasValidExpiry = expiresAt && !Number.isNaN(expiresAt.getTime());

    if (user?.tenantStatus === "suspended") {
        return { tone: "danger", label: "Suspended", message: "Your organization is suspended." };
    }

    if (user?.tenantStatus === "expired" || (hasValidExpiry && expiresAt < new Date())) {
        return {
            tone: "danger",
            label: "Expired",
            message: `Subscription expired on ${formatTenantExpiry(user?.tenantExpiresAt)}.`,
        };
    }

    if (hasValidExpiry) {
        const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 14) {
            return {
                tone: "warning",
                label: "Expiring soon",
                message: `Subscription expires on ${formatTenantExpiry(user?.tenantExpiresAt)} (${daysLeft} day(s) left).`,
            };
        }
    }

    return {
        tone: "neutral",
        label: hasValidExpiry ? "Active" : "No expiry",
        message: hasValidExpiry
            ? `Subscription valid until ${formatTenantExpiry(user?.tenantExpiresAt)}.`
            : "No subscription expiry configured.",
    };
};

export default function TenantOrgBanner() {
    const user = storage.getItem("userData") || null;
    if (!user?.tenantId) return null;

    const expiryState = getTenantExpiryState(user);
    const orgName = user.tenantDisplayName || "AllRounder";

    return (
        <div className={`rounded-xl border px-3 py-3 md:px-4 ${toneClasses[expiryState.tone]}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80 md:text-xs">
                        Your Organization
                    </p>
                    <p className="mt-1 text-sm font-semibold md:text-base">{orgName}</p>
                    <p className="mt-1 text-xs opacity-90 md:text-sm">{expiryState.message}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-[10px] md:text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 font-medium capitalize md:px-2.5">
                        <KitIcon icon="tabler:building" className="text-xs md:text-sm" />
                        {user.adminType || "retailer"}
                    </span>
                    {user.tenantGstNumber && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 font-medium md:px-2.5">
                            <KitIcon icon="tabler:id" className="text-xs md:text-sm" />
                            GST {user.tenantGstNumber}
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 font-medium md:px-2.5">
                        <KitIcon icon="tabler:calendar" className="text-xs md:text-sm" />
                        {expiryState.label}
                    </span>
                </div>
            </div>
        </div>
    );
}
