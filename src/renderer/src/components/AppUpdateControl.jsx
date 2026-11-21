import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

const isBusy = (status) => status === "checking" || status === "available" || status === "downloading";

export default function AppUpdateControl() {
    const downloadStartedRef = useRef(false);
    const updateCheckStartedRef = useRef(false);
    const [version, setVersion] = useState("");
    const [canUpdate, setCanUpdate] = useState(false);
    const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
    const [updateStatus, setUpdateStatus] = useState({ status: "idle" });

    useEffect(() => {
        let isMounted = true;
        const api = window.api;

        api?.getAppVersion?.()
            .then((appVersion) => {
                if (isMounted) setVersion(appVersion);
            })
            .catch((error) => {
                console.error("Failed to get application version:", error);
            });

        api?.canUpdateApp?.()
            .then((supported) => {
                if (!isMounted) return;

                setCanUpdate(supported);
                if (supported && !updateCheckStartedRef.current) {
                    updateCheckStartedRef.current = true;
                    setUpdateStatus({ status: "checking" });
                    api.checkForAppUpdates?.().catch((error) => {
                        if (!isMounted) return;
                        setUpdateStatus({ status: "idle" });
                        toast.error(error?.message || "Could not check for app updates.");
                    });
                }
            })
            .catch((error) => {
                console.error("Failed to check update support:", error);
            });

        const unsubscribe = api?.onAppUpdateStatus?.((status) => {
            if (!isMounted) return;

            if (status.status === "available" && !downloadStartedRef.current) {
                downloadStartedRef.current = true;
                setIsUpdateAvailable(true);
                setUpdateStatus({ status: "downloading", percent: 0 });

                api.downloadAppUpdate().catch((error) => {
                    downloadStartedRef.current = false;
                    if (isMounted) {
                        const message = error?.message || "Could not download the update.";
                        setUpdateStatus({ status: "idle" });
                        toast.error(message);
                    }
                });
                return;
            }

            if (status.status === "error") {
                downloadStartedRef.current = false;
                setIsUpdateAvailable(false);
                toast.error(status.message || "Could not update the app.");
                setUpdateStatus({ status: "idle" });
                return;
            }

            if (status.status === "not-available") {
                downloadStartedRef.current = false;
                setIsUpdateAvailable(false);
                setUpdateStatus({ status: "idle" });
                return;
            }

            if (status.status === "downloaded") {
                setIsUpdateAvailable(true);
            }

            setUpdateStatus(status);
        });

        return () => {
            isMounted = false;
            unsubscribe?.();
        };
    }, []);

    const handleUpdateClick = async () => {
        try {
            if (updateStatus.status === "downloaded") {
                await window.api.installAppUpdate();
                return;
            }

            downloadStartedRef.current = false;
            setUpdateStatus({ status: "checking" });
            await window.api.checkForAppUpdates();
        } catch (error) {
            downloadStartedRef.current = false;
            setUpdateStatus({ status: "idle" });
            toast.error(error?.message || "Could not complete the update.");
        }
    };

    const buttonLabel =
        {
            available: "Preparing update...",
            downloaded: "Restart to update",
            checking: "Checking...",
            downloading: `Downloading ${updateStatus.percent ?? 0}%`,
        }[updateStatus.status] || "Update app";

    if (!version) return null;

    return (
        <div className="flex items-center gap-2 text-xs text-app-text">
            <span className="whitespace-nowrap">Version {version}</span>
            {canUpdate && (
                <div className="flex flex-col items-end gap-1">
                    <button
                        type="button"
                        onClick={handleUpdateClick}
                        disabled={!isUpdateAvailable || isBusy(updateStatus.status)}
                        className="cursor-pointer whitespace-nowrap rounded-sm border border-blue-600 px-2 py-1 text-blue-600 disabled:cursor-wait disabled:opacity-60"
                    >
                        {buttonLabel}
                    </button>
                </div>
            )}
        </div>
    );
}
