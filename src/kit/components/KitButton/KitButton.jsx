import { forwardRef } from "react";
import { Button, CircularProgress } from "@mui/material";
import KitShow from "../KitShow/KitShow";

const KitButton = forwardRef(function KitButton(
    { sx = {}, children, isLoading = false, ...rest },
    ref
) {
    return (
        <Button
            ref={ref}
            disableRipple
            sx={{
                borderRadius: "6px !important",
                textTransform: "none",
                boxShadow: "none",
                "&:focus": {
                    outline: "2px solid #cda500",
                    outlineOffset: "2px",
                },
                ...sx,
            }}
            className="max-sm:is-full is-auto"
            {...rest}
        >
            <KitShow show={isLoading}>
                <CircularProgress sx={{ mr: 3 }} color="inherit" size={18} />
            </KitShow>
            {children}
        </Button>
    )
})

export default KitButton