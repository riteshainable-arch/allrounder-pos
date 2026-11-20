// React Imports
import { forwardRef } from 'react'

// MUI Imports
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import { InputAdornment } from '@mui/material'

const TextFieldStyled = styled(TextField, {
    shouldForwardProp: (prop) =>
        prop !== 'InputLabelProps' &&
        prop !== 'InputProps' &&
        prop !== 'inputProps' &&
        prop !== 'startIcon' &&
        prop !== 'endIcon' &&
        prop !== 'placeholderFontSize' &&
        prop !== 'height'
})(({ theme }) => ({
    '& .MuiInputLabel-root': {
        transform: 'none',
        width: 'fit-content',
        maxWidth: '100%',
        lineHeight: 1.153,
        position: 'relative',
        fontSize: '0.8125rem',
        marginBottom: '0.25rem',
        color: 'var(--mui-palette-text-primary)',
        '&:not(.Mui-error).MuiFormLabel-colorPrimary.Mui-focused': {
            color: 'var(--mui-palette-primary-main) !important'
        },
        '&.Mui-disabled': {
            color: 'var(--mui-palette-text-disabled)'
        },
        '&.Mui-error': {
            color: 'var(--mui-palette-error-main)'
        }
    },
    '& .MuiFormLabel-root': {
        zIndex: 0
    },
    '& .MuiFilledInput-input': {
        padding: '6.25px 13px !important'
    },
    '& .MuiInputBase-root': {
        backgroundColor: 'transparent',
        border: `1px solid var(--mui-palette-customColors-inputBorder)`,
        '&:not(.Mui-focused):not(.Mui-disabled):not(.Mui-error):hover': {
            backgroundColor: 'transparent',
            borderColor: 'var(--mui-palette-action-active)'
        },
        '&:before, &:after': {
            display: 'none'
        },
        '&.MuiInputBase-sizeSmall:not(.MuiInputBase-multiline)': {
            borderRadius: '6px',
            height: '32px !important'
        },
        '&.Mui-error': {
            borderColor: 'var(--mui-palette-error-main)'
        },
        '&.Mui-focused': {
            borderWidth: 2,
            backgroundColor: theme.palette.background.paper,
            '& .MuiInputBase-input:not(.MuiInputBase-readOnly):not([readonly])::placeholder': {
                transform: 'translateX(4px)'
            },
            '& :not(textarea).MuiFilledInput-input': {
                padding: '6.25px 13px !important'
            },
            '&:not(.Mui-error).MuiInputBase-colorPrimary': {
                borderColor: 'var(--mui-palette-primary-main)',
                boxShadow: 'var(--mui-customShadows-primary-sm)'
            },
            '&.MuiInputBase-colorSecondary': {
                borderColor: 'var(--mui-palette-secondary-main)'
            },
            '&.MuiInputBase-colorInfo': {
                borderColor: 'var(--mui-palette-info-main)'
            },
            '&.MuiInputBase-colorSuccess': {
                borderColor: 'var(--mui-palette-success-main)'
            },
            '&.MuiInputBase-colorWarning': {
                borderColor: 'var(--mui-palette-warning-main)'
            },
            '&.MuiInputBase-colorError': {
                borderColor: 'var(--mui-palette-error-main)'
            },
            '&.Mui-error': {
                borderColor: 'var(--mui-palette-error-main)'
            }
        },
        '&.Mui-disabled': {
            backgroundColor: 'var(--mui-palette-action-hover) !important'
        }
    },

    // Adornments
    '& .MuiInputAdornment-root': {
        marginBlockStart: '0px !important',
        '&.MuiInputAdornment-positionStart + .MuiInputBase-input:not(textarea)': {
            paddingInlineStart: '0px !important'
        }
    },
    '& .MuiInputBase-inputAdornedEnd.MuiInputBase-input': {
        paddingInlineEnd: '0px !important'
    },

    '& .MuiInputBase-sizeSmall.MuiInputBase-adornedStart.Mui-focused': {
        paddingInlineStart: '13px',
        '& .MuiInputBase-input': {
            paddingInlineStart: '0px !important'
        }
    },
    '& .MuiInputBase-sizeSmall.MuiInputBase-adornedStart:not(.MuiAutocomplete-inputRoot)': {
        paddingInlineStart: '10px'
    },
    '& .MuiInputBase-sizeSmall.MuiInputBase-adornedEnd:not(.MuiAutocomplete-inputRoot)': {
        paddingInlineEnd: '14px'
    },
    '& .MuiInputBase-sizeSmall.MuiInputBase-adornedEnd.Mui-focused:not(.MuiAutocomplete-inputRoot)': {
        paddingInlineEnd: '13px',
        '& .MuiInputBase-input': {
            paddingInlineEnd: '0px !important'
        }
    },
    '& :not(.MuiInputBase-sizeSmall).MuiInputBase-adornedStart.Mui-focused': {
        paddingInlineStart: '15px',
        '& .MuiInputBase-input': {
            paddingInlineStart: '0px !important'
        }
    },
    '& :not(.MuiInputBase-sizeSmall).MuiInputBase-adornedStart': {
        paddingInlineStart: '16px'
    },
    '& :not(.MuiInputBase-sizeSmall).MuiInputBase-adornedEnd.Mui-focused': {
        paddingInlineEnd: '15px',
        '& .MuiInputBase-input': {
            paddingInlineEnd: '0px !important'
        }
    },
    '& :not(.MuiInputBase-sizeSmall).MuiInputBase-adornedEnd': {
        paddingInlineEnd: '16px'
    },
    '& .MuiInputAdornment-sizeMedium': {
        'i, svg': {
            fontSize: '1.25rem'
        }
    },

    '& .MuiInputBase-input': {
        '&:not(textarea).MuiInputBase-inputSizeSmall': {
            padding: '7.25px 14px !important'
        },
        '&:not(.MuiInputBase-readOnly):not([readonly])::placeholder': {
            transition: theme.transitions.create(['opacity', 'transform'], {
                duration: theme.transitions.duration.shorter
            }),
            opacity: '1 !important',
            color: `${theme.palette.text.secondary} !important`,
        },
        '&::placeholder': {
            opacity: '1 !important',
            color: `${theme.palette.text.secondary} !important`,
        }
    },
    '& :not(.MuiInputBase-sizeSmall).MuiInputBase-root': {
        borderRadius: '8px',
        fontSize: '17px',
        lineHeight: '1.41',
        '& .MuiInputBase-input': {
            padding: '10.8px 16px !important'
        },
        '&.Mui-focused': {
            '& .MuiInputBase-input': {
                padding: '9.8px 15px !important'
            }
        }
    },
    '& .MuiFormHelperText-root': {
        lineHeight: 1.154,
        margin: '0.25rem 0 0',
        fontSize: '0.8125rem',
        '&.Mui-error': {
            color: 'var(--mui-palette-error-main)'
        },
        '&.Mui-disabled': {
            color: 'var(--mui-palette-error-main)'
        }
    },

    // For Select
    '& .MuiSelect-select.MuiInputBase-inputSizeSmall, & .MuiNativeSelect-select.MuiInputBase-inputSizeSmall': {
        '& ~ i, & ~ svg': {
            inlineSize: '1.125rem',
            blockSize: '1.125rem'
        }
    },
    '& .MuiSelect-select': {
        // lineHeight: 1.5,
        minHeight: 'unset !important',
        lineHeight: '1.4375em',
        '&.MuiInputBase-input': {
            paddingInlineEnd: '32px !important'
        }
    },
    '& .Mui-focused .MuiSelect-select': {
        '& ~ i, & ~ svg': {
            right: '0.9375rem'
        }
    },

    '& .MuiSelect-select:focus, & .MuiNativeSelect-select:focus': {
        backgroundColor: 'transparent'
    },

    // For Autocomplete
    '& :not(.MuiInputBase-sizeSmall).MuiAutocomplete-inputRoot': {
        paddingBlock: '5.55px',
        '& .MuiAutocomplete-input': {
            paddingInline: '8px !important',
            paddingBlock: '5.25px !important'
        },
        '&.Mui-focused .MuiAutocomplete-input': {
            paddingInlineStart: '7px !important'
        },
        '&.Mui-focused': {
            paddingBlock: '4.55px !important'
        },
        '& .MuiAutocomplete-endAdornment': {
            top: 'calc(50% - 12px)'
        }
    },
    '& .MuiAutocomplete-inputRoot.MuiInputBase-sizeSmall': {
        paddingBlock: '4.75px !important',
        paddingInlineStart: '10px',
        '&.Mui-focused': {
            paddingBlock: '3.75px !important',
            paddingInlineStart: '9px',
            '.MuiAutocomplete-input': {
                paddingBlock: '2.5px',
                paddingInline: '3px !important'
            }
        },
        '& .MuiAutocomplete-input': {
            paddingInline: '3px !important'
        }
    },
    '& .MuiAutocomplete-inputRoot': {
        display: 'flex',
        gap: '0.25rem',
        '& .MuiAutocomplete-tag': {
            margin: 0
        }
    },
    '& .MuiAutocomplete-inputRoot.Mui-focused .MuiAutocomplete-endAdornment': {
        right: '.9375rem'
    },

    // For Textarea — multiline class is on InputBase root, must override fixed small height
    '& .MuiInputBase-root.MuiInputBase-multiline': {
        height: 'auto !important',
        minHeight: '32px',
        alignItems: 'flex-start',
        borderRadius: '6px !important',
        '&.MuiInputBase-sizeSmall': {
            padding: '6px 13px !important',
            '&.Mui-focused': {
                padding: '5px 12px !important',
            },
        },
        '& textarea.MuiInputBase-input': {
            padding: '0 !important',
            lineHeight: 1.5,
            overflow: 'hidden auto !important',
        },
        '& textarea.MuiInputBase-inputSizeSmall:placeholder-shown': {
            overflowX: 'hidden',
        },
    },
    // Autofill styles
    '& input:-webkit-autofill': {
        WebkitBoxShadow: '0 0 0 100px transparent inset',
        WebkitTextFillColor: 'inherit',
        transition: 'background-color 5000s ease-in-out 0s'
    },
    '& input:-webkit-autofill:hover': {
        WebkitBoxShadow: '0 0 0 100px transparent inset',
        WebkitTextFillColor: 'inherit'
    },
    '& input:-webkit-autofill:focus': {
        WebkitBoxShadow: '0 0 0 100px transparent inset',
        WebkitTextFillColor: 'inherit'
    },
    '& input:-webkit-autofill:active': {
        WebkitBoxShadow: '0 0 0 100px transparent inset',
        WebkitTextFillColor: 'inherit'
    },
    '& input::placeholder': {
        opacity: '1 !important'
    },
    '& .MuiInputBase-input::placeholder': {
        opacity: '1 !important',
        color: 'rgba(0, 0, 0, 0.3) !important'
    }
}))

const KitTextField = forwardRef((props, ref) => {
    const { size = 'small', InputLabelProps, startIcon, endIcon, InputProps, placeholderFontSize = 16, height, ...rest } = props

    return (
        <TextFieldStyled
            size={size}
            inputRef={ref}
            {...rest}
            variant='filled'
            InputLabelProps={{ ...InputLabelProps }}
            InputProps={{
                ...InputProps,
                startAdornment: startIcon && <InputAdornment position='start'>{startIcon}</InputAdornment>,
                endAdornment: endIcon && <InputAdornment position='end'>{endIcon}</InputAdornment>
            }}
            sx={{
                "& input::placeholder": {
                    fontSize: placeholderFontSize,
                },
                '& .MuiInputBase-root': {
                    '&.MuiInputBase-sizeSmall': {
                        height: height || "",
                        fontSize: 14,
                    },
                }
            }}
        />
    )
})

export default KitTextField
