import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const NumberSpinner = React.forwardRef(({
    id: idProp,
    label,
    error,
    size = "medium",
    value,
    min = 0,
    max,
    step = 1,
    onValueChange,
    onFocus,
    onKeyDown,
    disabled = false,
    autoFocus = false,
    ...other
}, ref) => {
    const id = idProp || React.useId();
    const numericValue = Number(value ?? min) || min;
    const inputRef = React.useRef(null);
    React.useImperativeHandle(ref, () => ({
        focus() {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }));
    const safeStep = Math.max(1, Number(step) || 1);

    const clampValue = (nextValue) => {
        let safeValue = Math.max(min, Number(nextValue) || min);
        if (Number.isFinite(max)) {
            safeValue = Math.min(max, safeValue);
        }
        if (safeStep > 1) {
            safeValue = Math.round(safeValue / safeStep) * safeStep;
            if (Number.isFinite(max)) {
                safeValue = Math.min(max, safeValue);
            }
        }
        return safeValue;
    };

    const handleChange = (nextValue, action = "input") => {
        if (!onValueChange) return;

        const parsedValue = Number(nextValue);
        if (!Number.isFinite(parsedValue)) return;

        onValueChange(clampValue(parsedValue), action);
    };

    const handleIncrement = () => {
        if (disabled) return;
        onFocus?.();
        handleChange(numericValue + safeStep, "increment");
    };

    const handleDecrement = () => {
        if (disabled) return;
        onFocus?.();
        handleChange(numericValue - safeStep, "decrement");
    };

    React.useEffect(() => {
        if (autoFocus) {
            requestAnimationFrame(() => {
                inputRef.current?.focus();
                inputRef.current?.select();
            });
        }
    }, [autoFocus]);

    return (
        <FormControl
            size={size}
            disabled={disabled}
            error={error}
            variant="outlined"
            sx={{
                '& .MuiButton-root': {
                    borderColor: 'divider',
                    minWidth: 0,
                    bgcolor: 'action.hover',
                    '&:not(.Mui-disabled)': {
                        color: 'text.primary',
                    },
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Button
                    variant="outlined"
                    aria-label="Decrease"
                    size={size}
                    onClick={handleDecrement}
                    disabled={disabled || numericValue <= min}
                    sx={{
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        borderRight: '0px',
                        '&.Mui-disabled': {
                            borderRight: '0px',
                        },
                        minWidth: size === 'small' ? 28 : 36,
                        width: size === 'small' ? 28 : 36,
                        height: size === 'small' ? 28 : 40,
                        padding: 0,
                    }}
                >
                    <RemoveIcon fontSize={size} />
                </Button>

                <OutlinedInput
                    inputRef={inputRef}
                    id={id}
                    value={numericValue}
                    type="number"
                    inputProps={{
                        inputMode: 'numeric',
                        min,
                        max,
                        step: safeStep,
                    }}
                    onFocus={onFocus}
                    onKeyDown={onKeyDown}
                    onChange={(event) => handleChange(event.target.value)}
                    disabled={disabled}
                    sx={{
                        pr: 0,
                        borderRadius: 0,
                        flex: 1,
                        height: size === 'small' ? 28 : 40,
                        '& input': {
                            width: size === 'small' ? 46 : 56,
                            padding: size === 'small' ? '4px 6px' : '8px 10px',
                            textAlign: 'center',
                            MozAppearance: 'textfield',
                            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                                WebkitAppearance: 'none',
                                margin: 0,
                            },
                        },
                    }}
                />

                <Button
                    variant="outlined"
                    aria-label="Increase"
                    size={size}
                    onClick={handleIncrement}
                    disabled={disabled || (Number.isFinite(max) && numericValue >= max)}
                    sx={{
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        borderLeft: '0px',
                        '&.Mui-disabled': {
                            borderLeft: '0px',
                        },
                        minWidth: size === 'small' ? 28 : 36,
                        width: size === 'small' ? 28 : 36,
                        height: size === 'small' ? 28 : 40,
                        padding: 0,
                    }}
                >
                    <AddIcon fontSize={size} />
                </Button>
            </Box>
        </FormControl>
    );
})

export default NumberSpinner