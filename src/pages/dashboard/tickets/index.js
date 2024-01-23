import Layout from '@/components/Layout';
import Metaheader from '@/components/Metaheader';
import TableComponent from '@/components/dashboard/TableComponent';
import { ThemeContext } from '@/contexts/ThemeContext';
import React, { useContext, useEffect } from 'react';
import BreadCrumbs from '@/components/dashboard/BreadCrumbs';
import { Chip } from '@nextui-org/react';
import { useRouter } from 'next/router';
import { formatDate, capitalizeFirstLetter, shortUUID } from '@/utils/utils';
import Image from 'next/image';
import ModalComponent from '@/components/dashboard/ModalComponent';
import ticketModel from '@/models/ticketModel';
import { toast } from 'react-toastify';
import DetailTicket from '@/components/dashboard/tickets/DetailTicket';

async function getTickets(page = 1, pageSize = 5, status = 'all') {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/tickets/list?page=${page}&pageSize=${pageSize}`
  );
  return await res.json();
}

function ListTickets() {
  const [users, setUsers] = React.useState([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(5);
  const [refreshTable, setRefreshTable] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const [showModalRecordDetail, setShowModalRecordDetail] = React.useState(0);

  const [recordModal, setRecordModal] = React.useState(ticketModel);
  const [recordChange, setRecordChange] = React.useState(false);
  const [savingRecord, setSavingRecord] = React.useState(false);

  const [newResponse, setNewResponse] = React.useState(null);

  const onRecordChange = (value) => {
    setRecordChange(value);
  };

  const onFieldChange = (key, value) => {
    const newRecord = { ...recordModal };
    newRecord[key] = value;
    setRecordModal(newRecord);
    setRecordChange(true);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fetchOrders = async () => {
        setLoading(true);
        const usersBD = await getTickets(page, pageSize);

        const { records } = usersBD.data;

        if (records && records.length > 0) {
          setUsers(
            records.map((user, index) => {
              return {
                ...user,
                key: index,
                date: user.createdAt,
              };
            })
          );
          setTotalPages(records.totalPages);
          setPage(records.page);
        } else {
          setUsers([]);
          setTotalPages(1);
          setPage(1);
        }
        setLoading(false);
      };
      fetchOrders(page, pageSize);
    }
  }, [page, pageSize, refreshTable]);

  const { theme, toggleTheme } = useContext(ThemeContext);

  const showRecordDetail = (record) => {
    setRecordModal(record);
    setShowModalRecordDetail((currCount) => currCount + 1);
  };

  const onNewRecord = () => {
    setRecordModal(ticketModel);
    setShowModalRecordDetail((currCount) => currCount + 1);
  };

  const addResponse = (message) => {
    setNewResponse(message);
    setRecordChange(true);
  };

  const saveRecord = () => {
    if (savingRecord) return;
    setSavingRecord(true);
    let url = recordModal.id
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/tickets/update`
      : `${process.env.NEXT_PUBLIC_BASE_URL}/api/tickets/new`;

    const body = { record: recordModal };

    if (newResponse) {
      url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/tickets/addresponse`;
      body.ticket_response = newResponse;
    }
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
      .then((response) => {
        //IF RESPONSE STATUS IS NOT 200 THEN THROW ERROR
        if (response.status !== 200) {
          toast.error('No se pudo enviar la información');
          setSavingRecord(false);
          setNewResponse(null);
        }
        return response.json();
      })
      .then((data) => {
        toast.success('Registro Guardado con éxito');
        setShowModalRecordDetail(0);
        setRefreshTable((currCount) => currCount + 1);
        setSavingRecord(false);
        setNewResponse(null);
      })
      .catch((error) => {
        //console.error('Error:', error);
        toast.error('El registro no se pudo guardar');
        setSavingRecord(false);
        setNewResponse(null);
      });
  };

  const renderCell = React.useCallback((record, columnKey) => {
    const cellValue = record[columnKey];
    switch (columnKey) {
      case 'expand':
        return (
          <div
            className="expand-cell"
            onClick={() => {
              showRecordDetail(record);
            }}
          >
            <Image
              src="/assets/images/icon-expand.svg"
              width={12}
              height={12}
              alt=""
            />
          </div>
        );
      case 'status':
        const statusColorMap = {
          active: 'primary',
          pending: 'warning',
          close: 'default',
        };
        const statusLabelMap = {
          active: 'Activo',
          pending: 'Pendiente',
          close: 'Cerrado',
        };

        return (
          <>
            {cellValue ? (
              <Chip
                className="capitalize"
                color={statusColorMap[record.role]}
                size="sm"
                variant="flat"
              >
                {capitalizeFirstLetter(statusLabelMap[cellValue])}
              </Chip>
            ) : (
              <div></div>
            )}
          </>
        );

      case 'date':
        return <div>{formatDate(cellValue)}</div>;

      case 'id':
        return (
          <div
            style={{
              textDecoration: 'none',
              color: '#0070f0',
              cursor: 'pointer',
            }}
            onClick={() => {
              showRecordDetail(record);
            }}
          >
            {shortUUID(cellValue)}
          </div>
        );

      default:
        return cellValue;
    }
  }, []);

  return (
    <>
      <Metaheader title="Listado de Tickets | Arctic Bunker" />
      <Layout theme={theme} toogleTheme={toggleTheme}>
        <BreadCrumbs
          theme={theme}
          data={{
            links: [
              { href: '/dashboard', title: 'Inicio' },
              { href: false, title: 'Tickets' },
            ],
          }}
        />
        <TableComponent
          data={{
            title: 'Listado de Tickets',
            button: {
              label: 'Nuevo Ticket',
              callback: () => {
                onNewRecord();
              },
            },
            columns: [
              { key: 'expand', label: '' },
              { key: 'id', label: 'Ticket ID' },
              { key: 'title', label: 'Titulo' },
              { key: 'status', label: 'Estatus' },
              { key: 'date', label: 'Fecha' },
            ],
            rows: users,
            pagination: {
              total: totalPages,
              initialPage: page,
              isDisabled: loading,
              onChange: (page) => {
                setPage(page);
              },
            },
            renderCell,
          }}
        />
        <ModalComponent
          show={showModalRecordDetail}
          onSave={saveRecord}
          title="Detalle del Ticket"
          onCloseModal={() => {
            onRecordChange(false);
          }}
          allowSave={recordChange}
        >
          <DetailTicket
            onRecordChange={(value) => {
              onRecordChange(value);
            }}
            record={recordModal}
            onFieldChange={(key, value) => {
              onFieldChange(key, value);
            }}
            addResponse={addResponse}
          />
        </ModalComponent>
      </Layout>
    </>
  );
}

ListTickets.auth = { adminOnly: true };
export default ListTickets;
