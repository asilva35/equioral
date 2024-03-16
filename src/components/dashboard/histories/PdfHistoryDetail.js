import React from 'react';
import {
  Text,
  Font,
  Page,
  View,
  Image,
  Document,
  StyleSheet,
  PDFViewer,
  PDFDownloadLink,
} from '@react-pdf/renderer';

const MyDoc = (props) => {
  const { history, patient } = props;
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
    },
    body: {
      flexDirection: 'column',
      gap: 20,
      padding: 10,
    },
    logoContainer: {
      justifyContent: 'flex-start',
      padding: '20px 20px 0 0',
    },
    section: {
      margin: 10,
      padding: 10,
      flexGrow: 1,
    },
    row: {
      display: 'flex',
      flexDirection: 'row',
      gap: 10,
      margin: '3px 0',
    },
    col: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      margin: '10px 0',
    },
    title: {
      fontSize: 14,
      fontWeight: 600,
    },
    text: {
      fontSize: 12,
      fontWeight: 400,
    },
    logo: {
      width: 126,
      height: 'auto',
    },
    photos: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      justifyContent: 'flex-start',
    },
    photo: {
      width: 100,
      height: 'auto',
    },
  });
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.section}>
            <View style={styles.row}>
              <Text style={styles.title}>Id Historia: </Text>
              <Text style={styles.text}>{history ? history.id : ''}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.title}>Criadero: </Text>
              <Text style={styles.text}>
                {patient ? patient.horse_farm : ''}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.title}>Dueño: </Text>
              <Text style={styles.text}>
                {patient ? patient.owner_name : ''}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.title}>Caballo: </Text>
              <Text style={styles.text}>{patient ? patient.horse : ''}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.title}>Teléfono: </Text>
              <Text style={styles.text}>
                {patient ? patient.owner_phone : ''}
              </Text>
            </View>
          </View>
          <View style={styles.logoContainer}>
            <Image
              style={styles.logo}
              src={`/assets/images/theme-light/logo.png`}
              alt="Logo Equioral"
            />
          </View>
        </View>
        <View style={styles.body}>
          <View style={styles.col}>
            <Text style={styles.title}> Observación Inicial </Text>
            <Text style={styles.text}>
              {history ? history.first_observation : ''}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.title}> Tratamiento </Text>
            <Text style={styles.text}>{history ? history.treatment : ''}</Text>
          </View>
          <View style={styles.photos}>
            {history &&
              Array.isArray(history.photos) &&
              history.photos.map((photo, index) => {
                return (
                  <div key={index}>
                    <Image src={photo.src} alt="" style={styles.photo} />
                  </div>
                );
              })}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default function PdfHistoryDetail(props) {
  const { history, patient } = props;

  return (
    // <PDFViewer style={{ height: '90vh', width: '100%' }}>
    <PDFDownloadLink
      document={<MyDoc history={history} patient={patient} />}
      fileName="somename.pdf"
    >
      {({ blob, url, loading, error }) =>
        loading ? 'Loading document...' : 'Download now!'
      }
    </PDFDownloadLink>

    // </PDFViewer>
  );
}
