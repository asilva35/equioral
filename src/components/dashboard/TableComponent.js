import React, { useCallback, useEffect } from 'react';

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Button,
  CircularProgress,
  Input,
  Image,
} from '@nextui-org/react';
import { useRouter } from 'next/router';

// Debounce function
function debounce(func, delay) {
  let timeoutId = setTimeout(func, delay);
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

export default function TableComponent(props) {
  const { data, onSearchChange, showSearch } = props;
  const router = useRouter();
  const renderCell = React.useCallback((record, columnKey) => {
    if (data.renderCell)
      return data.renderCell(record, columnKey, data.showRecordDetail);

    const cellValue = record[columnKey];
    return cellValue;
  }, []);

  const [initialPage, setInitialPage] = React.useState(1);

  useEffect(() => {
    setInitialPage(data.pagination.initialPage);
  }, [data.pagination.initialPage]);

  const onNewRecord = (button) => {
    if (button.callback) {
      button.callback();
    }
    if (button.href) {
      router.push(button.href);
    }
  };

  const debouncedOnChange = useCallback(
    debounce((e) => {
      if (!e) return;
      onSearchChange(e.target.value);
    }, 1000),
    []
  );

  return (
    <>
      <div className="header">
        <h1 className="text-2xl font-bold">{data.title}</h1>
        {data.button && (
          <Button
            color="primary"
            onClick={() => {
              onNewRecord(data.button);
            }}
          >
            {data.button.label}
          </Button>
        )}
      </div>
      {showSearch && (
        <div className="search">
          <Input
            type="text"
            label="Search"
            variant="bordered"
            placeholder="Enter your search term..."
            className="max-w-xs"
            onChange={(e) => {
              e.persist(); // React pools events, so we need to persist the event
              debouncedOnChange(e);
            }}
            startContent={
              <Image
                src="/assets/images/icon-search.svg"
                width={20}
                height={20}
                alt=""
              />
            }
          />
        </div>
      )}
      <div className="flex flex-col gap-3">
        <Table aria-label={data.title} selectionMode="single">
          <TableHeader columns={data.columns}>
            {(column) => (
              <TableColumn key={column.key}>{column.label}</TableColumn>
            )}
          </TableHeader>
          <TableBody items={data.rows}>
            {(item) => (
              <TableRow key={item.key}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="flex justify-start">
          <Pagination
            total={Number.parseInt(data.pagination.total)}
            initialPage={initialPage}
            {...data.pagination}
            onChange={(page) => {
              setInitialPage(page);
              data.pagination.onChange(page);
            }}
          />
          {data.pagination.isDisabled && (
            <CircularProgress size="sm" aria-label="Loading..." />
          )}
        </div>
      </div>
      <style jsx>{`
        .header {
          width: 100%;
          display: flex;
          justify-content: flex-start;
          padding: 20px 10px;
          gap: 20px;
        }
        .search {
          width: 100%;
          display: flex;
          justify-content: flex-end;
          padding: 20px 10px;
          gap: 20px;
        }
        .text-2xl {
          font-size: 1.5rem;
          line-height: 2rem;
        }
        .font-bold {
          font-weight: 700;
        }
      `}</style>
    </>
  );
}
