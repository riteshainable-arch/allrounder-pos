import * as XLSX from "xlsx";
import React from "react";

export function downloadCSV(
    rows,
    headers,
    filename = "export.csv",
) {
    const csvRows = [];
    csvRows.push(headers.map((h) => JSON.stringify(h)).join(","));
    rows.forEach((row) => {
        csvRows.push(
            headers.map((h) => JSON.stringify(row[h] ?? "")).join(","),
        );
    });
    const csvString = csvRows.join("\r\n");
    const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function downloadXLSX(
    rows,
    headers,
    filename = "export.xlsx",
) {
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });

    // Auto-set column widths based on content
    const colWidths = headers.map((header) => {
        let maxLen = header.length;
        rows.forEach((row) => {
            const val = row[header];
            if (val !== null && val !== undefined) {
                const strVal = String(val);
                if (strVal.length > maxLen) {
                    maxLen = strVal.length;
                }
            }
        });
        return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
    });
    worksheet["!cols"] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Backwards compatibility alias
export const downloadXLS = downloadXLSX;

export function exportTableData(
    table,
    format,
    filename = "export"
) {
    if (!table) return;

    const leafColumns = table.getVisibleLeafColumns().filter((col) => {
        const id = col.id.toLowerCase();
        return (
            id !== "actions" &&
            id !== "action" &&
            id !== "select" &&
            id !== "selection" &&
            id !== "expand" &&
            id !== "drag-handle"
        );
    });

    const headers = leafColumns.map((col) => {
        const headerDef = col.columnDef.header;
        if (typeof headerDef === "string" && headerDef.trim().length > 0) {
            return headerDef;
        }
        return col.id
            .replace(/_/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    });

    const rows =
        table.getFilteredRowModel().rows.length > 0
            ? table.getFilteredRowModel().rows
            : table.getRowModel().rows;

    const dataRows = rows.map((row) => {
        const rowObj = {};
        leafColumns.forEach((col, idx) => {
            const headerName = headers[idx];
            let val;
            try {
                val = row.getValue(col.id);
            } catch {
                val = row.original?.[col.id];
            }
            if (val === undefined) {
                val = row.original?.[col.id];
            }

            if (val === null || val === undefined) {
                rowObj[headerName] = "";
            } else if (typeof val === "boolean") {
                rowObj[headerName] = val ? "Yes" : "No";
            } else if (typeof val === "object") {
                if (val instanceof Date) {
                    rowObj[headerName] = val.toLocaleString();
                } else if (React.isValidElement?.(val)) {
                    rowObj[headerName] = "";
                } else {
                    rowObj[headerName] = val.name || val.title || val.label || JSON.stringify(val);
                }
            } else {
                rowObj[headerName] = val;
            }
        });
        return rowObj;
    });

    if (format === "xlsx" || format === "xls") {
        downloadXLSX(dataRows, headers, filename);
    } else {
        downloadCSV(dataRows, headers, filename);
    }
}

export function flattenObjects(
    data,
    keyMap,
) {
    return data.map((obj) => {
        const row = {};
        Object.entries(keyMap).forEach(([sourceKey, exportKey]) => {
            row[exportKey] = (obj)[sourceKey] ?? "";
        });
        return row;
    });
}

export function flattenNestedObjects(
    data,
    keyMap,
) {
    return data.map((item) => {
        const row = {};
        Object.entries(keyMap).forEach(([path, exportKey]) => {
            row[exportKey] = getValueByPath(item, path) ?? "";
        });
        return row;
    });
}

function getValueByPath(obj, path) {
    return path
        .split(".")
        .reduce((acc, cur) => (acc && acc[cur] != null ? acc[cur] : ""), obj);
}
