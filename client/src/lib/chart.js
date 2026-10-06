export const CHART = {
  pine: '#2F5D4B',
  pineMid: '#5E8F78',
  pineSoft: '#B9D1C4',
  kraft: '#C9A57E',
  ink: '#17201C',
  slate: '#3E5470',
  amber: '#C58A2C',
  rose: '#9B3A31',
  grid: '#E3E6E0',
  axis: '#8A948E',
};

export const STATUS_COLORS = {
  pending: CHART.amber,
  processing: CHART.slate,
  shipped: CHART.pineMid,
  delivered: CHART.pine,
  cancelled: CHART.rose,
};

export const SERIES = [CHART.pine, CHART.kraft, CHART.pineSoft, CHART.slate, CHART.pineMid, CHART.amber, CHART.ink];

export const tooltipStyle = {
  contentStyle: {
    background: '#FBFBF9',
    border: '1px solid #E3E6E0',
    borderRadius: 14,
    boxShadow: '0 18px 40px -12px rgba(23,32,28,0.18)',
    fontSize: 12,
    padding: '8px 12px',
  },
  labelStyle: { color: '#66716B', marginBottom: 4, fontWeight: 500 },
  itemStyle: { color: '#17201C', padding: 0 },
};

export const shortDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
