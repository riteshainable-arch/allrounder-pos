/* eslint-disable react/prop-types */
import { forwardRef } from "react";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const dateFieldStyles = (theme, size, height) => ({
    width: "100%",
    "& .MuiInputLabel-root": {
        transform: "none",
        position: "relative",
        width: "fit-content",
        maxWidth: "100%",
        lineHeight: 1.153,
        fontSize: "0.8125rem",
        marginBottom: "0.25rem",
        color: theme.palette.text.primary,
    },
    "& .MuiInputLabel-root.Mui-focused:not(.Mui-error)": {
        color: theme.palette.primary.main,
    },
    "& .MuiInputLabel-root.Mui-error": {
        color: theme.palette.error.main,
    },
    "& .MuiFormLabel-root": {
        zIndex: 0,
    },
    "& .MuiPickersInputBase-root": {
        boxSizing: "border-box",
        height: height || (size === "small" ? 32 : 40),
        minHeight: height || (size === "small" ? 32 : 40),
        border: `1px solid ${theme.palette.customColors?.inputBorder || theme.palette.divider}`,
        borderRadius: size === "small" ? "6px" : "8px",
        backgroundColor: "transparent",
        "&::before, &::after": {
            display: "none",
        },
        "&:hover:not(.Mui-disabled):not(.Mui-error)": {
            borderColor: theme.palette.action.active,
            backgroundColor: "transparent",
        },
        "&.Mui-focused": {
            borderWidth: 2,
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.palette.customShadows?.primary?.sm || "none",
        },
        "&.Mui-error": {
            borderColor: theme.palette.error.main,
        },
        "&.Mui-disabled": {
            backgroundColor: theme.palette.action.hover,
        },
    },
    "& .MuiPickersInputBase-sectionsContainer": {
        padding: size === "small" ? "0 10px" : "0 16px",
        fontSize: size === "small" ? 14 : 17,
        lineHeight: 1.4,
    },
    "& .MuiPickersInputBase-sectionContent": {
        padding: 0,
    },
    "& .MuiFormHelperText-root": {
        lineHeight: 1.154,
        margin: "0.25rem 0 0",
        fontSize: "0.8125rem",
    },
});

const KitDatePicker = forwardRef(function KitDatePicker(
    { size = "small", height, fullWidth = true, slotProps, error, helperText, inputRef, ...datePickerProps },
    ref
) {
    const textFieldSlotProps = slotProps?.textField || {};

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
                ref={ref}
                {...datePickerProps}
                slotProps={{
                    ...slotProps,
                    textField: {
                        variant: "filled",
                        size,
                        fullWidth,
                        ...(error !== undefined && { error }),
                        ...(helperText !== undefined && { helperText }),
                        ...(inputRef && { inputRef }),
                        ...textFieldSlotProps,
                        sx: [
                            (theme) => dateFieldStyles(theme, size, height),
                            ...(Array.isArray(textFieldSlotProps.sx)
                                ? textFieldSlotProps.sx
                                : textFieldSlotProps.sx
                                  ? [textFieldSlotProps.sx]
                                  : []),
                        ],
                    },
                }}
            />
        </LocalizationProvider>
    );
});

KitDatePicker.displayName = "KitDatePicker";

export default KitDatePicker;
