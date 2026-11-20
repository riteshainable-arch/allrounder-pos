"use client";

import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import ReactDatePickerComponent from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { forwardRef } from "react";

const StyledReactDatePicker = styled(Box)(() => ({
  "& .react-datepicker-popper": {
    zIndex: 1400,
    paddingTop: "4px !important",
  },

  "& .react-datepicker-wrapper": {
    width: "100%",
  },

  "& .react-datepicker__triangle": {
    display: "none",
  },

  /* Main calendar */
  "& .react-datepicker": {
    color: "var(--mui-palette-text-primary)",
    backgroundColor: "var(--mui-palette-background-paper)",
    border: "1px solid var(--mui-palette-customColors-inputBorder)",
    borderRadius: "8px",
    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.18)",
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },

  /* Header */
  "& .react-datepicker__header": {
    position: "relative",
    height: "40px",
    padding: 0,
    border: "none",
    borderBottom: "1px solid var(--mui-palette-customColors-inputBorder)",
    backgroundColor: "var(--mui-palette-background-paper)",
    color: "var(--mui-palette-text-primary)",
    boxSizing: "border-box",
  },

  "& .react-datepicker__current-month, & .react-datepicker-year-header": {
    display: "flex",
    alignItems: "center",
    height: "40px",
    margin: 0,
    padding: "0 90px 0 16px",
    boxSizing: "border-box",
    textAlign: "left",
    color: "var(--mui-palette-text-primary)",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: "1",
  },

  /* Navigation */
  "& .react-datepicker__navigation": {
    position: "absolute",
    top: "14px",
    width: "30px",
    height: "30px",
    margin: 0,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    borderRadius: "6px",
    backgroundColor: "transparent",
    cursor: "pointer",
    zIndex: 5,
    boxSizing: "border-box",
  },

  "& .react-datepicker__navigation:hover": {
    backgroundColor: "var(--mui-palette-action-hover)",
  },

  /* Remove react-datepicker's default text/icon positioning */
  "& .react-datepicker__navigation-icon": {
    position: "relative",
    top: "0",
    left: "0",
    display: "block",
    width: "8px",
    height: "8px",
    margin: 0,
  },

  /* Arrow */
  "& .react-datepicker__navigation-icon::before": {
    content: '""',
    position: "absolute",
    top: "0",
    width: "8px",
    height: "8px",
    borderColor: "var(--mui-palette-text-secondary)",
    borderStyle: "solid",
    borderWidth: "1.5px 1.5px 0 0",
  },

  "& .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before": {
    borderColor: "var(--mui-palette-text-primary)",
  },

  /* Previous */
  "& .react-datepicker__navigation--previous": {
    top: "5px",
    left: "auto",
    right: "48px",
  },

  "& .react-datepicker__navigation--previous .react-datepicker__navigation-icon::before": {
    left: "2px",
    transform: "rotate(-135deg)",
  },

  /* Next */
  "& .react-datepicker__navigation--next": {
    top: "5px",
    left: "auto",
    right: "12px",
  },

  "& .react-datepicker__navigation--next .react-datepicker__navigation-icon::before": {
    left: "-2px",
    transform: "rotate(45deg)",
  },

  /* Days header */
  "& .react-datepicker__day-name": {
    width: "2.25rem",
    margin: 0,
    color: "var(--mui-palette-text-secondary)",
    fontSize: "12px",
    fontWeight: 600,
  },

  "& .react-datepicker__day-names": {
    marginBottom: 0,
  },

  /* Days */
  "& .react-datepicker__day": {
    width: "2.25rem",
    margin: 0,
    borderRadius: "6px",
    lineHeight: "2.25rem",
    color: "var(--mui-palette-text-primary)",
    fontSize: "12px",
  },

  "& .react-datepicker__day:hover": {
    backgroundColor: "var(--mui-palette-action-hover)",
    color: "var(--mui-palette-text-primary)",
  },

  /* Selected day */
  "& .react-datepicker__day--selected, & .react-datepicker__month-text--selected, & .react-datepicker__year-text--selected, & .react-datepicker__quarter-text--selected":
    {
      color: "var(--mui-palette-primary-contrastText) !important",
      background: "var(--mui-palette-primary-main) !important",
      boxShadow: "none",
    },

  "& .react-datepicker__day--selected:hover, & .react-datepicker__month-text--selected:hover, & .react-datepicker__year-text--selected:hover": {
    color: "var(--mui-palette-primary-contrastText) !important",
    background: "var(--brand-gradient-button) !important",
  },

  /* Selected month */
  "& .react-datepicker__month-text--selected": {
    color: "var(--mui-palette-primary-contrastText) !important",
    background: "var(--mui-palette-primary-main) !important",
    borderRadius: "6px",
    boxShadow: "none",
  },

  "& .react-datepicker__month-text--selected:hover": {
    color: "var(--mui-palette-primary-contrastText) !important",
    background: "var(--brand-gradient-button) !important",
  },

  "& .react-datepicker__month-text--keyboard-selected:not([aria-disabled='true'])": {
    color: "var(--foreground) !important",
  },

  /* Today */
  "& .react-datepicker__day--today": {
    fontWeight: 600,
  },

  "& .react-datepicker__day--today:not(.react-datepicker__day--selected)": {
    color: "var(--mui-palette-primary-main)",
    backgroundColor: "transparent",
  },

  /* Keyboard selected */
  "& .react-datepicker__day--keyboard-selected:not(.react-datepicker__day--in-range)": {
    color: "var(--mui-palette-primary-main)",
    backgroundColor: "var(--mui-palette-action-hover)",
  },

  /* Disabled / outside month */
  "& .react-datepicker__day--outside-month, & .react-datepicker__day--disabled:not(.react-datepicker__day--selected)": {
    color: "var(--mui-palette-text-disabled)",
  },

  "& .react-datepicker__day--disabled:hover": {
    backgroundColor: "transparent",
  },

  /* Range */
  "& .react-datepicker__day--in-range, & .react-datepicker__day--in-selecting-range": {
    borderRadius: 0,
    color: "var(--mui-palette-primary-main) !important",
    backgroundColor: "color-mix(in srgb, var(--mui-palette-primary-main) 12%, transparent) !important",
  },

  "& .react-datepicker__day--range-start": {
    borderRadius: "6px 0 0 6px",
  },

  "& .react-datepicker__day--range-end": {
    borderRadius: "0 6px 6px 0",
  },

  /* Month / Year picker */
  "& .react-datepicker__month-text, & .react-datepicker__year-text, & .react-datepicker__quarter-text": {
    margin: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "6px",
    color: "var(--mui-palette-text-primary)",
    fontSize: "12px",
    lineHeight: "2rem",
  },

  "& .react-datepicker__month-text:hover, & .react-datepicker__year-text:hover, & .react-datepicker__quarter-text:hover": {
    backgroundColor: "var(--mui-palette-action-hover)",
  },

  /* Month / Year dropdown */
  "& .react-datepicker__month-dropdown, & .react-datepicker__year-dropdown": {
    padding: "8px",
    border: "1px solid var(--mui-palette-customColors-inputBorder)",
    borderRadius: "8px",
    backgroundColor: "var(--mui-palette-background-paper)",
    boxShadow: "0 18px 45px rgba(0, 0, 0, 0.18)",
  },

  "& .react-datepicker__month-option, & .react-datepicker__year-option": {
    padding: "8px 12px",
    marginBottom: "2px",
    borderRadius: "6px",
    color: "var(--mui-palette-text-primary)",
    fontSize: "12px",
  },

  "& .react-datepicker__month-option:hover, & .react-datepicker__year-option:hover": {
    backgroundColor: "var(--mui-palette-action-hover)",
  },

  "& .react-datepicker__month-option--selected_month, & .react-datepicker__year-option--selected_year": {
    color: "var(--mui-palette-primary-main)",
    backgroundColor: "color-mix(in srgb, var(--mui-palette-primary-main) 10%, transparent)",
  },

  /* Time picker */
  "& .react-datepicker__time-container": {
    borderLeftColor: "var(--mui-palette-customColors-inputBorder)",
  },

  "& .react-datepicker__time": {
    backgroundColor: "var(--mui-palette-background-paper)",
  },

  "& .react-datepicker__time-list-item": {
    color: "var(--mui-palette-text-primary)",
    borderRadius: "6px",
    fontSize: "12px",
  },

  "& .react-datepicker__time-list-item:hover": {
    backgroundColor: "var(--mui-palette-action-hover) !important",
  },

  "& .react-datepicker__time-list-item--selected:not(.react-datepicker__time-list-item--disabled)": {
    color: "var(--mui-palette-primary-contrastText) !important",
    backgroundColor: "var(--mui-palette-primary-main) !important",
    boxShadow: "none",
  },

  /* Close button */
  "& .react-datepicker__close-icon": {
    top: 10,
    paddingRight: 16,
  },

  "& .react-datepicker__close-icon::after": {
    color: "var(--mui-palette-text-primary)",
    backgroundColor: "transparent !important",
  },

  "& .react-datepicker__day:focus, & .react-datepicker__day:active, & .react-datepicker__month-text:focus, & .react-datepicker__month-text:active, & .react-datepicker__year-text:focus, & .react-datepicker__year-text:active":
    {
      outline: "none",
    },

  /* Disabled Month / Year */
  "& .react-datepicker__month-text--disabled, & .react-datepicker__year-text--disabled, & .react-datepicker__quarter-text--disabled": {
    color: "var(--mui-palette-text-disabled) !important",
    backgroundColor: "transparent !important",
    cursor: "not-allowed",
    opacity: 0.55,
  },

  "& .react-datepicker__month-text--disabled:hover, & .react-datepicker__year-text--disabled:hover, & .react-datepicker__quarter-text--disabled:hover":
    {
      color: "var(--mui-palette-text-disabled) !important",
      backgroundColor: "transparent !important",
    },
}));

const KitReactDatepicker = forwardRef((props, ref) => {
  const { boxProps, ...rest } = props;

  return (
    <StyledReactDatePicker {...boxProps}>
      <ReactDatePickerComponent ref={ref} popperPlacement="bottom-start" {...rest} />
    </StyledReactDatePicker>
  );
});

KitReactDatepicker.displayName = "KitReactDatepicker";

export default KitReactDatepicker;
