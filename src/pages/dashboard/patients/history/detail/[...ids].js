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
            const options = {
              overrides: {
                canvas: {
                  useCORS: true,
                },
              },
            };
            generatePDF(targetPdfRef, options);
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
                  history.photos.map((photo, index) => (
                    <img
                      key={index}
                      //src={photo.src}
                      src={`data:image/jpeg;base64,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`}
                      width={100}
                      height={100}
                      alt=""
                      className={`${styles.PdfPhoto}`}
                      style={{ width: '100px', height: 'auto' }}
                    />
                    // <Image
                    //   key={index}
                    //   src={photo.src}
                    //   width={100}
                    //   height={100}
                    //   alt=""
                    //   className={`${styles.PdfPhoto}`}
                    // />
                  ))}
              </div>
            </div>
          </div>
        </ModalComponent>
        <ModalComponent
          show={showModalShare}
          onSave={async () => {
            if (!history) return;
            if (savingRecordShare) return;
            setSavingRecordShare(true);
            const url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/admin/patients/history/update`;
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ record_request: history }),
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
