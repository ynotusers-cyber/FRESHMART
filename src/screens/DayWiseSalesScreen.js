// src/screens/DayWiseSalesScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import { fetchDayWiseSales } from '../services/api';
import { Colors, Spacing, Radius, Shadow } from '../theme';

const { width } = Dimensions.get('window');
const CCODE = 1;

const DAY_COLORS = {
  Mon: '#FF6384', Tue: '#36A2EB', Wed: '#FFCE56',
  Thu: '#4BC0C0', Fri: '#9966FF', Sat: '#FF9F40', Sun: '#C9CBCF',
};

const fmt = (v) => {
  if (v >= 1_000_000) return `RM ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `RM ${(v / 1_000).toFixed(1)}K`;
  return `RM ${Number(v).toFixed(0)}`;
};

export default function DayWiseSalesScreen({ navigation }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Default: current month
  const now   = new Date();
  const from  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const to    = now.toISOString().split('T')[0];

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const rows = await fetchDayWiseSales(from, to, CCODE);
      // Sort by day order
      const order = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      const sorted = [...rows].sort((a, b) =>
        order.indexOf(a.theDay) - order.indexOf(b.theDay)
      );
      setData(sorted);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const total = data.reduce((s, r) => s + (parseFloat(r.amt) || 0), 0);

  // Simple Pie using segments
  const PieChart = () => {
    if (!data.length) return null;
    const size   = width * 0.55;
    const cx     = size / 2;
    const cy     = size / 2;
    const radius = size / 2 - 10;
    let startAngle = -Math.PI / 2;

    const slices = data.map((row) => {
      const val   = parseFloat(row.amt) || 0;
      const angle = (val / total) * 2 * Math.PI;
      const endAngle = startAngle + angle;
      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);
      const largeArc = angle > Math.PI ? 1 : 0;
      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      const midAngle = startAngle + angle / 2;
      const labelX = cx + (radius * 0.65) * Math.cos(midAngle);
      const labelY = cy + (radius * 0.65) * Math.sin(midAngle);
      const color  = DAY_COLORS[row.theDay] || '#999';
      startAngle   = endAngle;
      return { ...row, path, color, labelX, labelY, pct: ((val / total) * 100).toFixed(1) };
    });

    return (
      <View style={{ alignItems: 'center', marginVertical: 16 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((sl, i) => (
            <React.Fragment key={i}>
              <path d={sl.path} fill={sl.color} stroke="#fff" strokeWidth="2" />
              {parseFloat(sl.pct) > 5 && (
                <text x={sl.labelX} y={sl.labelY} textAnchor="middle"
                  fontSize="10" fill="#fff" fontWeight="bold">
                  {sl.pct}%
                </text>
              )}
            </React.Fragment>
          ))}
        </svg>
      </View>
    );
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      {/* Header */}
      <View style={[s.header, Shadow.header]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Day Wise Sales</Text>
          <Text style={s.subtitle}>This month breakdown by weekday</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {loading && (
          <View style={s.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={s.loadText}>Loading sales data…</Text>
          </View>
        )}

        {!loading && error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>⚠️ {error}</Text>
            <TouchableOpacity onPress={load} style={s.retryBtn}>
              <Text style={s.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && !error && data.length > 0 && (
          <>
            {/* Total Card */}
            <View style={s.totalCard}>
              <Text style={s.totalLabel}>Total Sales This Month</Text>
              <Text style={s.totalValue}>{fmt(total)}</Text>
            </View>

            {/* Pie Chart */}
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Sales Distribution by Day</Text>
              <PieChart />
            </View>

            {/* Legend + Details */}
            <View style={s.legendCard}>
              <Text style={s.chartTitle}>Breakdown</Text>
              {data.map((row, i) => {
                const amt = parseFloat(row.amt) || 0;
                const pct = total > 0 ? ((amt / total) * 100).toFixed(1) : '0';
                const barW = total > 0 ? (amt / total) * (width - 80) : 0;
                return (
                  <View key={i} style={s.legendRow}>
                    <View style={[s.dot, { backgroundColor: DAY_COLORS[row.theDay] || '#999' }]} />
                    <Text style={s.dayLabel}>{row.theDay}</Text>
                    <View style={s.barBg}>
                      <View style={[s.barFill, {
                        width: barW,
                        backgroundColor: DAY_COLORS[row.theDay] || '#999'
                      }]} />
                    </View>
                    <View style={s.amtWrap}>
                      <Text style={s.amtText}>{fmt(amt)}</Text>
                      <Text style={s.pctText}>{pct}%</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {!loading && !error && data.length === 0 && (
          <View style={s.center}>
            <Text style={{ fontSize: 40 }}>📭</Text>
            <Text style={s.emptyText}>No sales data found</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bg },
  header:  {
    backgroundColor: Colors.primary,
    paddingTop: 52, paddingBottom: 16,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row', alignItems: 'flex-end', gap: 12,
  },
  backBtn:   { paddingRight: 8, paddingBottom: 2 },
  backText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  title:     { color: '#fff', fontSize: 18, fontWeight: '800' },
  subtitle:  { color: 'rgba(255,255,255,0.75)', fontSize: 11, marginTop: 2 },
  scroll:    { padding: Spacing.md },
  center:    { alignItems: 'center', paddingVertical: 60, gap: 12 },
  loadText:  { color: Colors.textMuted, fontSize: 14 },
  emptyText: { color: Colors.textMuted, fontSize: 15, marginTop: 8 },

  errorBox: {
    backgroundColor: '#FFF0EE', borderRadius: Radius.md,
    padding: Spacing.md, borderLeftWidth: 4,
    borderLeftColor: Colors.danger, gap: 10,
  },
  errorText: { color: Colors.danger, fontSize: 13, fontWeight: '600' },
  retryBtn:  { backgroundColor: Colors.danger, borderRadius: Radius.sm, paddingVertical: 8, paddingHorizontal: 16, alignSelf: 'flex-start' },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  totalCard: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    padding: Spacing.lg, alignItems: 'center', marginBottom: 12,
    ...Shadow.card,
  },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  totalValue: { color: '#fff', fontSize: 28, fontWeight: '900', marginTop: 4 },

  chartCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
    ...Shadow.card,
  },
  chartTitle: { fontSize: 13, fontWeight: '800', color: Colors.textPrimary, marginBottom: 8 },

  legendCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow.card,
  },
  legendRow:  { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 8 },
  dot:        { width: 12, height: 12, borderRadius: 6 },
  dayLabel:   { width: 32, fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  barBg:      { flex: 1, height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden' },
  barFill:    { height: 10, borderRadius: 5 },
  amtWrap:    { alignItems: 'flex-end', minWidth: 80 },
  amtText:    { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  pctText:    { fontSize: 10, color: Colors.textMuted },
});