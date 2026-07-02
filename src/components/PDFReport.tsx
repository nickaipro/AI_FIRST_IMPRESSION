import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import type { AnalysisResult } from '@/types';

// Estilos del PDF con identidad morada
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  // === PORTADA ===
  coverPage: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#7e22ce',
    marginBottom: 20,
  },
  coverTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 40,
  },
  scoreCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#f3e8ff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreNumber: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#7e22ce',
  },
  scoreMax: {
    fontSize: 24,
    color: '#9333ea',
  },
  gradeTier: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7e22ce',
    marginBottom: 40,
  },
  coverUrl: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 8,
  },
  coverMeta: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  coverDate: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 60,
  },
  // === CONTENIDO ===
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7e22ce',
    marginBottom: 12,
    borderBottom: '2 solid #e9d5ff',
    paddingBottom: 6,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b21a8',
    marginTop: 12,
    marginBottom: 8,
  },
  text: {
    fontSize: 11,
    color: '#374151',
    lineHeight: 1.6,
    marginBottom: 8,
  },
  textBold: {
    fontWeight: 'bold',
  },
  note: {
    fontSize: 10,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderLeft: '3 solid #d8b4fe',
  },
  // === TABLA ===
  table: {
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#f3e8ff',
    borderBottom: '2 solid #c084fc',
  },
  tableCol: {
    flex: 1,
    padding: 4,
  },
  tableColNarrow: {
    width: '20%',
    padding: 4,
  },
  tableColWide: {
    width: '50%',
    padding: 4,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6b21a8',
  },
  tableCell: {
    fontSize: 10,
    color: '#374151',
  },
  // === HALLAZGOS Y ACCIONES ===
  finding: {
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#f9fafb',
    borderLeft: '3 solid #d8b4fe',
  },
  findingTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  findingText: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
    marginRight: 6,
    marginBottom: 4,
  },
  badgeCritical: {
    backgroundColor: '#fecaca',
    color: '#991b1b',
  },
  badgeHigh: {
    backgroundColor: '#fed7aa',
    color: '#9a3412',
  },
  badgeMedium: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
  },
  badgeLow: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
  },
  badgeOptional: {
    backgroundColor: '#f3e8ff',
    color: '#6b21a8',
  },
  // === HERO REWRITE ===
  heroBox: {
    padding: 16,
    backgroundColor: '#f3e8ff',
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 12,
  },
  heroLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6b21a8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroText: {
    fontSize: 11,
    color: '#1f2937',
    marginBottom: 8,
  },
  // === PIE DE PÁGINA ===
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 9,
    color: '#9ca3af',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
});

interface PDFReportProps {
  result: AnalysisResult;
  generatedDate: string;
}

export const PDFReport: React.FC<PDFReportProps> = ({ result, generatedDate }) => {
  const { evaluationSummary, pageContext, dimensionScores, findings, priorityActions, heroRewrite } = result;
  
  // Extraer dominio de la URL para el nombre del archivo
  const domain = pageContext.url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
  
  const getSeverityBadgeStyle = (severity: string) => {
    switch (severity) {
      case 'critical': return styles.badgeCritical;
      case 'high': return styles.badgeHigh;
      case 'medium': return styles.badgeMedium;
      case 'low': return styles.badgeLow;
      default: return styles.badgeOptional;
    }
  };

  return (
    <Document>
      {/* PORTADA */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          <Text style={styles.logo}>AI First Impression</Text>
          <Text style={styles.coverTitle}>Informe Profesional de Primera Impresión Web</Text>
          
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{evaluationSummary.totalScore}</Text>
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          
          <Text style={styles.gradeTier}>{evaluationSummary.gradeTier}</Text>
          
          <Text style={styles.coverUrl}>{pageContext.url}</Text>
          <Text style={styles.coverMeta}>Público objetivo: {pageContext.targetAudience}</Text>
          {pageContext.pageGoal && (
            <Text style={styles.coverMeta}>Objetivo: {pageContext.pageGoal}</Text>
          )}
          {evaluationSummary.visualAnalysisUsed && (
            <Text style={styles.coverMeta}>✓ Incluye análisis visual con screenshot</Text>
          )}
          
          <Text style={styles.coverDate}>Generado: {generatedDate}</Text>
        </View>
      </Page>

      {/* RESUMEN EJECUTIVO */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Resumen Ejecutivo</Text>
        <Text style={styles.text}>{evaluationSummary.executiveSummary}</Text>
        
        {evaluationSummary.calibrationNote && (
          <View style={styles.note}>
            <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>Nota de Calibración</Text>
            <Text style={{ fontSize: 9 }}>{evaluationSummary.calibrationNote}</Text>
          </View>
        )}

        <Text style={styles.subsectionTitle}>Contexto del Análisis</Text>
        <Text style={styles.text}>
          <Text style={styles.textBold}>Tipo de página detectado:</Text> {pageContext.detectedPageType}
        </Text>
        <Text style={styles.text}>
          <Text style={styles.textBold}>Tiempo de comprensión:</Text> {evaluationSummary.understandingTimeSeconds} segundos
        </Text>
      </Page>

      {/* PUNTAJES POR DIMENSIÓN */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Puntajes por Dimensión</Text>
        
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableColWide}>
              <Text style={styles.tableCellHeader}>Dimensión</Text>
            </View>
            <View style={styles.tableColNarrow}>
              <Text style={styles.tableCellHeader}>Puntaje</Text>
            </View>
          </View>
          
          {Object.entries(dimensionScores).map(([key, dim]) => (
            <View key={key} style={styles.tableRow}>
              <View style={styles.tableColWide}>
                <Text style={styles.tableCell}>
                  {key === 'clarity' ? 'Claridad del mensaje' :
                   key === 'trust' ? 'Confianza y credibilidad' :
                   key === 'conversion' ? 'Conversión y CTA' :
                   key === 'ux' ? 'UX, jerarquía y accesibilidad' :
                   key === 'nicheFit' ? 'Ajuste al público objetivo' :
                   'Copywriting y navegación'}
                </Text>
                <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 3 }}>{dim.comment}</Text>
              </View>
              <View style={styles.tableColNarrow}>
                <Text style={[styles.tableCell, styles.textBold]}>{dim.score}/{dim.maxScore}</Text>
              </View>
            </View>
          ))}
        </View>
      </Page>

      {/* HALLAZGOS */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Hallazgos Principales</Text>
        
        {findings.filter(f => f.severity === 'critical' || f.severity === 'high').slice(0, 6).map((finding, idx) => (
          <View key={idx} style={styles.finding}>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <View style={[styles.badge, getSeverityBadgeStyle(finding.severity)]}>
                <Text>{finding.severity.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.findingTitle}>{finding.criterionName}</Text>
            <Text style={styles.findingText}>
              <Text style={styles.textBold}>Evidencia:</Text> {finding.evidence}
            </Text>
            <Text style={styles.findingText}>
              <Text style={styles.textBold}>Recomendación:</Text> {finding.recommendation}
            </Text>
          </View>
        ))}
      </Page>

      {/* ACCIONES PRIORITARIAS */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Acciones Prioritarias</Text>
        
        {priorityActions.slice(0, 5).map((action, idx) => (
          <View key={idx} style={styles.finding}>
            <View style={{ flexDirection: 'row', marginBottom: 6 }}>
              <View style={[styles.badge, getSeverityBadgeStyle(action.severity)]}>
                <Text>{action.severity.toUpperCase()}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#dbeafe', color: '#1e40af' }]}>
                <Text>IMPACTO: {action.impact.toUpperCase()}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: '#dcfce7', color: '#166534' }]}>
                <Text>ESFUERZO: {action.difficulty.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.findingTitle}>{action.title}</Text>
            <Text style={styles.findingText}>{action.explanation}</Text>
            {action.exampleFix && (
              <Text style={[styles.findingText, { fontStyle: 'italic', marginTop: 4 }]}>
                Ejemplo: {action.exampleFix}
              </Text>
            )}
          </View>
        ))}
      </Page>

      {/* REESCRITURA DEL HERO */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Reescritura Recomendada del Hero</Text>
        
        <View style={styles.heroBox}>
          <Text style={styles.heroLabel}>Título Sugerido</Text>
          <Text style={styles.heroText}>{heroRewrite.headline}</Text>
        </View>
        
        <View style={styles.heroBox}>
          <Text style={styles.heroLabel}>Subtítulo Sugerido</Text>
          <Text style={styles.heroText}>{heroRewrite.subheadline}</Text>
        </View>
        
        <View style={styles.heroBox}>
          <Text style={styles.heroLabel}>CTA Sugerido</Text>
          <Text style={styles.heroText}>{heroRewrite.cta}</Text>
        </View>
        
        <View style={styles.footer}>
          <Text>AI First Impression | Informe Profesional</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} fixed />
        </View>
      </Page>
    </Document>
  );
};
