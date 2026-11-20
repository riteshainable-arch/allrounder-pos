import { Dialog } from "@mui/material";
import { useEffect, useRef } from "react";
import { printToDefaultPrinter } from "../../../../kit/utils/electronApi";
import { toast } from "react-toastify";
import SrnPrintLayout from "./SrnPrintLayout";

export default function SrnPrintModal({ isOpen, onClose, payload }) {
    const printStarted = useRef(false);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) {
            printStarted.current = false;
            return;
        }

        if (!payload || printStarted.current) return;

        printStarted.current = true;
        let printRequested = false;
        const timer = window.setTimeout(async () => {
            printRequested = true;
            try {
                await printToDefaultPrinter();
            } catch (error) {
                toast.error(error?.message || "Unable to print SRN.");
            } finally {
                onCloseRef.current?.();
            }
        }, 100);

        return () => {
            window.clearTimeout(timer);
            if (!printRequested) printStarted.current = false;
        };
    }, [isOpen, payload]);

    return (
        <Dialog
            open={isOpen}
            aria-hidden
            sx={{ visibility: "hidden" }}
            maxWidth={false}
        >
            <SrnPrintLayout payload={payload || {}} />
        </Dialog>
    );
}
