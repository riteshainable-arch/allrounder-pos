"use-client";

import React from "react";
import ProductManagementReport from "../../../components/ProductManagementReport/ProductManagementReport";
import { Divider } from "@mui/material";

export default function ExcessStock() {
    return (
        <>
            <Divider className="mb-3!" />
            <ProductManagementReport alertType="OVER_STOCK" />
        </>
    );
}
