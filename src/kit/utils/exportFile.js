import * as XLSX from "xlsx";

const getCsvValue = (value) => {
    if (value === undefined || value === null) return "";
    return `"${String(value).replace(/"/g, '""')}"`;
};

export const downloadCsv = (rows, fileName) => {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);

    const csvRows = [
        headers.join(","),
        ...rows.map((row) =>
            headers.map((header) => getCsvValue(row[header])).join(",")
        ),
    ];

    const blob = new Blob(["\uFEFF" + csvRows.join("\r\n")], {
        type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

export const downloadXlsx = (rows, fileName, sheetName = "Sheet1") => {
    if (!rows.length) return;
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, fileName);
};

export const downloadFile = (rows, type, fileName, sheetName = "Sheet1") => {
    if (type === "csv") {
        downloadCsv(rows, `${fileName}.csv`);
    } else {
        downloadXlsx(rows, `${fileName}.xlsx`, sheetName);
    }
};
