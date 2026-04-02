// src/screens/DeptWiseSalesScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, StatusBar, Dimensions,
} from 'react-native';
import { fetchDeptWiseSales } from '../services/api';
import { Colors, Spacing, Radius, Shadow } from '../theme';

const { width } = Dimensions.get('window');
const CCODE = 1;

const DEPT_COLORS = [
  '#FF6384','#36A2EB','#FFCE56','#4BC0C0',
  '#9966FF','#FF9F40','#C9CBCF','#E7E9ED',
  '#71B37C','#F7464A',
];

const fmt = (v) => {
  if (v >= 1_000_000) return `RM ${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `RM ${(v / 1_000).toFixed(1)}K`;
  return `RM ${Number(v).toFixed(0)}`;
};

export default function DeptWiseSalesScreen({ navigation }) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [sortBy, setSortBy]   = useState('amt'); // amt | qty | profit

  const now  = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const to   = now.toISOString().split('T')[0];

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const rows = await fetchDeptWiseSales(from, to, CCODE);
      setData(rows);
    } catch (e) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sorted = [...data].sort((a, b) =>
    (parseFloat(b[sortBy]) || 0) - (parseFloat(a[sortBy]) || 0)
  );

  const totalAmt  = data.reduce((s, r) => s + (parseFloat(r.amt)  || 0), 0);
  const totalCost = data.reduce((s, r) => s + (parseFloat(r.cost) || 0), 0);
  const totalQty  = data.reduce((s, r) => s + (parseFloat(r.Qty)  || 0), 0);
  const totalProfit = totalAmt - totalCost;

  const maxAmt = sorted.length ? (parseFloat(sorted[0].amt) || 1) : 1;

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      {/* Header */}
      <View style={[s.header, Shadow.header]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Department Wise Sales</Text>
          <Text style={s.subtitle}>This month by department</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {loading && (
          <View style={s.center}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={s.loadText}>Loading department data…</Text>
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
            {/* Summary Cards */}
            <View style={s.summaryRow}>
              <View style={[s.summaryCard, { borderTopColor: Colors.chartAmt }]}>
                <Text style={s.summaryLabel}>Total Sales</Text>
                <Text style={s.summaryValue}>{fmt(totalAmt)}</Text>
              </View>
              <View style={[s.summaryCard, { borderTopColor: Colors.chartProfit }]}>
                <Text style={s.summaryLabel}>Total Profit</Text>
                <Text style={s.summaryValue}>{fmt(totalProfit)}</Text>
              </View>
              <View style={[s.summaryCard, { borderTopColor: Colors.chartCost }]}>
                <Text style={s.summaryLabel}>Total Qty</Text>
                <Text style={s.summaryValue}>{totalQty.toFixed(0)}</Text>
              </View>
            </View>

            {/* Sort Tabs */}
            <View style={s.tabs}>
              {['amt','qty','cost'].map(k => (
                <TouchableOpacity
                  key={k}
                  style={[s.tab, sortBy === k && s.tabActive]}
                  onPress={() => setSortBy(k)}
                >
                  <Text style={[s.tabText, sortBy === k && s.tabTextActive]}>
                    {k === 'amt' ? 'By Sales' : k === 'qty' ? 'By Qty' : 'By Cost'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Department Bars */}
            <View style={s.deptCard}>
              {sorted.map((row, i) => {
                const amt    = parseFloat(row.amt)  || 0;
                const cost   = parseFloat(row.cost) || 0;
                const qty    = parseFloat(row.Qty)  || 0;
                const profit = amt - cost;
                const barW   = (amt / maxAmt) * (width - 100);
                const color  = DEPT_COLORS[i % DEPT_COLORS.length];
                const pct    = totalAmt > 0 ? ((amt / totalAmt) * 100).toFixed(1) : '0';

                return (
                  <View key={i} style={s.deptRow}>
                    <View style={s.deptHeader}>
                      <View style={[s.deptDot, { backgroundColor: color }]} />
                      <Text style={s.deptName} numberOfLines={1}>
                        {row.name || `Dept ${row.DepartmentId}`}
                      </Text>
                      <Text style={s.deptPct}>{pct}%</Text>
                    </View>

                    {/* Bar */}
                    <View style={s.barBg}>
                      <View style={[s.barFill, { width: barW, backgroundColor: color }]} />
                    </View>

                    {/* Stats */}
                    <View style={s.deptStats}>
                      <Text style={s.statItem}>💰 {fmt(amt)}</Text>
                      <Text style={s.statItem}>📦 {qty.toFixed(0)} qty</Text>
                      <Text style={[s.statItem, { color: profit >= 0 ? Colors.success : Colors.danger }]}>
                        📈 {fmt(profit)}
                      </Text>
                    </View>
                    <View style={s.divider} />
                  </View>
                );
              })}
            </View>
          </>
        )}

        {!loading && !error && data.length === 0 && (
          <View style={s.center}>
            <Text style={{ fontSize: 40 }}>📭</Text>
            <Text style={s.emptyText}>No department data found</Text>
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

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  summaryCard: {
    flex: 1, backgroundColor: Colors.bgCard,
    borderRadius: Radius.md, padding: Spacing.sm,
    borderTopWidth: 3, borderWidth: 1,
    borderColor: Colors.border, alignItems: 'center',
    ...Shadow.card,
  },
  summaryLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '600' },
  summaryValue: { fontSize: 14, fontWeight: '900', color: Colors.textPrimary, marginTop: 2 },

  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: Radius.sm,
    backgroundColor: Colors.bgCard, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  tabActive:     { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText:       { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  tabTextActive: { color: '#fff' },

  deptCard: {
    backgroundColor: Colors.bgCard, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    ...Shadow.card,
  },
  deptRow:    { marginBottom: 12 },
  deptHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  deptDot:    { width: 12, height: 12, borderRadius: 6 },
  deptName:   { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
  deptPct:    { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  barBg:      { height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden', marginBottom: 6 },
  barFill:    { height: 10, borderRadius: 5 },
  deptStats:  { flexDirection: 'row', justifyContent: 'space-between' },
  statItem:   { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },
  divider:    { height: 1, backgroundColor: Colors.border, marginTop: 10 },
});