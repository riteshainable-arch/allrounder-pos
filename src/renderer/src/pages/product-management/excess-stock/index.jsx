"use-client";

import React from "react";
import ProductManagementReport from "../../../components/ProductManagementReport/ProductManagementReport";

export default function ExcessStock() {
    return <ProductManagementReport alertType="OVER_STOCK" />;
}
