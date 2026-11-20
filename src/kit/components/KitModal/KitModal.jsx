import { DialogTitle, DialogContent, DialogActions, Dialog, IconButton, useTheme } from '@mui/material'
import KitShow from '../KitShow/KitShow'
import KitIcon from '../KitIcon/KitIcon'

const KitModal = ({
    isOpen = false,
    isFullScreen = false,
    onClose,
    maxWidth = 'sm',
    title,
    content,
    actions,
    label = 'modal',
    children,
    sx,
    scroll = 'body',
    disableBackdropClick = false,
    titleClass,
}) => {
    const theme = useTheme()

    return (
        <Dialog
            open={isOpen}
            fullScreen={isFullScreen}
            fullWidth={true}
            maxWidth={maxWidth}
            onClose={(event, reason) => {
                if (reason === 'backdropClick' && disableBackdropClick) return
                onClose?.()
            }}
            sx={{
                wordBreak: 'break-word',
                ...sx,
                '& .MuiDialog-paper': {
                    borderRadius: 2,
                    [theme.breakpoints.down('sm')]: {
                        maxWidth: 'calc(100% - 20px) !important',
                        margin: '10px auto !important',
                        left: 0,
                        right: 0,
                    },
                },

                '& .MuiDialog-paperScrollBody': {
                    [theme.breakpoints.down('sm')]: {
                        width: '100%',
                    },
                },
            }}
            scroll={scroll}
            aria-label={`${label} modal`}
            aria-labelledby='modal-title'
            aria-describedby='modal-description'
        >
            {typeof title === 'string' ? (
                <DialogTitle
                    id='modal-title'
                    aria-label={`${label} modal title`}
                    sx={{
                        ...(!title && { padding: 0 }),
                        overflow: 'hidden',
                        overflowY: 'hidden'
                    }}
                >
                    {title}
                    <IconButton size={'small'} aria-label='close' onClick={onClose}>
                        <KitIcon icon='tabler:path' fontSize={16} />
                    </IconButton>
                </DialogTitle>
            ) : (
                <div className={`p-6 flex items-center ${title ? 'justify-between border-b-[1px] border-solid border-gray-300' : 'justify-end py-2'} ${titleClass}`}>
                    {title}
                    <IconButton size={'small'} aria-label='close' onClick={onClose}>
                        <KitIcon icon='tabler:x' fontSize={16} />
                    </IconButton>
                </div>
            )}
            <KitShow show={Boolean(content)}>
                <DialogContent id='modal-description' aria-label={`${label} modal content`} sx={{ overflow: 'visible' }}>
                    {content}
                </DialogContent>
            </KitShow>
            <KitShow show={Boolean(children)}>
                <>{children}</>
            </KitShow>
            <KitShow show={Boolean(actions)}>
                <DialogActions aria-label={`${label} modal actions`}>{actions}</DialogActions>
            </KitShow>
        </Dialog>
    )
}

export default KitModal
