import { forwardRef } from 'react'
import { InputLabel, Typography, useTheme } from '@mui/material'
import Select from 'react-select'
import KitShow from '../KitShow/KitShow'
import { hexToRgba } from '../../utils/hexToRgba'

const KitSelect = forwardRef(({ label, required, size = 'medium', error, helperText, placeholderFontSize = 16, inputFontSize = 16, disabled, ...props }, ref) => {
    const theme = useTheme()

    const height = size === 'small' ? 32 : 36

    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: height,
            height: state.selectProps.isMulti ? 'auto' : height,
            borderRadius: '6px',

            backgroundColor: `transparent !important`,

            borderColor: error
                ? theme.palette.error.main
                : state.isFocused
                    ? theme.palette.primary.main
                    : theme.palette.customColors.inputBorder,

                boxShadow: error
                    ? `0 0 0 1px ${theme.palette.error.main}`
                    : state.isFocused
                      ? `0 0 0 1px ${theme.palette.primary.main}`
                      : "none",

            '&:hover': {
                borderColor: error
                    ? theme.palette.error.main
                    : theme.palette.primary.main,
            },
        }),
        valueContainer: (provided, state) => ({
            ...provided,
            height: state.selectProps.isMulti ? 'auto' : height,
            padding: '0 10px',
            flexWrap: 'wrap',
            fontSize: inputFontSize,
        }),
        indicatorsContainer: (provided) => ({
            ...provided,
            height,
        }),

        indicatorSeparator: (provided) => ({
            ...provided,
            backgroundColor: theme.palette.divider,
        }),

        dropdownIndicator: (provided, state) => ({
            ...provided,
            color: state.isFocused
                ? theme.palette.primary.main
                : theme.palette.text.secondary,

            '&:hover': {
                color: theme.palette.primary.main,
            },
        }),

        clearIndicator: (provided) => ({
            ...provided,
            color: theme.palette.text.secondary,

            '&:hover': {
                color: theme.palette.error.main,
            },
        }),

        menu: (provided) => ({
            ...provided,
            zIndex: 9999,
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.customColors.inputBorder}`,
            overflow: 'hidden',
        }),

        menuPortal: (provided) => ({
            ...provided,
            zIndex: 9999,
        }),

        menuList: (provided) => ({
            ...provided,
            backgroundColor: theme.palette.background.paper,
            overflowY: 'auto',
        }),
        multiValue: (provided) => ({
            ...provided,
            borderRadius: '50px',
            backgroundColor: theme.palette.primary.main,
        }),
        multiValueLabel: (provided) => ({
            ...provided,
            color: theme.palette.primary.contrastText,
        }),

        multiValueRemove: (provided) => ({
            ...provided,
            color: theme.palette.primary.contrastText,

            '&:hover': {
                backgroundColor: theme.palette.primary.dark,
                color: theme.palette.primary.contrastText,
            },
        }),

        input: (provided) => ({
            ...provided,
            fontSize: inputFontSize,
            margin: 0,
            padding: 0,
            color: theme.palette.text.primary,
        }),

        option: (provided, state) => ({
            ...provided,
            fontSize: inputFontSize,

            color: state.isSelected
                ? theme.palette.primary.contrastText
                : theme.palette.text.primary,

            backgroundColor: state.isSelected
                ? theme.palette.primary.main
                : state.isFocused
                    ? hexToRgba(theme.palette.primary.main, 0.12)
                    : theme.palette.background.paper,

            cursor: 'pointer',

            '&:active': {
                backgroundColor: hexToRgba(
                    theme.palette.primary.main,
                    0.2
                ),
            },
        }),

        placeholder: (provided) => ({
            ...provided,
            fontSize: placeholderFontSize,
            color: theme.palette.text.secondary,
        }),

        singleValue: (provided) => ({
            ...provided,
            fontSize: inputFontSize,
            color: theme.palette.text.primary,
        }),

        noOptionsMessage: (provided) => ({
            ...provided,
            color: theme.palette.text.secondary,
            fontSize: inputFontSize,
        }),

        loadingMessage: (provided) => ({
            ...provided,
            color: theme.palette.text.secondary,
        }),
    }

    return (
        <label className='w-full'>
            <KitShow show={Boolean(label)}>
                <InputLabel
                    required={required}
                    error={error}
                    sx={{
                        fontSize: 13,
                        mb: 0.5,
                        lineHeight: 1.154,
                        color: theme.palette.text.primary
                    }}
                >
                    {label}
                </InputLabel>
            </KitShow>

            <Select
                ref={ref}
                {...props}
                isDisabled={disabled}
                filterOption={() => true}
                menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                menuPosition="fixed"
                menuPlacement="auto"
                menuShouldScrollIntoView={false}
                maxMenuHeight={props.maxMenuHeight ?? 320}
                styles={customStyles}
                theme={(selectTheme) => ({
                    ...selectTheme,
                    colors: {
                        ...selectTheme.colors,
                        primary50: hexToRgba(theme.palette.primary.main, 0.2),
                        primary25: hexToRgba(theme.palette.primary.main, 0.1),
                        primary: theme.palette.primary.main
                    }
                })}

            />
            {helperText && (
                <Typography
                    variant="caption"
                    sx={{
                        mt: 0.5,
                        ml: 1,
                        color: error
                            ? theme.palette.error.main
                            : theme.palette.text.secondary
                    }}
                >
                    {helperText}
                </Typography>
            )}
        </label>
    )
})

KitSelect.displayName = 'KitSelect'

export default KitSelect
