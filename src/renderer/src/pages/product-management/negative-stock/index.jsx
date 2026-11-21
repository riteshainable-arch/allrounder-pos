"use-client";

import React from "react";
import ProductManagementReport from "../../../components/ProductManagementReport/ProductManagementReport";

export default function NegativeStock() {
    return <ProductManagementReport alertType="NEGATIVE_STOCK" />;
}
