import { Box, Typography, LinearProgress } from '@mui/material'

const KitLineLoader = ({
    isLoading,
    label = 'Syncing data...',
    detail = '',
    step = 0,
    totalSteps = 0,
    percent,
    showLabel = true,
}) => {
    if (!isLoading) return null

    const progressValue =
        typeof percent === 'number' ? Math.min(100, Math.max(0, percent)) : undefined

    return (
        <Box
            sx={{
                width: 600,
                bgcolor: "background.paper",
                p: 3,
                borderRadius: 2,
                boxShadow: 6,
            }}
        >
            <Typography variant="h6" mb={1}>
                Initial Setup
            </Typography>

            {totalSteps > 0 && step > 0 && (
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Step {step} of {totalSteps}
                </Typography>
            )}

            <LinearProgress
                variant={progressValue != null ? 'determinate' : 'indeterminate'}
                value={progressValue ?? 0}
                sx={{ height: 8, borderRadius: 1 }}
            />

            {typeof progressValue === 'number' && (
                <Typography variant="caption" color="text.secondary" mt={1} display="block">
                    {progressValue}% complete
                </Typography>
            )}

            {showLabel && (
                <Typography variant="body2" mt={2} fontWeight={500}>
                    {label}
                </Typography>
            )}

            {detail && (
                <Typography variant="body2" mt={1} color="text.secondary">
                    {detail}
                </Typography>
            )}
        </Box>
    )
}

export default KitLineLoader
