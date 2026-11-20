import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToPdf({
    headers,
    data,
    fileName = "export.pdf",
}) {
    const doc = new jsPDF();
    const columns = [headers.map((h) => h.header)];
    const body = data.map((row) => headers.map((h) => row[h.dataKey]));

    autoTable(doc, {
        head: columns,
        body: body,
        margin: 2,
        styles: { font: "helvetica" },
        headStyles: { fontSize: 9 },
        bodyStyles: { fontSize: 7 },
    });

    doc.save(fileName);
}
