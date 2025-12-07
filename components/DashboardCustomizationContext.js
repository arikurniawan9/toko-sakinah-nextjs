// components/DashboardCustomizationContext.js
import { createContext, useContext, useReducer, useEffect } from 'react';

const DashboardCustomizationContext = createContext();

// Initial state untuk layout dashboard
const initialState = {
  layouts: {
    executive: [
      { id: 'revenue-chart', x: 0, y: 0, w: 6, h: 4, static: false },
      { id: 'performance-kpi', x: 6, y: 0, w: 6, h: 4, static: false },
      { id: 'top-products', x: 0, y: 4, w: 6, h: 4, static: false },
      { id: 'low-stock-alert', x: 6, y: 4, w: 6, h: 4, static: false }
    ],
    operational: [
      { id: 'daily-sales', x: 0, y: 0, w: 6, h: 4, static: false },
      { id: 'staff-performance', x: 6, y: 0, w: 6, h: 4, static: false },
      { id: 'inventory-movement', x: 0, y: 4, w: 12, h: 6, static: false }
    ],
    tactical: [
      { id: 'category-performance', x: 0, y: 0, w: 8, h: 5, static: false },
      { id: 'product-analysis', x: 8, y: 0, w: 4, h: 5, static: false },
      { id: 'customer-insights', x: 0, y: 5, w: 12, h: 6, static: false }
    ]
  },
  visibleWidgets: {
    executive: ['revenue-chart', 'performance-kpi', 'top-products', 'low-stock-alert'],
    operational: ['daily-sales', 'staff-performance', 'inventory-movement'],
    tactical: ['category-performance', 'product-analysis', 'customer-insights']
  },
  currentLevel: 'executive',
  isEditing: false
};

// Reducer untuk mengelola state dashboard
function dashboardReducer(state, action) {
  switch (action.type) {
    case 'SET_LEVEL':
      return {
        ...state,
        currentLevel: action.payload
      };
    
    case 'TOGGLE_EDITING':
      return {
        ...state,
        isEditing: !state.isEditing
      };
    
    case 'UPDATE_LAYOUT':
      return {
        ...state,
        layouts: {
          ...state.layouts,
          [state.currentLevel]: action.payload
        }
      };
    
    case 'TOGGLE_WIDGET':
      const level = state.currentLevel;
      const widgetId = action.payload;
      const currentVisible = state.visibleWidgets[level] || [];
      
      const newVisible = currentVisible.includes(widgetId)
        ? currentVisible.filter(id => id !== widgetId)
        : [...currentVisible, widgetId];
      
      return {
        ...state,
        visibleWidgets: {
          ...state.visibleWidgets,
          [level]: newVisible
        }
      };
    
    case 'SET_LAYOUTS':
      return {
        ...state,
        layouts: action.payload
      };
    
    case 'SET_VISIBLE_WIDGETS':
      return {
        ...state,
        visibleWidgets: action.payload
      };
    
    case 'RESET_LAYOUT':
      return {
        ...state,
        layouts: {
          ...initialState.layouts,
          [state.currentLevel]: initialState.layouts[state.currentLevel]
        },
        visibleWidgets: {
          ...initialState.visibleWidgets,
          [state.currentLevel]: initialState.visibleWidgets[state.currentLevel]
        }
      };
    
    default:
      return state;
  }
}

export function DashboardCustomizationProvider({ children }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  // Load layout dari localStorage saat komponen mount
  useEffect(() => {
    const savedLayouts = localStorage.getItem('dashboardLayouts');
    const savedWidgets = localStorage.getItem('dashboardVisibleWidgets');
    
    if (savedLayouts) {
      try {
        const parsedLayouts = JSON.parse(savedLayouts);
        dispatch({ type: 'SET_LAYOUTS', payload: parsedLayouts });
      } catch (e) {
        console.error('Error parsing saved layouts:', e);
      }
    }
    
    if (savedWidgets) {
      try {
        const parsedWidgets = JSON.parse(savedWidgets);
        dispatch({ type: 'SET_VISIBLE_WIDGETS', payload: parsedWidgets });
      } catch (e) {
        console.error('Error parsing saved widgets:', e);
      }
    }
  }, []);

  // Simpan layout ke localStorage saat terjadi perubahan
  useEffect(() => {
    localStorage.setItem('dashboardLayouts', JSON.stringify(state.layouts));
  }, [state.layouts]);

  useEffect(() => {
    localStorage.setItem('dashboardVisibleWidgets', JSON.stringify(state.visibleWidgets));
  }, [state.visibleWidgets]);

  const value = {
    ...state,
    setLevel: (level) => dispatch({ type: 'SET_LEVEL', payload: level }),
    toggleEditing: () => dispatch({ type: 'TOGGLE_EDITING' }),
    updateLayout: (layout) => dispatch({ type: 'UPDATE_LAYOUT', payload: layout }),
    toggleWidget: (widgetId) => dispatch({ type: 'TOGGLE_WIDGET', payload: widgetId }),
    resetLayout: () => dispatch({ type: 'RESET_LAYOUT' })
  };

  return (
    <DashboardCustomizationContext.Provider value={value}>
      {children}
    </DashboardCustomizationContext.Provider>
  );
}

// Widget definitions
const WIDGET_DEFINITIONS = {
  'stats': { id: 'stats', title: 'Statistik Toko', type: 'Statistik' },
  'recent-activity': { id: 'recent-activity', title: 'Aktivitas Terbaru', type: 'Statistik' },
  'low-stock': { id: 'low-stock', title: 'Produk Stok Rendah', type: 'Statistik' },
  'recent-stores': { id: 'recent-stores', title: 'Toko Terbaru', type: 'Statistik' },
  'revenue-chart': { id: 'revenue-chart', title: 'Grafik Pendapatan', type: 'Grafik' },
  'performance-kpi': { id: 'performance-kpi', title: 'KPI Kinerja', type: 'Statistik' },
  'top-products': { id: 'top-products', title: 'Produk Terlaris', type: 'Statistik' },
  'low-stock-alert': { id: 'low-stock-alert', title: 'Peringatan Stok Rendah', type: 'Peringatan' },
  'daily-sales': { id: 'daily-sales', title: 'Penjualan Harian', type: 'Statistik' },
  'staff-performance': { id: 'staff-performance', title: 'Kinerja Staff', type: 'Statistik' },
  'inventory-movement': { id: 'inventory-movement', title: 'Pergerakan Stok', type: 'Statistik' },
  'category-performance': { id: 'category-performance', title: 'Kinerja Kategori', type: 'Statistik' },
  'product-analysis': { id: 'product-analysis', title: 'Analisis Produk', type: 'Statistik' },
  'customer-insights': { id: 'customer-insights', title: 'Wawasan Pelanggan', type: 'Statistik' }
};

export function useDashboardCustomization() {
  const context = useContext(DashboardCustomizationContext);
  if (!context) {
    throw new Error('useDashboardCustomization must be used within a DashboardCustomizationProvider');
  }

  // Generate dashboardLayout array based on current state
  const dashboardLayout = Object.keys(WIDGET_DEFINITIONS).map(widgetId => {
    const widgetDef = WIDGET_DEFINITIONS[widgetId];
    const currentVisible = context.visibleWidgets[context.currentLevel] || [];
    const visible = currentVisible.includes(widgetId);

    return {
      ...widgetDef,
      visible: visible
    };
  });

  // Add function to update widget visibility
  const updateWidgetVisibility = (widgetId, visible) => {
    // The toggleWidget function in the original context handles both adding and removing
    // based on whether the widget is currently visible or not
    if (visible !== context.visibleWidgets[context.currentLevel]?.includes(widgetId)) {
      context.toggleWidget(widgetId);
    }
  };

  return {
    ...context,
    dashboardLayout,
    updateWidgetVisibility
  };
}