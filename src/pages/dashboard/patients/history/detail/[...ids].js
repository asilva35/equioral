import Layout from '@/components/Layout';
import Metaheader from '@/components/Metaheader';
import { ThemeContext } from '@/contexts/ThemeContext';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import BreadCrumbs from '@/components/dashboard/BreadCrumbs';
import historyModel from '@/models/historyModel';
import Image from 'next/image';
import { formatDate, capitalizeFirstLetter, shortUUID } from '@/utils/utils';
import { useRouter } from 'next/router';
import styles from '@/styles/dashboard/histories/HistoryDetail.module.css';

import {
  Card,
  CardHeader,
  Skeleton,
  Textarea,
  Button,
  CircularProgress,
} from '@nextui-org/react';

import ModalComponent from '@/components/dashboard/ModalComponent';
import MediaUpload from '@/components/dashboard/MediaUpload';

import generatePDF from 'react-to-pdf';

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

async function getPatient(patient_id) {
  let url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/get?id=${patient_id}`;
  const res = await fetch(url);
  return await res.json();
}

async function getHistory(history_id) {
  let url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/history/get?id=${history_id}`;
  const res = await fetch(url);
  return await res.json();
}

function HistoryDetail() {
  const router = useRouter();
  const { ids } = router.query;
  const [patient_id, history_id] = ids ? ids : [null, null];
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [urlGetRecords, setUrlGetRecords] = useState(null);
  const urlNewRecord = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/history/new`;
  const urlUpdateRecord = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/history/update`;

  const [showModalChangeImage, setShowModalChangeImage] = React.useState(0);
  const [allowUploadImage, setAllowUploadImage] = React.useState(false);
  const [savingImage, setSavingImage] = React.useState(false);
  const [recordImage, setRecordImage] = React.useState(null);
  const [fieldImage, setFieldImage] = React.useState(null);

  const [previewImage, setPreviewImage] = React.useState(null);

  const showChangeImage = (fieldImage, multiple = false) => {
    setFieldImage(multiple ? [fieldImage] : fieldImage);
    setShowModalChangeImage((currCount) => currCount + 1);
  };

  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState(null);
  const [changeField, setChangeField] = useState(false);
  const [savingRecord, setSavingRecord] = useState(false);

  const first_observation_ref = React.useRef(null);
  const treatment_ref = React.useRef(null);
  const modalImagePreview = React.useRef(null);

  const targetPdfRef = React.useRef();

  useEffect(() => {
    async function fetchData(patient_id) {
      const patientBD = await getPatient(patient_id);
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
      historyModel.patient_id = patient_id;
      fetchData(patient_id);
    }
  }, [patient_id]);

  useEffect(() => {
    async function fetchData(history_id) {
      const historyBD = await getHistory(history_id);
      if (
        historyBD &&
        historyBD.data &&
        historyBD.data.records &&
        historyBD.data.records.length > 0
      ) {
        setHistory(historyBD.data.records[0]);
      }
    }
    if (history_id) {
      fetchData(history_id);
    }
  }, [history_id]);

  const viewHistoryDetail = (record) => {
    router.push(
      '/dashboard/patients/history/detail/' +
        record.patient_id +
        '/' +
        record.id
    );
  };

  const debouncedOnChange = React.useCallback(
    debounce((key, e, history) => {
      if (!key || !e) return;
      changeRecord(key, e.target.value, history);
    }, 3000),
    []
  );

  const changeRecord = (key, value, history) => {
    const new_history = { ...history };
    new_history[key] = value;
    setHistory(new_history);
  };

  const saveRecord = useCallback(async () => {
    if (!changeField) return;
    if (savingRecord) return;
    setSavingRecord(changeField);
    const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/history/update`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ record_request: history }),
    });

    if (response.ok) {
      setChangeField(false);
      setSavingRecord(false);
    } else {
      setChangeField(false);
      setSavingRecord(false);
    }
  }, [history, savingRecord]);

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
      const { url, fields, mediaKey, urlMedia } = await response.json();
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', recordImage);

      const uploadResponse = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (uploadResponse.ok) {
        //toast.success('Image Saved');
        const newRecord = { ...history };
        if (Array.isArray(fieldImage)) {
          newRecord[fieldImage[0]] = [
            ...newRecord[fieldImage[0]],
            { src: urlMedia },
          ];
        } else {
          newRecord[fieldImage] = { src: urlMedia };
        }
        setHistory(newRecord);
        setChangeField('photos');
        //setRecordChange(true);
      } else {
        //toast.error('Error saving image');
      }
      setShowModalChangeImage(0);
      setSavingImage(false);
      setFieldImage(null);
    } else {
      setSavingImage(false);
      setFieldImage(null);
    }
  };

  useEffect(() => {
    if (!history) return;
    saveRecord();
  }, [history]);

  return (
    <>
      <Metaheader title="Historia del Paciente | Equioral" />
      <Layout theme={theme} toogleTheme={toggleTheme}>
        <BreadCrumbs
          theme={theme}
          data={{
            links: [
              { href: '/dashboard', title: 'Home' },
              { href: '/dashboard/patients', title: 'Pacientes' },
              {
                href: `/dashboard/patients/history/${patient_id}`,
                title: 'Historias Clínicas',
              },
              { href: false, title: 'Detalle de Historia' },
            ],
          }}
        />
        <div className={`${styles.HistoryDetail}`} ref={targetPdfRef}>
          <div className={`${styles.Container}`}>
            <div className={`${styles.Header}`}>
              <Card className="" style={{ width: 'auto', margin: '30px 0' }}>
                <CardHeader className={`${styles.CardHeader}`}>
                  <div className={`${styles.CardRow}`}>
                    <h4 className={`${styles.CardTitle}`}>ID Historia:</h4>
                    <h5 className={`${styles.CardText}`}>
                      {history ? (
                        history.id
                      ) : (
                        <Skeleton className={`${styles.Skeleton}`}>
                          <div
                            className={`${styles.SkeletonBody} ${styles.thin}`}
                          ></div>
                        </Skeleton>
                      )}
                    </h5>
                  </div>
                  <div className={`${styles.CardRow}`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row gap-1 items-start justify-start">
                        <h4 className={`${styles.CardTitle}`}>Criadero:</h4>
                        <h5 className={`${styles.CardText}`}>
                          {patient ? (
                            patient.horse_farm
                          ) : (
                            <Skeleton className={`${styles.Skeleton}`}>
                              <div
                                className={`${styles.SkeletonBody} ${styles.thin}`}
                              ></div>
                            </Skeleton>
                          )}
                        </h5>
                      </div>
                      <div className="flex flex-row gap-1 items-start justify-start">
                        <h4 className={`${styles.CardTitle}`}>Teléfono:</h4>
                        <h5 className={`${styles.CardText}`}>
                          {patient ? (
                            patient.horse
                          ) : (
                            <Skeleton className={`${styles.Skeleton}`}>
                              <div
                                className={`${styles.SkeletonBody} ${styles.thin}`}
                              ></div>
                            </Skeleton>
                          )}
                        </h5>
                      </div>
                      <div className="flex flex-row gap-1 items-start justify-start">
                        <h4 className={`${styles.CardTitle}`}>Fecha:</h4>
                        <h5 className={`${styles.CardText}`}>
                          {history ? (
                            formatDate(history.createdAt)
                          ) : (
                            <Skeleton className={`${styles.Skeleton}`}>
                              <div
                                className={`${styles.SkeletonBody} ${styles.thin}`}
                              ></div>
                            </Skeleton>
                          )}
                        </h5>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-row gap-1 items-start justify-start">
                        <h4 className={`${styles.CardTitle}`}>Dueño:</h4>
                        <h5 className={`${styles.CardText}`}>
                          {patient ? (
                            patient.owner_name
                          ) : (
                            <Skeleton className={`${styles.Skeleton}`}>
                              <div
                                className={`${styles.SkeletonBody} ${styles.thin}`}
                              ></div>
                            </Skeleton>
                          )}
                        </h5>
                      </div>
                      <div className="flex flex-row gap-1 items-start justify-start">
                        <h4 className={`${styles.CardTitle}`}>Teléfono:</h4>
                        <h5 className={`${styles.CardText}`}>
                          {patient ? (
                            patient.owner_phone
                          ) : (
                            <Skeleton className={`${styles.Skeleton}`}>
                              <div
                                className={`${styles.SkeletonBody} ${styles.thin}`}
                              ></div>
                            </Skeleton>
                          )}
                        </h5>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
              <Button
                color="danger"
                variant="shadow"
                className={`${styles.MainButton}`}
                onClick={() => {
                  const filename = history.id
                    ? `${history.id}.pdf`
                    : 'history.pdf';
                  generatePDF(targetPdfRef, { filename });
                }}
                startContent={
                  <Image
                    src="/assets/images/icon-pdf.svg"
                    width={24}
                    height={24}
                    alt=""
                  />
                }
              >
                PDF
              </Button>
            </div>
            <div className={`${styles.Body}`}>
              <div className={`${styles.FieldGroup}`}>
                <div className={`${styles.FieldGroupTitle}`}>
                  Observación Inicial{' '}
                  {changeField && changeField === 'first_observation' && (
                    <Button
                      color="primary"
                      variant="solid"
                      isDisabled={
                        savingRecord && savingRecord === 'first_observation'
                          ? true
                          : false
                      }
                      size="sm"
                      className={`${styles.SaveButton}`}
                      onClick={() => {
                        changeRecord(
                          'first_observation',
                          first_observation_ref.current.value,
                          history
                        );
                        setChangeField('first_observation');
                      }}
                    >
                      Save
                    </Button>
                  )}
                  {savingRecord && savingRecord === 'first_observation' && (
                    <>
                      <CircularProgress
                        color="primary"
                        aria-label="Saving..."
                        size="sm"
                        className={`${styles.CircularProgress}`}
                      />
                    </>
                  )}
                </div>
                {history ? (
                  <Textarea
                    isReadOnly={false}
                    placeholder={'Ingrese La Observación Inicial'}
                    ref={first_observation_ref}
                    onChange={(e) => {
                      e.persist(); // React pools events, so we need to persist the event
                      setChangeField('first_observation');
                      debouncedOnChange('first_observation', e, history);
                    }}
                    defaultValue={history ? history.first_observation : ''}
                  />
                ) : (
                  <Skeleton className={`${styles.Skeleton} ${styles.big}`}>
                    <div className={`${styles.SkeletonBody}`}></div>
                  </Skeleton>
                )}
              </div>
              <div className={`${styles.FieldGroup}`}>
                <div className={`${styles.FieldGroupTitle}`}>
                  Tratamiento{' '}
                  {changeField && changeField === 'treatment' && (
                    <Button
                      color="primary"
                      variant="solid"
                      isDisabled={
                        savingRecord && savingRecord === 'treatment'
                          ? true
                          : false
                      }
                      size="sm"
                      className={`${styles.SaveButton}`}
                      onClick={() => {
                        changeRecord(
                          'treatment',
                          treatment_ref.current.value,
                          history
                        );
                        setChangeField('treatment');
                      }}
                    >
                      Save
                    </Button>
                  )}
                  {savingRecord && savingRecord === 'treatment' && (
                    <>
                      <CircularProgress
                        color="primary"
                        aria-label="Saving..."
                        size="sm"
                        className={`${styles.CircularProgress}`}
                      />
                    </>
                  )}
                </div>
                {history ? (
                  <Textarea
                    isReadOnly={false}
                    placeholder={'Ingrese el Tratamiento'}
                    ref={treatment_ref}
                    onChange={(e) => {
                      e.persist(); // React pools events, so we need to persist the event
                      setChangeField('treatment');
                      debouncedOnChange('treatment', e, history);
                    }}
                    defaultValue={history ? history.treatment : ''}
                  />
                ) : (
                  <Skeleton className={`${styles.Skeleton} ${styles.big}`}>
                    <div className={`${styles.SkeletonBody}`}></div>
                  </Skeleton>
                )}
              </div>
              <div className={`${styles.Photos}`}>
                <div className={`${styles.ButtonPhotoCnt}`}>
                  <Button
                    color="primary"
                    variant="solid"
                    size="sm"
                    onClick={() => {
                      showChangeImage('photos', true);
                    }}
                  >
                    Añadir Foto
                  </Button>
                  {savingRecord && savingRecord === 'photos' && (
                    <CircularProgress
                      color="success"
                      aria-label="Saving..."
                      size="sm"
                      className={`${styles.CircularProgress}`}
                    />
                  )}
                </div>
                <div className={`${styles.PhotosCnt}`}>
                  {history &&
                    Array.isArray(history.photos) &&
                    history.photos.map((photo, index) => (
                      <Image
                        key={index}
                        src={photo.src}
                        width={100}
                        height={100}
                        alt=""
                        className={`${styles.Photo}`}
                        onClick={() => {
                          setPreviewImage([index, photo.src]);
                          modalImagePreview.current.classList.add(
                            `${styles.show}`
                          );
                        }}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <ModalComponent
          show={showModalChangeImage}
          onSave={uploadImage}
          title="Añadir Imágen"
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
        <div className={`${styles.ModalImageCnt}`} ref={modalImagePreview}>
          <div className={`${styles.ModalImageBar}`}>
            <Button
              color="primary"
              variant="light"
              size="sm"
              onClick={() => {
                modalImagePreview.current.classList.remove(`${styles.show}`);
                setPreviewImage(null);
              }}
            >
              Cerrar
            </Button>
            <Button
              color="danger"
              variant="solid"
              size="sm"
              onClick={() => {
                const new_record = { ...history };
                new_record.photos.splice(previewImage[0], 1);
                setHistory(new_record);
                setChangeField('photos');
                modalImagePreview.current.classList.remove(`${styles.show}`);
                setPreviewImage(null);
              }}
            >
              Borrar
            </Button>
          </div>
          {previewImage && previewImage[1] ? (
            <Image
              src={previewImage ? previewImage[1] : ''}
              width={200}
              height={200}
              alt=""
              className={`${styles.ModalImage}`}
            />
          ) : (
            <Skeleton className={`${styles.Skeleton} ${styles.big}`}>
              <div className={`${styles.SkeletonBody}`}></div>
            </Skeleton>
          )}
        </div>
      </Layout>
    </>
  );
}

HistoryDetail.auth = { adminOnly: true };
export default HistoryDetail;
