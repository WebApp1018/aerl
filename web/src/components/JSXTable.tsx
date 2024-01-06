import { CSS, Loading, Pagination, Text, styled } from "@nextui-org/react";
import { useEffect, useState } from "react";

export type JSXTableColumnProps = {
  css?: CSS;
  rowCss?: CSS;
  label: string;
  value?: string;
  component?: (value: any, row: any) => JSX.Element;
}

type JSXTableProps = {
  columns?: Array<JSXTableColumnProps>;
  data?: any;
  isLoading?: boolean;
  pagination?: { perPage: number, page?: number };
}

const Table = styled("table", {
  width: '100%',
  borderRadius: 'var(--nextui-radii-xl)',
  border: '1px solid var(--nextui-colors-border)',
  boxShadow: ' var(--nextui-shadows-md)',
  backgroundColor: 'var(--nextui-colors-backgroundContrast)',
  padding: 'var(--nextui-space-md) var(--nextui-space-sm)',
  marginBottom: '20px',
  borderSpacing: '0'
})

const TableHead = styled("thead")

const TableBody = styled("tbody")

const TableHeadRow = styled("tr", {
  backgroundColor: 'var(--nextui-colors-background)',
  ":first-child": {
    borderTopLeftRadius: ' var(--nextui-radii-sm)',
    borderBottomLeftRadius: ' var(--nextui-radii-sm)'
  }
})

const TableHeadColumn = styled("th", {
  fontSize: '12px',
  textAlign: 'left',
  color: ' var(--nextui-colors-accents7)',
  height: 'var(--nextui-space-12)',
  width: '25%'
})

const TableBodyRow = styled("tr", {

})

const TableBodyColumn = styled("td", {
  textOverflow: 'ellipsis',
  maxWidth: '10px',
  overflow: 'hidden',
  whiteSpace: 'nowrap',
})

const TableFooter = styled("tfoot", { height: '65px', position: 'relative' })

const Box = styled("td", {
  position: 'absolute',
  left: '50%', transform: 'translateX(-50%)',
  top: '30px',
  color: 'var(--nextui-colors-accents7)',
  fontWeight: '600',
  ".nextui-c-cAbbLF-ikgtVxo-css": {
    backgroundColor: "var(--nextui-colors-primaryLight)"
  }
})

let initRender = false;

function JSXTable({ columns = [], data = [], isLoading, pagination: initPagination }: JSXTableProps) {

  const [pagination, setPagination] = useState<{ perPage: number; page?: number }>({ page: 1, perPage: 5, ...initPagination });
  const [paginatedData, setPaginatedData] = useState([]);

  const onChangePage = (pageNumber: number) => {
    if (!pagination) return 0;
    const startFrom = pageNumber * pagination.perPage - pagination.perPage;
    const endWith = pageNumber * pagination.perPage;

    setPaginatedData(data.slice(startFrom, endWith));
  }

  useEffect(() => {
    if (!initRender) initRender = true;
    else setPaginatedData(pagination ? data.slice(0, pagination.perPage) : data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (initPagination) setPagination(initPagination);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination]);

  return (
    <Table>
      <TableHead>
        <TableHeadRow>
          {columns.map((col, i) => <TableHeadColumn key={i} css={{
            padding: '0',
            background: "$background",
            ...(i === 0 ? {
              borderTopLeftRadius: ' var(--nextui-radii-sm)',
              borderBottomLeftRadius: ' var(--nextui-radii-sm)',
              padding: '0 0 0 var(--nextui-space-8)',
            } : {}),
            ...((i + 1) === columns.length ? {
              paddingRight: " var(--nextui-space-8)",
              borderTopRightRadius: ' var(--nextui-radii-sm)',
              borderBottomRightRadius: ' var(--nextui-radii-sm)'
            } : {}),
            ...(col.css ?? {})
          }}>{col.label}</TableHeadColumn>)}
        </TableHeadRow>
      </TableHead>
      <TableBody css={{ transform: 'scaleX(0.98)' }}>
        {paginatedData.length ? paginatedData.map((row: any, i: number) => {
          return (
            <TableBodyRow key={i}>
              {columns.map((col, i) => {
                return (
                  <TableBodyColumn key={i} css={{
                    borderBottom: paginatedData.length === 1 ? '' : '1px solid #222222',
                    ...(i === 0 ? {
                      fontWeight: ' var(--nextui-fontWeights-semibold)',
                    } : {}),
                    ...(col.rowCss ?? {})
                  }}>
                    <div>
                      {col.component ? col.component(row[col.value ?? ""], row) : row[col.value ?? ""]}
                    </div>
                  </TableBodyColumn>
                )
              })}
            </TableBodyRow>
          )
        }) : ""}
      </TableBody>
      <TableFooter>
        <tr>
          {isLoading ? (
            <Box>
              <Loading size="md" color="white" />
            </Box>
          ) : pagination && data.length && data.length > pagination.perPage ? (
            <Box>
              <Pagination page={pagination.page} total={Math.floor(data.length / pagination.perPage + 1)} initialPage={1} onChange={onChangePage} />
            </Box>
          ) : !data.length ? <Box>No Data Found</Box> : ""}
        </tr>
      </TableFooter>
    </Table >
  );
}


export default JSXTable;