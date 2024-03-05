import Layout from '@/components/Layout';
import Metaheader from '@/components/Metaheader';
import { ThemeContext } from '@/contexts/ThemeContext';
import React, { useContext, useEffect } from 'react';
import BreadCrumbs from '@/components/dashboard/BreadCrumbs';
import patientModel from '@/models/patientModel';
import MainScreenObject from '@/components/dashboard/MainScreenObject';
import { Chip } from '@nextui-org/react';
import Image from 'next/image';
import { formatDate, capitalizeFirstLetter, shortUUID } from '@/utils/utils';
import { useRouter } from 'next/router';

function ListPatients() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const urlGetRecords = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/list`;
  const urlNewRecord = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/new`;
  const urlUpdateRecord = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/update`;
  const urlDeleteRecord = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/delete?id={record_id}`;
  const router = useRouter();
  const viewHistory = (record) => {
    router.push('/dashboard/patients/history/' + record.id);
  };
  const renderCell = (record, columnKey, showRecordDetail, showModalDelete) => {
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
          active: 'success',
          inactive: 'danger',
        };
        return (
          <>
            {cellValue ? (
              <Chip
                className="capitalize"
                color={statusColorMap[record.status]}
                size="sm"
                variant="flat"
              >
                {capitalizeFirstLetter(cellValue)}
              </Chip>
            ) : (
              <div></div>
            )}
          </>
        );

      case 'date':
        return <div>{formatDate(cellValue)}</div>;

      case 'history':
        return (
          <div
            style={{
              textDecoration: 'none',
              color: '#0070f0',
              cursor: 'pointer',
            }}
            onClick={() => {
              viewHistory(record);
            }}
          >
            Ver Historia
          </div>
        );

      case 'delete':
        return (
          <div
            style={{
              textDecoration: 'none',
              color: '#0070f0',
              cursor: 'pointer',
            }}
            onClick={() => {
              showModalDelete(record);
            }}
          >
            <Image
              src="/assets/images/theme-light/icon-delete.svg"
              width={24}
              height={24}
              alt="Borrar"
            />
          </div>
        );

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
  };
  return (
    <>
      <Metaheader title="Lista de Pacientes | Equioral" />
      <Layout theme={theme} toogleTheme={toggleTheme}>
        <BreadCrumbs
          theme={theme}
          data={{
            links: [
              { href: '/dashboard', title: 'Home' },
              { href: false, title: 'Pacientes' },
            ],
          }}
        />
        <MainScreenObject
          urlGetRecords={urlGetRecords}
          urlNewRecord={urlNewRecord}
          urlUpdateRecord={urlUpdateRecord}
          urlDeleteRecord={urlDeleteRecord}
          tablePageSize={5}
          model={patientModel}
          tableComponentData={{
            title: 'Lista de pacientes',
            button: {
              label: 'Nuevo paciente',
            },
            columns: [
              { key: 'expand', label: '' },
              { key: 'id', label: 'Paciente ID' },
              { key: 'horse_farm', label: 'Criadero' },
              { key: 'horse', label: 'Caballo' },
              { key: 'date', label: 'Fecha' },
              { key: 'history', label: 'Historia' },
              { key: 'delete', label: '' },
            ],
            renderCell,
          }}
          showSearch={true}
          modalComponentData={{
            title: 'Detalle de Paciente',
          }}
          schema={{
            fields: [
              {
                key: 'id',
                label: 'Paciente ID',
                type: 'hidden',
              },
              {
                key: 'horse',
                label: 'Caballo',
                type: 'text',
                isRequired: true,
              },
              {
                key: 'horse_farm',
                label: 'Criadero',
                type: 'text',
                isRequired: true,
              },
              {
                key: 'owner_name',
                label: 'Nombre del Dueño',
                type: 'text',
                isRequired: true,
              },
              {
                key: 'owner_phone',
                label: 'Teléfono del Dueño',
                type: 'text',
                isRequired: true,
              },
              {
                key: 'status',
                label: 'Status',
                type: 'select',
                isRequired: true,
                items: [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ],
              },
            ],
          }}
        />
      </Layout>
    </>
  );
}

ListPatients.auth = { adminOnly: true };
export default ListPatients;
