import { useState, useEffect, forwardRef } from 'react'
import TextField from '@mui/material/TextField'
import { IconButton, InputAdornment } from '@mui/material'
import KitIcon from '../KitIcon/KitIcon'

const KitDebouncedInput = forwardRef(
    ({ value: initialValue, onChange, debounce = 500, ...props }, ref) => {
        const [value, setValue] = useState(initialValue)

        useEffect(() => {
            setValue(initialValue)
        }, [initialValue])

        useEffect(() => {
            const timeout = setTimeout(() => {
                onChange(value)
            }, debounce)

            return () => clearTimeout(timeout)
        }, [value, debounce, onChange])

        const handleClear = () => {
            setValue('')
            onChange('')
        }

        return (
            <TextField
                inputRef={ref}
                className='p-2'
                // sx={{
                //   '& .MuiInputBase-input:not(.MuiInputBase-inputMultiline, .MuiInputBase-inputAdornedStart)': {
                //     padding: '7.25px 14px !important'
                //   }
                // }}
                sx={{
                    '& .MuiInputBase-root': {
                        height: 32
                    },
                    '& .MuiInputBase-input': {
                        padding: '7px 12px'
                    },
                    '& .MuiInputAdornment-root': {
                        marginRight: '4px'
                    },
                    "& input::placeholder": {
                        fontSize: '14px',
                    },
                }}
                slotProps={{
                    input: {
                        startAdornment: (
                            <InputAdornment position="start">
                                <KitIcon icon='tabler:search' fontSize={16} />
                            </InputAdornment>
                        ),
                        endAdornment: value ? (
                            <InputAdornment position="end">
                                <IconButton
                                    size="small"
                                    onClick={handleClear}
                                    edge="end"
                                >
                                    <KitIcon icon="tabler:x" fontSize={14} />
                                </IconButton>
                            </InputAdornment>
                        ) : null,
                    }
                }}
                {...props}
                value={value}
                onChange={e => setValue(e.target.value)} />
        )
    }
)

export default KitDebouncedInput
