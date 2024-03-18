import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import styles from '@/styles/HistoryDetailShare.module.css';
import { useRouter } from 'next/router';
import { Skeleton, Button, Input } from '@nextui-org/react';
import Metaheader from '@/components/Metaheader';
import generatePDF from 'react-to-pdf';
import ModalComponent from '@/components/dashboard/ModalComponent';

async function getPatient(patient_id) {
  let url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/patients/share/get?id=${patient_id}`;
  const res = await fetch(url);
  return await res.json();
}

async function getHistory(share_id) {
  let url = `${process.env.NEXT_PUBLIC_BASE_URL}/api/history/share/get?share_id=${share_id}`;
  const res = await fetch(url);
  return await res.json();
}

export default function ShareHistory() {
  const router = useRouter();
  const { share_id } = router.query;
  const targetPdfRef = useRef(null);
  const [patient, setPatient] = useState(null);
  const [history, setHistory] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showModalPassword, setShowModalPassword] = useState(0);
  const [validation, setValidation] = useState({});

  const passwordRef = useRef(null);

  useEffect(() => {
    async function fetchData(share_id) {
      const historyBD = await getHistory(share_id);
      if (
        historyBD &&
        historyBD.data &&
        historyBD.data.records &&
        historyBD.data.records.length > 0
      ) {
        setHistory(historyBD.data.records[0]);
        const patientBD = await getPatient(
          historyBD.data.records[0].patient_id
        );
        if (
          patientBD &&
          patientBD.data &&
          patientBD.data.records &&
          patientBD.data.records.length > 0
        ) {
          setPatient(patientBD.data.records[0]);
        }
      }
    }
    if (share_id) {
      fetchData(share_id);
    }
  }, [share_id]);

  useEffect(() => {
    if (!patient && !history) return;
    if (share_id !== history.share_id) return;
    if (!history.share_options === undefined) return;

    const { share_enabled, share_expiration, share_time, share_password } =
      history.share_options;

    if (share_enabled !== 'enabled') {
      //console.log('Enabled False');
      return;
    }
    if (share_expiration) {
      const expiration = share_expiration * 1000 * 60 * 60 * 24;
      const now = new Date().getTime();

      if (now - share_time > expiration) {
        //console.log('Expired');
        return;
      }
    }

    if (share_password) {
      setShowModalPassword((prev) => prev + 1);
      return;
    }

    setShowInfo(true);
  }, [history, patient, share_id]);
  return (
    <>
      <Metaheader title="Historia del Paciente | Equioral" />
      {showInfo ? (
        <>
          <div className={`${styles.TopNav}`}>
            <Button
              color="danger"
              variant="shadow"
              className={`${styles.MainButton}`}
              onClick={() => {
                const filename = 'history.pdf';
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
          <div ref={targetPdfRef} className={`${styles.PdfTarget}`}>
            <div className={`${styles.PdfHeader}`}>
              <div className={`${styles.PdfLeftHeader}`}>
                <div className={`${styles.PdfHeaderInfo}`}>
                  <div className={`${styles.PdfRowInfo}`}>
                    <div className={`${styles.PdfInfo}`}>
                      <h1>Id Historia: </h1>
                      <div className={`${styles.TextCnt}`}>
                        {history ? (
                          history.id
                        ) : (
                          <Skeleton className={`${styles.Skeleton}`}>
                            <div
                              className={`${styles.SkeletonBody} ${styles.thin}`}
                            ></div>
                          </Skeleton>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`${styles.PdfRowInfo}`}>
                    <div className={`${styles.PdfInfo}`}>
                      <h1>Criadero: </h1>
                      <div className={`${styles.TextCnt}`}>
                        {patient ? (
                          patient.horse_farm
                        ) : (
                          <Skeleton className={`${styles.Skeleton}`}>
                            <div
                              className={`${styles.SkeletonBody} ${styles.thin}`}
                            ></div>
                          </Skeleton>
                        )}
                      </div>
                    </div>
                    <div className={`${styles.PdfInfo}`}>
                      <h1>Dueño: </h1>
                      <div className={`${styles.TextCnt}`}>
                        {patient ? (
                          patient.owner_name
                        ) : (
                          <Skeleton className={`${styles.Skeleton}`}>
                            <div
                              className={`${styles.SkeletonBody} ${styles.thin}`}
                            ></div>
                          </Skeleton>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`${styles.PdfRowInfo}`}>
                    <div className={`${styles.PdfInfo}`}>
                      <h1>Caballo: </h1>
                      <div className={`${styles.TextCnt}`}>
                        {patient ? (
                          patient.horse
                        ) : (
                          <Skeleton className={`${styles.Skeleton}`}>
                            <div
                              className={`${styles.SkeletonBody} ${styles.thin}`}
                            ></div>
                          </Skeleton>
                        )}
                      </div>
                    </div>
                    <div className={`${styles.PdfInfo}`}>
                      <h1>Teléfono: </h1>
                      <div className={`${styles.TextCnt}`}>
                        {patient ? (
                          patient.owner_phone
                        ) : (
                          <Skeleton className={`${styles.Skeleton}`}>
                            <div
                              className={`${styles.SkeletonBody} ${styles.thin}`}
                            ></div>
                          </Skeleton>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${styles.PdfRightHeader}`}>
                <div className={`${styles.PdfLogo}`}>
                  <Image
                    src="/assets/images/theme-light/logo.png"
                    width={176}
                    height={89}
                    alt="Logo"
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
                  <div className={`${styles.TextCnt}`}>
                    {history ? (
                      history.first_observation
                    ) : (
                      <Skeleton className={`${styles.Skeleton}`}>
                        <div className={`${styles.SkeletonBody}`}></div>
                      </Skeleton>
                    )}
                  </div>
                </div>
              </div>
              <div className={`${styles.PdfFieldGroup}`}>
                <div className={`${styles.PdfFieldGroupTitle}`}>
                  Tratamiento
                </div>
                <div className={`${styles.PdfFieldGroupText}`}>
                  <div className={`${styles.TextCnt}`}>
                    {history ? (
                      history.treatment
                    ) : (
                      <Skeleton className={`${styles.Skeleton}`}>
                        <div className={`${styles.SkeletonBody}`}></div>
                      </Skeleton>
                    )}
                  </div>
                </div>
              </div>
              <div className={`${styles.PdfPhotos}`}>
                {history &&
                  Array.isArray(history.photos) &&
                  history.photos.map((photo, index) => (
                    <Image
                      key={index}
                      src={photo.src}
                      width={100}
                      height={100}
                      alt=""
                      className={`${styles.PdfPhoto}`}
                    />
                  ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className={`${styles.NoData}`}>
          Loading...
          <Skeleton className={`${styles.Skeleton}`}>
            <div className={`${styles.SkeletonBody} ${styles}`}></div>
          </Skeleton>
        </div>
      )}
      <ModalComponent
        show={showModalPassword}
        onSave={() => {
          if (
            history.share_options.share_password === passwordRef.current.value
          ) {
            setShowInfo(true);
            setShowModalPassword(0);
            setValidation({});
          } else {
            setValidation({ share_password: 'Password incorrecto' });
          }
        }}
        labelButtonSave="Enviar"
        title="Ingrese el Password para ver la historia"
        onCloseModal={() => {}}
        allowSave={() => {}}
        savingRecord={false}
      >
        <Input
          ref={passwordRef}
          type="text"
          label="Password"
          isInvalid={validation['share_password'] ? true : false}
          errorMessage={validation['share_password']}
          onChange={(e) => {}}
        />
      </ModalComponent>
    </>
  );
}
