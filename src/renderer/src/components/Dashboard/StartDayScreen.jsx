import { format } from "date-fns";
import { Typography } from "@mui/material";
import KitButton from "../../../../kit/components/KitButton/KitButton";
import KitIcon from "../../../../kit/components/KitIcon/KitIcon";
import KitShow from "../../../../kit/components/KitShow/KitShow";
import BillFormModal from "../collectPayment/BillFormModal";
import { DAY_STATUS } from "../../../../kit/utils/daySession";
import Logo from "../../../../../resources/allrounder_logo.png";

export default function StartDayScreen({
    status,
    dayBills,
    onStartDayClick,
    onDayStarted,
    onStartDayComplete,
    onLogout,
    showStartDayModal,
    onCloseStartDayModal,
    onRefresh,
}) {
    const isDayClosed = status === DAY_STATUS.ENDED;

    return (
        <div className="min-h-screen bg-header-background flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-lg border border-gray-200 rounded-2xl shadow-card p-8 text-center">
                <img src={Logo} alt="Allrounder" className="w-40 mx-auto mb-6" />

                {isDayClosed ? (
                    <>
                        <KitIcon icon="tabler:moon" className="text-5xl! text-orange-500 mx-auto mb-4" />
                        <Typography className="text-2xl! font-bold! mb-2">Day Closed</Typography>
                        <Typography className="text-sm! text-third-500 mb-6">
                            Today&apos;s cash session is already closed ({format(new Date(), "do MMMM yyyy")}).
                            You cannot take new orders until the next working day.
                        </Typography>
                    </>
                ) : (
                    <div className="flex flex-col gap-3 items-center">
                        <KitIcon icon="tabler:sunrise" className="text-5xl! text-orange-500 mx-auto mb-4" />
                        <Typography className="text-2xl! font-bold! mb-2">Start Your Day</Typography>
                        <Typography className="text-sm! text-third-500 mb-6">
                            Enter opening cash denominations before you can take orders or generate bills.
                        </Typography>
                        <KitButton
                            variant="contained"
                            color="warning"
                            size="large"
                            className="w-full max-w-xs mx-auto"
                            startIcon={<KitIcon icon="tabler:sunrise" />}
                            onClick={onStartDayClick}
                        >
                            Start Day
                        </KitButton>
                    </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center">
                    <KitButton
                        variant="outlined"
                        size="small"
                        className="w-auto"
                        startIcon={<KitIcon icon="tabler:logout" />}
                        onClick={onLogout}
                    >
                        Logout
                    </KitButton>
                </div>
            </div>

            <KitShow show={showStartDayModal}>
                <BillFormModal
                    isOpen={showStartDayModal}
                    onClose={onCloseStartDayModal}
                    onDayStatusChange={onDayStarted}
                    onRefresh={onRefresh}
                    onStartDayComplete={onStartDayComplete}
                />
            </KitShow>
        </div>
    );
}
