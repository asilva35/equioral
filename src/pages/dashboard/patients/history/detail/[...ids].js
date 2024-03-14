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
  Input,
  Select,
  SelectItem,
} from '@nextui-org/react';

import ModalComponent from '@/components/dashboard/ModalComponent';
import MediaUpload from '@/components/dashboard/MediaUpload';

import generatePDF, { Resolution, Margin } from 'react-to-pdf';
import { toast } from 'react-toastify';
import PdfHistoryDetail from '@/components/dashboard/histories/PdfHistoryDetail';

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
  const [showModalPdf, setShowModalPdf] = React.useState(0);
  const [showModalPdfV2, setShowModalPdfV2] = React.useState(0);
  const [showModalShare, setShowModalShare] = React.useState(0);
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
  const [savingRecordShare, setSavingRecordShare] = useState(false);

  const [validation, setValidation] = React.useState({});

  const first_observation_ref = React.useRef(null);
  const treatment_ref = React.useRef(null);
  const modalImagePreview = React.useRef(null);

  const targetPdfRef = React.useRef();

  const [photoB64, setPhotoB64] = React.useState(null);

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

  const generateUUID = (length) => {
    let d = new Date().getTime();
    const uuid = Array(length + 1)
      .join('x')
      .replace(/[x]/g, (c) => {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      });
    return uuid.slice(0, length);
  };

  const share_enabled_options = [
    { value: 'enabled', label: 'Enabled' },
    { value: 'disabled', label: 'Disabled' },
  ];

  useEffect(() => {
    async function fetchData(history_id) {
      const historyBD = await getHistory(history_id);
      if (
        historyBD &&
        historyBD.data &&
        historyBD.data.records &&
        historyBD.data.records.length > 0
      ) {
        const newhistory = historyBD.data.records[0];
        if (!newhistory.share_options) {
          const share_id = generateUUID(12);
          newhistory.share_id = share_id;
          const share_time = new Date().getTime();
          newhistory.share_options = {
            share_time,
            share_expiration: 1,
            share_password: '',
            share_enabled: 'enabled',
            share_url: `${process.env.NEXT_PUBLIC_BASE_URL}/share-history/${share_id}`,
          };
        }
        setHistory(newhistory);
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
    const new_history = { ...history };
    new_history.photos.map((photo) => {
      delete photo.base64;
    });
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ record_request: new_history }),
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

  const refInputShareUrl = React.useRef(null);

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
        <div className={`${styles.HistoryDetail}`}>
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
                        <h4 className={`${styles.CardTitle}`}>Caballo:</h4>
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
              {history && history.id && (
                <div className={`${styles.HeaderActions}`}>
                  <Button
                    color="danger"
                    variant="shadow"
                    className={`${styles.MainButton}`}
                    onClick={() => {
                      setShowModalPdf((currCount) => currCount + 1);
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
                  <Button
                    color="primary"
                    variant="shadow"
                    className={`${styles.MainButton}`}
                    onClick={() => {
                      setShowModalPdfV2((currCount) => currCount + 1);
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
                  <Button
                    color="success"
                    variant="shadow"
                    className={`${styles.MainButton}`}
                    onClick={() => {
                      setShowModalShare((currCount) => currCount + 1);
                    }}
                    startContent={
                      <Image
                        src="/assets/images/icon-share.svg"
                        width={24}
                        height={24}
                        alt=""
                      />
                    }
                  >
                    Compartir
                  </Button>
                </div>
              )}
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
        <ModalComponent
          size="5xl"
          show={showModalPdf}
          onSave={() => {
            const filename = 'historia.pdf';
            generatePDF(targetPdfRef, { filename });
          }}
          labelButtonSave="Descargar"
          title="Descargar Pdf"
          onCloseModal={() => {}}
          allowSave={() => {}}
          savingRecord={false}
        >
          <div ref={targetPdfRef} className={`${styles.PdfTarget}`}>
            <div className={`${styles.PdfHeader}`}>
              <div className={`${styles.PdfLeftHeader}`}>
                <div className={`${styles.PdfHeaderInfo}`}>
                  <div className={`${styles.PdfRowInfo}`}>
                    <div className={`${styles.PdfInfo}`}>
                      <h1>Id Historia: </h1>
                      <p>{history ? history.id : ''}</p>
                    </div>
                  </div>
                  <div className={`${styles.PdfRowInfo}`}>
                    <div className={`${styles.PdfInfo}`}>
                      <h1>Criadero: </h1>
                      <p>{patient ? patient.horse_farm : ''}</p>
                    </div>
                    <div className={`${styles.PdfInfo}`}>
                      <h1>Dueño: </h1>
                      <p>{patient ? patient.owner_name : ''}</p>
                    </div>
                  </div>
                  <div className={`${styles.PdfRowInfo}`}>
                    <div className={`${styles.PdfInfo}`}>
                      <h1>Caballo: </h1>
                      <p>{patient ? patient.horse : ''}</p>
                    </div>
                    <div className={`${styles.PdfInfo}`}>
                      <h1>Teléfono: </h1>
                      <p>{patient ? patient.owner_phone : ''}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${styles.PdfRightHeader}`}>
                <div className={`${styles.PdfLogo}`}>
                  <img
                    src="/assets/images/theme-light/logo.png"
                    width={176}
                    height={89}
                    alt="Logo"
                    style={{ width: '176px', height: '89px' }}
                  />
                </div>
              </div>
            </div>
            <div className={`${styles.PdfBody}`}>
              <div className={`${styles.PdfFieldGroup}`}>
                <div className={`${styles.PdfFieldGroupTitle}`}>
                  Observación Inicial
                </div>
                <div className={`${styles.PdfFieldGroupText}`}>
                  {history ? history.first_observation : ''}
                </div>
              </div>
              <div className={`${styles.PdfFieldGroup}`}>
                <div className={`${styles.PdfFieldGroupTitle}`}>
                  Tratamiento
                </div>
                <div className={`${styles.PdfFieldGroupText}`}>
                  {history ? history.treatment : ''}
                </div>
              </div>
              <div className={`${styles.PdfPhotos}`}>
                {history &&
                  Array.isArray(history.photos) &&
                  history.photos.map((photo, index) => {
                    fetch(photo.src)
                      .then((response) => response.blob())
                      .then((blob) => {
                        let reader = new FileReader();
                        reader.onloadend = function () {
                          photo.base64 = reader.result;
                        };
                        reader.readAsDataURL(blob);
                      });
                    return (
                      <div key={index}>
                        <img
                          key={index}
                          src={photo.base64}
                          width={512}
                          height={512}
                          alt=""
                          className={`${styles.PdfPhoto}`}
                          style={{
                            width: '512px',
                            height: 'auto',
                            minHeight: '50px',
                            border: '2px solid #000',
                          }}
                        />
                        {/* <Image
                          src={photo.src}
                          width={512}
                          height={512}
                          alt=""
                          className={`${styles.PdfPhoto}`}
                          style={{
                            width: '512px',
                            height: 'auto',
                            minHeight: '50px',
                            border: '2px solid #f00',
                          }}
                        /> */}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </ModalComponent>
        <ModalComponent
          size="5xl"
          show={showModalPdfV2}
          onSave={() => {
            // const filename = 'historia.pdf';
            // generatePDF(targetPdfRef, { filename });
          }}
          labelButtonSave="Descargar"
          title="Descargar Pdf"
          onCloseModal={() => {}}
          allowSave={() => {}}
          savingRecord={false}
        >
          <PdfHistoryDetail history={history} patient={patient} />
        </ModalComponent>
        <ModalComponent
          show={showModalShare}
          onSave={async () => {
            if (!history) return;
            if (savingRecordShare) return;
            setSavingRecordShare(true);
            const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/history/update`;
            const new_history = { ...history };
            new_history.photos.map((photo) => {
              delete photo.base64;
            });
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ record_request: new_history }),
            });
            if (response.ok) {
              toast.success('Registro Guardado con éxito');
            } else {
              toast.error('Ocurrió un error al guardar el registro');
            }
            setSavingRecordShare(false);
          }}
          labelButtonSave="Guardar Url"
          title="Compartir Historia"
          onCloseModal={() => {
            setSavingRecordShare(false);
          }}
          allowSave={!savingRecordShare}
          savingRecord={savingRecordShare}
        >
          <div className={`${styles.ShareOptions}`}>
            <div className={`${styles.ShareOption}`}>
              <Input
                isReadOnly={true}
                isRequired={true}
                ref={refInputShareUrl}
                type="text"
                label="Link para compartir"
                isInvalid={validation['share_url'] ? true : false}
                errorMessage={validation['share_url']}
                onChange={(e) => {}}
                defaultValue={
                  history && history.share_options
                    ? history.share_options.share_url
                    : ''
                }
                endContent={
                  <Button
                    color="primary"
                    size="sm"
                    variant="light"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard
                          .writeText(refInputShareUrl.current.value)
                          .then(
                            function () {
                              console.log(
                                'Copying to clipboard was successful!'
                              );
                            },
                            function (err) {
                              console.error('Could not copy text: ', err);
                            }
                          );
                      } else {
                        refInputShareUrl.current.select();
                        document.execCommand('copy');
                      }
                    }}
                  >
                    Copy
                  </Button>
                }
              />
            </div>
            <div className={`${styles.ShareOption}`}>
              <Input
                type="number"
                label="Expiration"
                isInvalid={validation['share_expiration'] ? true : false}
                errorMessage={validation['share_expiration']}
                onChange={(e) => {
                  if (Number.parseInt(e.target.value) < 0) {
                    e.target.value = 0;
                    setValidation({ share_expiration: 'Can not be negative' });
                  } else {
                    setValidation({});
                    const new_record = { ...history };
                    new_record.share_options.share_expiration = e.target.value;
                    setHistory(new_record);
                  }
                }}
                defaultValue={
                  history && history.share_options
                    ? Number.parseInt(history.share_options.share_expiration)
                    : 1
                }
                endContent={<div className={`${styles.smallText}`}>Day(s)</div>}
              />
            </div>
            <div className={`${styles.ShareOption}`}>
              <Input
                type="text"
                label="Password"
                isInvalid={validation['share_password'] ? true : false}
                errorMessage={validation['share_password']}
                onChange={(e) => {
                  const new_record = { ...history };
                  new_record.share_options.share_password = e.target.value;
                  setHistory(new_record);
                }}
                defaultValue={
                  history && history.share_options
                    ? history.share_options.password
                    : ''
                }
              />
            </div>
            <div className={`${styles.ShareOption}`}>
              <Select
                items={share_enabled_options}
                className="max-w-xs"
                selectionMode={'single'}
                defaultSelectedKeys={
                  history && history.share_options
                    ? [history.share_options.share_enabled]
                    : ['enabled']
                }
                isRequired={true}
                isInvalid={validation['share_enabled'] ? true : false}
                errorMessage={validation['share_enabled']}
                onChange={(e) => {
                  const new_record = { ...history };
                  new_record.share_options.share_enabled = e.target.value;
                  setHistory(new_record);
                }}
              >
                {(item) => (
                  <SelectItem key={item.value}>{item.label}</SelectItem>
                )}
              </Select>
            </div>
          </div>
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
