import { Tooltip, Typography } from "@mui/material";

export const EllipsisText = ({ text, className }) => (
    <Tooltip title={text} arrow>
        <Typography noWrap sx={{ overflow: "hidden", textOverflow: "ellipsis" }} className={className}>
            {text}
        </Typography>
    </Tooltip>
)