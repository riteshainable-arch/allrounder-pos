import { useMemo, useState } from "react";
import CashierCollectionReport from "../CollectionReport/CashierCollectionReport";
import { useUsersDropdown } from "../../../../kit/hooks/data/users";
import useUser from "../../../../kit/hooks/useUser";
import { buildCashierNameMap, buildUserLabel, parseApiList } from "../../../../kit/utils/parseApiList";

const DEFAULT_STORE_ID = 1;

export default function ManagerCollectionPanel({ initialFilter }) {
    const userData = useUser();
    const [selectedCashierId, setSelectedCashierId] = useState(initialFilter?.cashierId ?? "");

    const { usersDropdown, isUsersDropdownLoading } = useUsersDropdown();

    const dropdownUsers = parseApiList(usersDropdown);

    const cashierOptions = useMemo(
        () =>
            dropdownUsers.map((user) => ({
                label: buildUserLabel(user),
                value: user.id,
            })),
        [dropdownUsers]
    );

    const cashierNameMap = useMemo(
        () => buildCashierNameMap(dropdownUsers),
        [dropdownUsers]
    );

    const selectedCashier = cashierOptions.find(
        (option) => String(option.value) === String(selectedCashierId)
    );

    const subtitle = selectedCashierId
        ? `${selectedCashier?.label || "Cashier"} — Start & End Day cash logs`
        : "All cashiers — Start & End Day cash logs";

    return (
        <CashierCollectionReport
            title="Cashier Collection"
            subtitle={subtitle}
            showHomeButton={false}
            userId={selectedCashierId || undefined}
            showCashierFilter
            cashierOptions={cashierOptions}
            selectedCashierId={selectedCashierId}
            onCashierChange={setSelectedCashierId}
            isCashierOptionsLoading={isUsersDropdownLoading}
            cashierNameMap={cashierNameMap}
            initialStartDate={initialFilter?.startDate}
            initialEndDate={initialFilter?.endDate}
            showDaySummary
            storeId={userData?.storeId || DEFAULT_STORE_ID}
        />
    );
}
