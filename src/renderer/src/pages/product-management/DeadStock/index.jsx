"use-client";

import React from "react";
import ProductManagementReport from "../../../components/ProductManagementReport/ProductManagementReport";
import { Divider } from "@mui/material";

export default function DeadStock() {
    return (
        <>
            <Divider className="mb-3!" />
            <ProductManagementReport alertType="DEAD_STOCK" />
        </>
    );
}
