import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [version, setVersion] = useState(0);
  const [productModal, setProductModal] = useState({ open: false, product: null });
  const [orderModal, setOrderModal] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const bump = useCallback(() => setVersion((v) => v + 1), []);
  const openProduct = useCallback((product = null) => setProductModal({ open: true, product }), []);
  const closeProduct = useCallback(() => setProductModal((m) => ({ ...m, open: false })), []);
  const openOrder = useCallback(() => setOrderModal(true), []);
  const closeOrder = useCallback(() => setOrderModal(false), []);

  const value = useMemo(
    () => ({ version, bump, productModal, openProduct, closeProduct, orderModal, openOrder, closeOrder, paletteOpen, setPaletteOpen }),
    [version, bump, productModal, openProduct, closeProduct, orderModal, openOrder, closeOrder, paletteOpen]
  );
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export const useDashboard = () => useContext(DashboardContext);
