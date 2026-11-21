"use-client";

import React from "react";
import ProductManagementReport from "../../../components/ProductManagementReport/ProductManagementReport";

export default function DeadStock() {
    return <ProductManagementReport alertType="DEAD_STOCK" />;
}
