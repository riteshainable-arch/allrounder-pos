import { styled } from '@mui/material/styles';
import {
  DataGrid,
  GridNoRowsOverlay,
  GridOverlay,
} from '@mui/x-data-grid';

const StyledDataGrid = styled(DataGrid, {
  shouldForwardProp: (prop) =>
    !['enableCursorPointer', 'stickyHeader', 'stickyFooter'].includes(prop),
  name: 'StyledDataGrid',
  slot: 'Root',
})(({ theme, stickyHeader, stickyFooter }) => ({
  border: `1px solid ${theme.palette.mode === 'dark' ? '#333' : '#E6E9F4'}`,
  borderRadius: '0px',
  borderBottomRightRadius: '0px',
  borderBottomLeftRadius: '0px',
  backgroundColor: theme.palette.background.paper,
  '& .MuiDataGrid-columnsContainer': {
    backgroundColor: theme.palette.mode === 'dark' ? '#1E1E1E' : theme.palette.common.white,
  },
  '& .MuiDataGrid-iconSeparator': {
    display: 'none',
  },
  '& .MuiDataGrid-columnHeaders': {
    ...(stickyHeader && {
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }),
    backgroundColor: theme.palette.mode === 'dark' ? '#2f3247' : theme.palette.grey[100],
    outline: 'none !important',
    '&:focus': {
      outline: 'none !important',
    },
    '&:focus-within': {
      outline: 'none !important',
    },
  },
  '& .MuiDataGrid-row': {
    backgroundColor: theme.palette.mode === 'dark' ? '#2f324700' : theme.palette.common.white,
    cursor: (props) => (props.enableCursorPointer ? 'pointer' : 'auto'),
    alignItems: 'center',
  },
  '& .MuiDataGrid-footerContainer': {
    backgroundColor: theme.palette.mode === 'dark' ? '#2f3247' : theme.palette.common.white,
  },
  '&.MuiDataGrid-root .MuiDataGrid-footerContainer': {
    ...(stickyFooter && {
      position: 'sticky',
      bottom: 0,
      zIndex: 100,
    }),
    backgroundColor: theme.palette.mode === 'dark' ? '#2f3247' : '#ffffff',
  },
  '& .MuiDataGrid-columnHeader, .MuiDataGrid-cell': {
    borderRight: 'none',
    textAlign: 'center',
  },
  '& .MuiDataGrid-columnHeader, .MuiDataGrid-columnHeaderTitle': {
    color: theme.palette.text.primary,
    fontWeight: 600,
    fontSize: '13px',
    textTransform: 'uppercase',
  },
  '& .MuiDataGrid-columnsContainer, .MuiDataGrid-cell': {
    borderBottom: `1px solid ${theme.palette.background.default}`,
    fontSize: `${theme.typography.body1.fontSize}`,
    lineHeight: `${theme.typography.body1.lineHeight}`,
  },
  '& .MuiDataGrid-root, .MuiDataGrid-row:last-child': {
    borderBottom: `1px solid ${theme.palette.background.default}`,
  },
  '& .MuiDataGrid-cell': {
    color: theme.palette.mode === 'dark' ? '#fff' : theme.palette.background.paper,
    display: 'flex',
    alignItems: 'center',
  },
  '& .MuiPaginationItem-root': {
    borderRadius: 0,
  },
  '& .MuiDataGrid-virtualScrollerRenderZone': {
    width: 'auto',
    minWidth: '100%',
  },
  '&.MuiDataGrid-root .MuiDataGrid-cell--editing:focus-within': {
    outline: 'none',
  },
  '&.MuiDataGrid-root .MuiDataGrid-cell:focus': {
    outline: 'none',
  },
  '&.MuiDataGrid-root .MuiDataGrid-cell:focus-within': {
    outline: 'none',
  },
}));

const KitDataGrid = ({
  enableCursorPointer = false,
  stickyHeader = true,
  stickyFooter = true,
  pageSize,
  setPage,
  setPageSize,
  rowCount = 10,
  error = false,
  getRowClassName,
  ...gridProps
}) => {

  const isServerPagination = (gridProps.paginationMode ?? 'server') === 'server';

  const onPaginationModelChange = (model, details) => {
    if (isServerPagination) {
      setPage?.(model.page + 1);
      setPageSize?.(model.pageSize);
    }

    gridProps.onPaginationModelChange?.(model, details);
  };

  const ErrorOverlay = () => {
    return (
      <GridOverlay>
        <div style={{ padding: 20, color: 'red' }}>
          Failed to load data
        </div>
      </GridOverlay>
    );
  };

  return (
    <StyledDataGrid
      columnHeaderHeight={50}
      rowHeight={50}
      enableCursorPointer={enableCursorPointer}
      stickyHeader={stickyHeader}
      stickyFooter={stickyFooter}
      getRowId={row => row._id}
      paginationMode={gridProps.paginationMode ?? "server"}
      rowCount={isServerPagination ? rowCount : undefined}
      initialState={{
        ...gridProps.initialState,
        pagination: {
          ...gridProps.initialState?.pagination,
          paginationModel: {
            pageSize: pageSize ?? 10,
            page: 0,
          },
        },
      }}
      pageSizeOptions={[10, 25, 50, 100]}
      {...gridProps}
      onPaginationModelChange={onPaginationModelChange}
      slots={{
        noRowsOverlay: error ? ErrorOverlay : GridNoRowsOverlay,
      }}
      getRowClassName={getRowClassName}
    />
  );
};

export default KitDataGrid;
