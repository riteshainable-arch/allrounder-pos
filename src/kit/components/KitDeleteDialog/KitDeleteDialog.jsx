import { DialogActions, DialogContent, Typography } from '@mui/material'
import KitModal from '../KitModal'
import KitButton from '../KitButton/KitButton'
import { useEffect, useRef } from 'react';

const KitDeleteDialog = ({ isOpen, onClose, onDelete, title, isBtnLoading, subTitle, cancelButtonText = "Cancel" }) => {
    const cancelButtonRef = useRef(null);
    const deleteButtonRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const focusTimer = requestAnimationFrame(() => {
            deleteButtonRef.current?.focus();
        });

        const handleKeyDown = (e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                e.stopPropagation();

                if (isBtnLoading) return;

                const activeElement = document.activeElement;

                if (activeElement === deleteButtonRef.current) {
                    cancelButtonRef.current?.focus();
                } else {
                    deleteButtonRef.current?.focus();
                }

                return;
            }

            if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();

                if (isBtnLoading) return;

                if (document.activeElement === cancelButtonRef.current) {
                    onClose();
                } else {
                    onDelete();
                }
                return;
            }

            if (e.key === "Escape") {
                e.preventDefault();
                e.stopPropagation();

                if (!isBtnLoading) {
                    onClose();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown, true);

        return () => {
            cancelAnimationFrame(focusTimer);
            window.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [isOpen, isBtnLoading, onDelete, onClose]);

    return (
        <KitModal
            maxWidth='xs'
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="text-base font-semibold">
                    {title}
                </div>}

            titleClass='p-3! border-b'
        >
            <DialogContent className='overflow-hidden' sx={{ p: 1.5 }}>
                <Typography variant='body1'>
                    {subTitle}
                </Typography>
            </DialogContent>
            <div className="p-4 flex justify-end gap-3">
                <KitButton
                    ref={cancelButtonRef}
                    variant='outlined'
                    size='small'
                    className='w-auto'
                    onClick={onClose}
                    disabled={isBtnLoading}
                >
                    {cancelButtonText}
                </KitButton>
                <KitButton
                    ref={deleteButtonRef}
                    variant='contained'
                    color='error'
                    size='small'
                    className='w-auto'
                    onClick={onDelete}
                    disabled={isBtnLoading}
                    isLoading={isBtnLoading}
                >
                    Yes
                </KitButton>
            </div>
        </KitModal>
    )
}

export default KitDeleteDialog