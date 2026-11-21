"use-client";

import React from "react";
import ProductManagementReport from "../../../components/ProductManagementReport/ProductManagementReport";

export default function UnderStock() {
    return <ProductManagementReport alertType="UNDER_STOCK" />;
}
