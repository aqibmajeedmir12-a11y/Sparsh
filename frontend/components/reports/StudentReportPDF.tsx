import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, borderBottom: '2px solid #6C63FF', paddingBottom: 16 },
  studentName: { fontSize: 22, fontWeight: 'bold', color: '#1a1a2e' },
  period: { fontSize: 12, color: '#666', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#f8f7ff', borderRadius: 8, padding: 12, alignItems: 'center', borderLeft: '3px solid #6C63FF' },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#6C63FF' },
  statLabel: { fontSize: 9, color: '#666', marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1a1a2e', marginBottom: 10, marginTop: 16, paddingBottom: 4, borderBottom: '1px solid #e0e0e0' },
  table: { marginBottom: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#6C63FF', padding: 8, borderRadius: 4 },
  tableHeaderText: { color: 'white', fontSize: 10, fontWeight: 'bold', flex: 1 },
  tableRow: { flexDirection: 'row', padding: 7, borderBottom: '0.5px solid #e8e8e8' },
  tableRowAlt: { backgroundColor: '#f9f9f9' },
  tableCell: { fontSize: 10, color: '#333', flex: 1 },
  footer: { marginTop: 'auto', borderTop: '1px solid #e0e0e0', paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: '#999' },
  badge: { backgroundColor: '#e8f5e9', borderRadius: 4, padding: '3 8', color: '#2e7d32', fontSize: 9 },
});

// Since PDF components must use PDF types instead of standard DOM, omit icons but keep structure.
export const StudentReportPDF = ({ student, period, stats, dailyActivity, quizSubmissions, subjectBreakdown, accessibilityUsage }: any) => (
  <Document title={`Sparsh Report - ${student?.full_name || 'Student'} - ${period?.label}`}>
    <Page size="A4" style={styles.page}>
      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.studentName}>{student?.full_name || 'Student'}</Text>
          <Text style={styles.period}>Learning Report: {period?.label}</Text>
          <Text style={{ fontSize: 10, color: '#999' }}>
            Grade {student?.grade || 'N/A'} | {student?.board || 'N/A'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 10, color: '#6C63FF', fontWeight: 'bold' }}>SPARSH</Text>
          <Text style={{ fontSize: 8, color: '#999' }}>Generated {new Date().toLocaleDateString('en-IN')}</Text>
          <View style={styles.badge}>
            <Text>{student?.disability_type === 'hearing' ? 'ISL Learner' : student?.disability_type === 'visual' ? 'Visual Learner' : 'Multi-Sensory Learner'}</Text>
          </View>
        </View>
      </View>

      {/* STATS ROW */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.lessonsCompleted || 0}</Text>
          <Text style={styles.statLabel}>Lessons{'\n'}Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{Math.round((stats?.totalTimeMinutes || 0) / 60)}h {(stats?.totalTimeMinutes || 0) % 60}m</Text>
          <Text style={styles.statLabel}>Time{'\n'}Spent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.signsPracticed || 0}</Text>
          <Text style={styles.statLabel}>ISL Signs{'\n'}Practiced</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: (stats?.avgQuizScore || 0) >= 60 ? '#00C9A7' : '#e17055' }]}>
            {(stats?.avgQuizScore || 0).toFixed(1)}%
          </Text>
          <Text style={styles.statLabel}>Average{'\n'}Quiz Score</Text>
        </View>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Sparsh — Accessible Education Platform</Text>
        <Text style={styles.footerText}>Confidential — For student use only</Text>
      </View>
    </Page>
  </Document>
);
