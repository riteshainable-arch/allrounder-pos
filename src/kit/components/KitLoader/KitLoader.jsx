import { Box, CircularProgress, Grid, useTheme, Typography } from '@mui/material'
import KitShow from '../KitShow/KitShow'

const KitLoader = ({ isLoading, label = 'Loading...', showLabel = true, isDarkTheme = false }) => {
    const theme = useTheme()

    if (!isLoading) return null

    return (
        <Grid xs={12}>
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}
            >
                <CircularProgress
                    sx={{
                        color: isDarkTheme ? theme.palette.background.paper : theme.palette.primary.main
                    }}
                />
                <KitShow show={Boolean(showLabel)}>
                    <Typography
                        sx={{
                            mt: 4,
                            color: isDarkTheme ? theme.palette.background.paper : theme.palette.text.secondary
                        }}
                    >
                        {label}
                    </Typography>
                </KitShow>
            </Box>
        </Grid>
    )
}

export default KitLoader