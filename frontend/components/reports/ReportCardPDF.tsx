import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

Font.register({
  family: 'Inter',
  src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf',
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'Inter',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#6C63FF',
    paddingBottom: 20,
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    color: '#302b63',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  logoBox: {
    width: 50,
    height: 50,
    backgroundColor: '#6C63FF',
    color: 'white',
    fontSize: 24,
    textAlign: 'center',
    paddingTop: 10,
    borderRadius: 10,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#302b63',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    width: 150,
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
    fontSize: 10,
    color: '#333',
  },
  gradeBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  gradeBox: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center',
  },
  gradeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6C63FF',
    marginTop: 5,
  },
  gradeLabel: {
    fontSize: 10,
    color: '#666',
  },
  remarksBox: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
  },
  remarkText: {
    fontSize: 10,
    color: '#444',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#aaa',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  }
});

interface ReportCardProps {
  studentName: string;
  className: string;
  attendance: string;
  avgScore: string;
  islLevel: string;
  teacherRemarks: string;
  date: string;
}

const ReportCardPDF: React.FC<ReportCardProps> = ({ studentName, className, attendance, avgScore, islLevel, teacherRemarks, date }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Sparsh Report Card</Text>
          <Text style={styles.subtitle}>Accessible Education Platform</Text>
        </View>
        <View style={styles.logoBox}>
          <Text>S</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Student Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Student Name:</Text>
          <Text style={styles.value}>{studentName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Class / Cohort:</Text>
          <Text style={styles.value}>{className}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Report Date:</Text>
          <Text style={styles.value}>{date}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.gradeBoxRow}>
          <View style={styles.gradeBox}>
            <Text style={styles.gradeLabel}>Average Score</Text>
            <Text style={styles.gradeValue}>{avgScore}</Text>
          </View>
          <View style={styles.gradeBox}>
            <Text style={styles.gradeLabel}>Attendance</Text>
            <Text style={styles.gradeValue}>{attendance}</Text>
          </View>
          <View style={styles.gradeBox}>
            <Text style={styles.gradeLabel}>ISL Proficiency</Text>
            <Text style={styles.gradeValue}>{islLevel}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Teacher&apos;s Remarks</Text>
        <View style={styles.remarksBox}>
          <Text style={styles.remarkText}>{teacherRemarks || 'No remarks provided.'}</Text>
        </View>
      </View>

      <Text style={styles.footer}>
        This is an automatically generated document by Sparsh. For inquiries, contact admin@sparsh.edu.
      </Text>
    </Page>
  </Document>
);

export default ReportCardPDF;
