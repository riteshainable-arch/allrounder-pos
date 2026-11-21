"use-client";

import React from "react";
import ProductManagementReport from "../../../components/ProductManagementReport/ProductManagementReport";

export default function StockoutAlerts() {
    return <ProductManagementReport alertType="STOCK_OUT" />;
}
