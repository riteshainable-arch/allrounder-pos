import useUser from "../../../../kit/hooks/useUser";
import CashierCollectionReport from "../../components/CollectionReport/CashierCollectionReport";

export default function CollectionReport() {
    const userData = useUser();

    return (
        <div className="p-3">
            <CashierCollectionReport
                title="My Collection Report"
                subtitle={`${userData?.firstName || userData?.email || "Cashier"} — Start & End Day cash logs`}
                showHomeButton
                homePath="/dashboard"
                userId={userData?.userId ?? userData?.id ?? null}
            />
        </div>
    );
}
