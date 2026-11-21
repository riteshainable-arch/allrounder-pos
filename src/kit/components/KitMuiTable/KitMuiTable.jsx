import { useMemo, useState } from "react";
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination } from "@mui/material";
import { styled } from "@mui/material/styles";

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
    width: "100%",
    maxWidth: "100%",
    maxHeight: "calc(100vh - 280px)",
    overflow: "auto",
    border: `1px solid ${theme.palette.customColors.inputBorder}`,
    borderRadius: 0,
    WebkitOverflowScrolling: "touch",

    "&::-webkit-scrollbar": {
        height: 10,
        width: 10,
    },

    "&::-webkit-scrollbar-thumb": {
        background: theme.palette.mode === "dark" ? "#475569" : "#b0b8c4",
        borderRadius: 10,
    },

    "&::-webkit-scrollbar-track": {
        background: theme.palette.mode === "dark" ? "#1E293B" : "#f1f5f9",
    },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    whiteSpace: "nowrap",
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: "10px 14px",
    fontSize: 13,
    color: theme.palette.text.primary,
}));

const StyledHeadCell = styled(StyledTableCell)(({ theme }) => ({
    position: "sticky",
    top: 0,
    zIndex: 2,
    background: theme.palette.third[100],
    color: theme.palette.text.primary,
    fontWeight: 700,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: "0.02em",
}));

const getColumnWidthStyles = (column) => ({
    minWidth: column.minWidth || column.width || 120,
    width: column.width || column.minWidth || 120,
    maxWidth: column.maxWidth,
});

export default function KitMuiTable({
    columns,
    rows,
    getRowId = (row) => row.id,
    getRowClassName,
    noRowsMessage = "No rows",
    sx,
    paginationMode = "client",
    summaryRow = null,
    rowCount,
    page: controlledPage,
    rowsPerPage: controlledRowsPerPage,
    onPageChange,
    onRowsPerPageChange,
    rowsPerPageOptions = [10, 20, 50, 100],
}) {
    const [internalPage, setInternalPage] = useState(0);
    const [internalRowsPerPage, setInternalRowsPerPage] = useState(10);

    const isServerPagination = paginationMode === "server";
    const page = isServerPagination ? (controlledPage ?? 0) : internalPage;
    const rowsPerPage = isServerPagination
        ? (controlledRowsPerPage ?? 20)
        : internalRowsPerPage;
    const totalCount = isServerPagination ? (rowCount ?? rows.length) : rows.length;

    const paginatedRows = useMemo(() => {
        if (paginationMode !== "client") {
            return rows;
        }

        return rows.slice(
            page * rowsPerPage,
            page * rowsPerPage + rowsPerPage
        );
    }, [rows, page, rowsPerPage, paginationMode]);

    const handlePageChange = (event, newPage) => {
        if (isServerPagination) {
            onPageChange?.(event, newPage);
            return;
        }

        setInternalPage(newPage);
    };

    const handleRowsPerPageChange = (event) => {
        const nextRowsPerPage = parseInt(event.target.value, 10);

        if (isServerPagination) {
            onRowsPerPageChange?.(event, nextRowsPerPage);
            return;
        }

        setInternalRowsPerPage(nextRowsPerPage);
        setInternalPage(0);
    };

    const renderStickyCellSx = (column, background, theme) => {
        if (!column.sticky) {
            return getColumnWidthStyles(column);
        }

        return {
            ...getColumnWidthStyles(column),
            position: "sticky",
            [column.sticky.position]: column.sticky.offset ?? 0,
            background,
            zIndex: column.sticky.position === "right" ? 3 : 2,

            boxShadow:
                column.sticky.position === "right"
                    ? theme.palette.mode === "dark"
                        ? "-4px 0 8px rgba(0,0,0,.35)"
                        : "-4px 0 8px rgba(0,0,0,.08)"
                    : theme.palette.mode === "dark"
                        ? "4px 0 8px rgba(0,0,0,.35)"
                        : "4px 0 8px rgba(0,0,0,.08)",
        };
    };

    return (
        <Paper elevation={0} sx={{ width: "100%", overflow: "hidden", ...sx }}>
            <StyledTableContainer>
                <Table stickyHeader sx={{ minWidth: "max-content", tableLayout: "auto" }}>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <StyledHeadCell
                                    key={column.field}
                                    align={column.align || "left"}
                                    sx={(theme) => renderStickyCellSx(column, theme.palette.third[100])}
                                >
                                    {column.headerName}
                                </StyledHeadCell>
                            ))}
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {paginatedRows.length === 0 ? (
                            <TableRow>
                                <StyledTableCell
                                    colSpan={columns.length}
                                    align="center"
                                    sx={(theme) => ({
                                        height: 100,
                                        color: theme.palette.text.secondary,
                                        borderBottom: "none",
                                        fontSize: 14,
                                    })}
                                >
                                    {noRowsMessage}
                                </StyledTableCell>
                            </TableRow>
                        ) : (
                            paginatedRows.map((row, index) => (
                                <TableRow
                                    hover
                                    key={getRowId(row)}
                                    className={
                                        getRowClassName?.({
                                            row,
                                            indexRelativeToCurrentPage: index,
                                        }) || ""
                                    }
                                >
                                    {columns.map((column) => (
                                        <StyledTableCell
                                            key={column.field}
                                            align={column.align || "left"}
                                            sx={(theme) =>
                                                renderStickyCellSx(
                                                    column,
                                                    theme.palette.background.paper,
                                                    theme
                                                )
                                            }
                                        >
                                            {column.renderCell
                                                ? column.renderCell({
                                                    row,
                                                    value: row[column.field],
                                                    field: column.field,
                                                })
                                                : row[column.field]}
                                        </StyledTableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}

                        {summaryRow && (
                            <TableRow
                                sx={(theme) => ({
                                    backgroundColor: theme.palette.third[50],
                                })}
                            >
                                {columns.map((column) => (
                                    <StyledTableCell
                                        key={`summary-${column.field}`}
                                        align={column.align || "left"}
                                        sx={(theme) => ({
                                            ...renderStickyCellSx(
                                                column,
                                                theme.palette.third[50],
                                                theme
                                            ),
                                            fontWeight: 700,
                                        })}
                                    >
                                        {column.renderSummary
                                            ? column.renderSummary({ row: summaryRow })
                                            : summaryRow[column.field] ?? ""}
                                    </StyledTableCell>
                                ))}
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
                {(paginationMode === "client" || paginationMode === "server") && (
                    <TablePagination
                        component="div"
                        count={totalCount}
                        page={page}
                        rowsPerPage={rowsPerPage}
                        onPageChange={handlePageChange}
                        onRowsPerPageChange={handleRowsPerPageChange}
                        rowsPerPageOptions={rowsPerPageOptions}
                        className="border-t"
                        sx={(theme) => ({
                            borderTop: `1px solid ${theme.palette.divider}`,
                        })}
                    />
                )}
            </StyledTableContainer>
        </Paper>
    );
}
