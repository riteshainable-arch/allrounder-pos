import { Divider, ToggleButton, ToggleButtonGroup } from "@mui/material";
import KitHeader from "../../../../../kit/components/KitHeader/KitHeader";
import { useState } from "react";
import BusyItemsTab from "../../../components/BuyIntegration/ItemsSync/BusyItemsTab";
import CrmItemsTab from "../../../components/BuyIntegration/ItemsSync/CrmItemsTab";

export default function ItemsSync() {
    const [tab, setTab] = useState("busy");

    return (
        <div>
            <Divider className="mb-3!" />
            <div className="flex flex-col gap-3 w-full min-w-0">
                <div className="flex items-center justify-between gap-3">
                    <KitHeader
                        title="Items Sync"
                        subtitle="Two-way item sync: import BUSY items into the CRM, or create CRM items in BUSY. Linked items are matched by id on every voucher."
                        icon="tabler:file-invoice"
                        // count={SalesOrderList?.data?.totalItems ?? 0}
                        countLabel="records"
                    />

                    <ToggleButtonGroup
                        value={tab}
                        exclusive
                        onChange={(_, newValue) => {
                            if (newValue !== null) {
                                setTab(newValue);
                            }
                        }}
                        size="small"
                        sx={{
                            p: "4px",
                            gap: "4px",
                            border: "1px solid #E0E0E0",
                            borderRadius: "6px",
                            backgroundColor: "#FFFFFF",
                            width: "fit-content",

                            "& .MuiToggleButtonGroup-grouped": {
                                border: "0 !important",
                                borderRadius: "4px !important",
                                margin: 0,
                            },

                            "& .MuiToggleButton-root": {
                                minWidth: "36px",
                                height: "30px",
                                px: 2,
                                textTransform: "none",
                                fontSize: "13px",
                                fontWeight: 500,
                                color: "#666666",
                                backgroundColor: "transparent",
                            },

                            "& .MuiToggleButton-root.Mui-selected": {
                                backgroundColor: "primary.main",
                                color: "white",
                            },
                        }}
                    >
                        <ToggleButton value="busy">BUSY → CRM</ToggleButton>
                        <ToggleButton value="crm">CRM → BUSY</ToggleButton>
                    </ToggleButtonGroup>
                </div>

                {tab === "busy" ? <BusyItemsTab /> : <CrmItemsTab />}
            </div>
        </div>
    );
}
