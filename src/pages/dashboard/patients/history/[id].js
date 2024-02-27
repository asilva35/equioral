import Layout from '@/components/Layout';
import Metaheader from '@/components/Metaheader';
import { ThemeContext } from '@/contexts/ThemeContext';
import React, { useContext, useEffect, useState } from 'react';
import BreadCrumbs from '@/components/dashboard/BreadCrumbs';
import historyModel from '@/models/historyModel';
import MainScreenObject from '@/components/dashboard/MainScreenObject';
import { Chip } from '@nextui-org/react';
import Image from 'next/image';
import { formatDate, capitalizeFirstLetter, shortUUID } from '@/utils/utils';
import { useRouter } from 'next/router';
import { Card, CardHeader, Skeleton } from '@nextui-org/react';

async function getRecord(patient_id) {
  let url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/get?id=${patient_id}`;
  const res = await fetch(url);
  return await res.json();
}

function ListHistory() {
  const router = useRouter();
  const { id: patient_id } = router.query;
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [urlGetRecords, setUrlGetRecords] = useState(null);
  const urlNewRecord = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/history/new`;
  const urlUpdateRecord = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/history/update`;
  historyModel.patient_id = patient_id;

  const [patient, setPatient] = useState(null);

  useEffect(() => {
    async function fetchData(patient_id) {
      const patientBD = await getRecord(patient_id);
      if (
        patientBD &&
        patientBD.data &&
        patientBD.data.records &&
        patientBD.data.records.length > 0
      ) {
        setPatient(patientBD.data.records[0]);
      }
    }
    if (patient_id) {
      setUrlGetRecords(
        `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/history/list?patient_id=${patient_id}`
      );

      fetchData(patient_id);
    }
  }, [patient_id]);

  const viewHistoryDetail = (record) => {
    router.push(
      '/dashboard/patients/history/detail/' +
        record.patient_id +
        '/' +
        record.id
    );
  };
  const renderCell = (record, columnKey, showRecordDetail) => {
    const cellValue = record[columnKey];
    switch (columnKey) {
      case 'expand':
        return (
          <div
            className="expand-cell"
            onClick={() => {
              viewHistoryDetail(record);
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

      case 'first_observation':
        return (
          <div>
            {cellValue && cellValue.length > 100
              ? cellValue.substring(0, 100) + '...'
              : cellValue}
          </div>
        );

      case 'treatment':
        return (
          <div>
            {cellValue && cellValue.length > 100
              ? cellValue.substring(0, 100) + '...'
              : cellValue}
          </div>
        );

      case 'photos':
        return (
          <div
            style={{
              display: 'flex',
              gap: '2px',
              flexWrap: 'wrap',
              justifyContent: 'flex-start',
              alignItems: 'center',
              width: '100px',
            }}
          >
            {Array.isArray(cellValue) &&
              cellValue.map((photo, index) =>
                index > 2 ? null : (
                  <Image
                    key={index}
                    src={photo.src}
                    width={40}
                    height={40}
                    alt=""
                    className="photo"
                  />
                )
              )}
          </div>
        );

      case 'history':
        return (
          <div
            style={{
              textDecoration: 'none',
              color: '#0070f0',
              cursor: 'pointer',
            }}
            onClick={() => {
              viewHistoryDetail(record);
            }}
          >
            Ver Historia
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
              viewHistoryDetail(record);
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
      <Metaheader title="Historial del Paciente | Equioral" />
      <Layout theme={theme} toogleTheme={toggleTheme}>
        <BreadCrumbs
          theme={theme}
          data={{
            links: [
              { href: '/dashboard', title: 'Home' },
              { href: '/dashboard/patients', title: 'Pacientes' },
              { href: false, title: 'Historias Clínicas' },
            ],
          }}
        />
        <div className="flex gap-4">
          <Card className="" style={{ width: 'auto', margin: '30px 0' }}>
            <CardHeader
              className="flex flex-row gap-4"
              style={{ padding: '40px 60px' }}
            >
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-1 items-start justify-start">
                  <h4 className="text-small font-semibold leading-none text-default-600">
                    Criadero:
                  </h4>
                  <h5 className="text-small tracking-tight text-default-600">
                    {patient ? (
                      patient.horse_farm
                    ) : (
                      <Skeleton style={{ width: '100px' }}>
                        <div className="h-3 w-3/5 bg-default-200"></div>
                      </Skeleton>
                    )}
                  </h5>
                </div>
                <div className="flex flex-row gap-1 items-start justify-start">
                  <h4 className="text-small font-semibold leading-none text-default-600">
                    Teléfono:
                  </h4>
                  <h5 className="text-small tracking-tight text-default-600">
                    {patient ? (
                      patient.horse
                    ) : (
                      <Skeleton style={{ width: '100px' }}>
                        <div className="h-3 w-3/5 bg-default-200"></div>
                      </Skeleton>
                    )}
                  </h5>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-1 items-start justify-start">
                  <h4 className="text-small font-semibold leading-none text-default-600">
                    Dueño:
                  </h4>
                  <h5 className="text-small tracking-tight text-default-600">
                    {patient ? (
                      patient.owner_name
                    ) : (
                      <Skeleton style={{ width: '100px' }}>
                        <div className="h-3 w-3/5 bg-default-200"></div>
                      </Skeleton>
                    )}
                  </h5>
                </div>
                <div className="flex flex-row gap-1 items-start justify-start">
                  <h4 className="text-small font-semibold leading-none text-default-600">
                    Teléfono:
                  </h4>
                  <h5 className="text-small tracking-tight text-default-600">
                    {patient ? (
                      patient.owner_phone
                    ) : (
                      <Skeleton style={{ width: '100px' }}>
                        <div className="h-3 w-3/5 bg-default-200"></div>
                      </Skeleton>
                    )}
                  </h5>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
        <MainScreenObject
          urlGetRecords={urlGetRecords}
          urlNewRecord={urlNewRecord}
          urlUpdateRecord={urlUpdateRecord}
          tablePageSize={5}
          model={historyModel}
          tableComponentData={{
            title: 'Historia Clínica',
            button: {
              label: 'Nueva Historia',
            },
            columns: [
              { key: 'expand', label: '' },
              { key: 'id', label: 'Historia ID' },
              { key: 'date', label: 'Fecha' },
              { key: 'first_observation', label: 'Observación Inicial' },
              { key: 'treatment', label: 'Tratamiento' },
              { key: 'photos', label: 'Fotos' },
            ],
            renderCell,
          }}
          modalComponentData={{
            title: 'Detalle de Paciente',
          }}
          schema={{
            fields: [
              {
                key: 'id',
                label: 'Historia ID',
                type: 'hidden',
              },
              {
                key: 'patient_id',
                label: 'Patient ID',
                type: 'hidden',
              },
              {
                key: 'first_observation',
                label: 'Observación Inicial',
                type: 'textarea',
                isRequired: true,
              },
              {
                key: 'treatment',
                label: 'Tratamiento',
                type: 'textarea',
                isRequired: false,
              },
              {
                key: 'photos',
                label: 'Fotos',
                type: 'images',
                isRequired: false,
                preview: true,
              },
            ],
          }}
        />
      </Layout>
    </>
  );
}

ListHistory.auth = { adminOnly: true };
export default ListHistory;
