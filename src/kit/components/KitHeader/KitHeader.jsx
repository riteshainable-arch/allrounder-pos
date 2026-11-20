import { Typography } from "@mui/material";
import KitIcon from "../KitIcon/KitIcon";

const KitHeader = ({
    title,
    subtitle,
    icon = "tabler:layout-dashboard",
    count,
    countLabel = "records",
    iconClassName = "bg-primary/10 text-primary",
}) => {
    return (
        <div className="flex items-center gap-2">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}>
                <KitIcon icon={icon} className="text-xl" />
            </div>

            <div className="min-w-0">
                <div className="flex items-center gap-4">
                    <Typography className="truncate text-base! font-semibold! leading-5! text-app-text!">{title}</Typography>
                    {count !== undefined && count !== null && (
                        <span className="text-xs font-semibold text-primary">
                            {count} {countLabel}
                        </span>
                    )}
                </div>
                {subtitle && (
                    <Typography className="truncate text-xs! text-app-text-secondary!">{subtitle}</Typography>
                )}
            </div>
        </div>
    );
};

export default KitHeader;