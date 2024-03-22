import ModalComponent from '@/components/dashboard/ModalComponent';
import TableComponent from '@/components/dashboard/TableComponent';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

import DetailRecord from '@/components/dashboard/DetailRecord';
import MediaUpload from '@/components/dashboard/MediaUpload';
import { toast } from 'react-toastify';
import Resizer from 'react-image-file-resizer';

async function getRecords(urlGetRecords, page = 1, pageSize = 5, search = '') {
  let url = `${urlGetRecords}`;
  url += url.indexOf('?') === -1 ? '?' : '&';
  url += `page=${page}&pageSize=${pageSize}&search=${search}`;
  const res = await fetch(url);
  return await res.json();
}

//FORMAT SCHEMA
function formatSchema(schema, listRecords) {
  const newSchema = { fields: [] };
  schema.fields.forEach((field) => {
    const fieldItems = ((field) => {
      if (!field) return undefined;
      if (field.items === '{{listRecords}}') {
        return listRecords.map((record) => {
          return {
            label: record.name,
            value: record.id,
          };
        });
      } else {
        return field.items;
      }
    })(field);
    newSchema.fields.push({
      ...field,
      items: fieldItems,
    });
  });
  return newSchema;
}

export default function MainScreenObject(props) {
  const {
    urlGetRecords,
    urlNewRecord,
    urlUpdateRecord,
    urlDeleteRecord,
    tablePageSize,
    model,
    tableComponentData,
    showSearch,
    modalComponentData,
    schema,
  } = props;
  const [listRecords, setListRecords] = React.useState([]);
  const [totalPages, setTotalPages] = React.useState(1);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(tablePageSize);
  const [refreshTable, setRefreshTable] = React.useState(0);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const [showModalProductDetail, setShowModalRecord] = React.useState(0);
  const [showModalDeleteRecord, setShowModalDeleteRecord] = React.useState(0);
  const [showModalChangeImage, setShowModalChangeImage] = React.useState(0);

  const [recordModal, setRecordModal] = React.useState(model);
  const [recordForDelete, setRecordForDelete] = React.useState(null);
  const [recordChange, setRecordChange] = React.useState(false);
  const [allowUploadImage, setAllowUploadImage] = React.useState(false);
  const [recordImage, setRecordImage] = React.useState(null);
  const [savingRecord, setSavingRecord] = React.useState(false);
  const [savingImage, setSavingImage] = React.useState(false);
  const [validation, setValidation] = React.useState({});
  const [formatedSchema, setFormatedSchema] = React.useState({ fields: [] });
  const [fieldImage, setFieldImage] = React.useState(null);

  const flag = React.useRef(false);

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
    // if (flag.current) return;
    // flag.current = true;
    if (!urlGetRecords) return;
    if (typeof window !== 'undefined') {
      const fetchRecords = async () => {
        setLoading(true);
        const recordsBD = await getRecords(
          urlGetRecords,
          page,
          pageSize,
          searchQuery
        );

        if (
          recordsBD &&
          recordsBD.data &&
          recordsBD.data.records &&
          recordsBD.data.records.length > 0
        ) {
          setListRecords(
            recordsBD.data.records.map((record, index) => {
              return {
                ...record,
                key: index,
                date: record.createdAt,
              };
            })
          );
          setTotalPages(recordsBD.data.totalPages);
        } else {
          setListRecords([]);
          setTotalPages(1);
          setPage(1);
        }
        setLoading(false);
      };
      fetchRecords();
    }
  }, [page, pageSize, searchQuery, refreshTable, urlGetRecords]);

  useEffect(() => {
    setFormatedSchema(formatSchema(schema, listRecords));
  }, [listRecords, schema]);

  const showRecordDetail = (record) => {
    setRecordModal(record);
    setShowModalRecord((currCount) => currCount + 1);
  };

  const showModalDelete = (record) => {
    setRecordForDelete(record);
    setShowModalDeleteRecord((currCount) => currCount + 1);
  };

  const onNewRecord = () => {
    setRecordModal(model);
    setShowModalRecord((currCount) => currCount + 1);
  };

  const showChangeImage = (fieldImage, multiple = false) => {
    setFieldImage(multiple ? [fieldImage] : fieldImage);
    setShowModalChangeImage((currCount) => currCount + 1);
  };

  const saveRecord = async () => {
    if (savingRecord) return;
    setSavingRecord(true);
    const url = recordModal.id ? urlUpdateRecord : urlNewRecord;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ record_request: recordModal }),
    });

    if (response.ok) {
      toast.success('Record saved');
      setShowModalRecord(0);
      setRefreshTable((currCount) => currCount + 1);
      setSavingRecord(false);
    } else {
      const { message, validation } = await response.json();
      if (validation) setValidation(validation);
      //toast.error(message);
      setSavingRecord(false);
    }
  };

  const deleteRecord = async (record_id) => {
    if (savingRecord) return;
    setSavingRecord(true);
    const url = urlDeleteRecord.replace('{record_id}', record_id);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      toast.success('Record deleted');
      setShowModalDeleteRecord(0);
      setRefreshTable((currCount) => currCount + 1);
      setSavingRecord(false);
    } else {
      toast.error('The record could not be deleted, please try again later.');
      setSavingRecord(false);
    }
  };

  const uploadImage = async () => {
    if (savingImage) return;
    setSavingImage(true);
    const body = new FormData();
    body.append('file', recordImage);
    const response = await fetch(
      process.env.NEXT_PUBLIC_BASE_URL + '/api/admin/media/upload',
      {
        method: 'POST',
        body,
      }
    );

    if (response.ok) {
      Resizer.imageFileResizer(
        recordImage,
        300,
        300,
        'JPEG',
        100,
        0,
        async (imageResized) => {
          const { url, fields, mediaKey, urlMedia } = await response.json();
          const formData = new FormData();
          Object.entries(fields).forEach(([key, value]) => {
            formData.append(key, value);
          });
          formData.append('file', imageResized);

          const uploadResponse = await fetch(url, {
            method: 'POST',
            body: formData,
          });

          if (uploadResponse.ok) {
            //toast.success('Image Saved');
            const newRecord = { ...recordModal };
            if (Array.isArray(fieldImage)) {
              newRecord[fieldImage[0]] = [
                ...newRecord[fieldImage[0]],
                { src: urlMedia },
              ];
            } else {
              newRecord[fieldImage] = { src: urlMedia };
            }
            setRecordModal(newRecord);
            setRecordChange(true);
          } else {
            toast.error('Error saving image');
          }
          setShowModalChangeImage(0);
          setSavingImage(false);
          setFieldImage(null);
        },
        'file',
        200,
        200
      );
    } else {
      setSavingImage(false);
      setFieldImage(null);
    }
  };

  return (
    <>
      <TableComponent
        data={{
          title: tableComponentData.title,
          button: {
            label: tableComponentData.button.label,
            callback: () => {
              onNewRecord();
            },
          },
          columns: tableComponentData.columns,
          rows: listRecords,
          pagination: {
            total: totalPages,
            initialPage: page,
            isDisabled: loading,
            onChange: (page) => {
              setPage(page);
            },
          },
          renderCell: tableComponentData.renderCell,
          showRecordDetail: showRecordDetail,
          showModalDelete: showModalDelete,
        }}
        showSearch={showSearch}
        onSearchChange={(value) => {
          setSearchQuery(value);
        }}
      />
      <ModalComponent
        show={showModalProductDetail}
        onSave={saveRecord}
        title={modalComponentData.title}
        onCloseModal={() => {
          onRecordChange(false);
          setValidation({});
        }}
        allowSave={recordChange}
        savingRecord={savingRecord}
      >
        <DetailRecord
          onRecordChange={(value) => {
            onRecordChange(value);
          }}
          record={recordModal}
          onFieldChange={(key, value) => {
            onFieldChange(key, value);
          }}
          onChangeImage={(image, multiple) => {
            showChangeImage(image, multiple);
          }}
          validation={validation}
          schema={formatedSchema}
        />
      </ModalComponent>
      <ModalComponent
        show={showModalChangeImage}
        onSave={uploadImage}
        title="Cambiar Imágen"
        onCloseModal={() => {
          setAllowUploadImage(false);
        }}
        allowSave={allowUploadImage}
        savingRecord={savingImage}
      >
        <MediaUpload
          onImageChange={(image) => {
            setRecordImage(image);
            setAllowUploadImage(true);
          }}
        />
      </ModalComponent>
      <ModalComponent
        show={showModalDeleteRecord}
        onSave={() => {
          deleteRecord(recordForDelete.id);
        }}
        title="Borrar Registro"
        onCloseModal={() => {}}
        allowSave={!savingRecord}
        savingRecord={savingRecord}
        labelButtonSave="Borrar"
      >
        <h1>¿Esta seguro de borrar este registro?</h1>
      </ModalComponent>
    </>
  );
}
