import DashboardInformation from "./DashboardInformation";
import DahboardSalesOverview from "./DahboardSalesOverview";
import DashboardInventoryStatus from "./DashboardInventoryStatus";
import DashboardCustomerSegmentsBars from "./DashboardCustomerSegmentsBars";
import TenantOrgBanner from "./TenantOrgBanner";

export default function AdminDasboard() {
    return (
        <div className="flex min-w-0 flex-col gap-3 md:gap-4">
            <TenantOrgBanner/>

            <div className="grid min-w-0 grid-cols-1 gap-3 md:gap-4 2xl:grid-cols-2">
                <DashboardInformation />
                <DahboardSalesOverview />
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-3 md:gap-4 xl:grid-cols-2">
                <DashboardInventoryStatus />
                <DashboardCustomerSegmentsBars />
            </div>
        </div>
    );
}
