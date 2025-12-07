// components/DashboardCustomizationModal.js
import { useState } from 'react';
import { X } from 'lucide-react';
import { useDashboardCustomization } from './DashboardCustomizationContext';

const DashboardCustomizationModal = ({ isOpen, onClose }) => {
  const { dashboardLayout, updateWidgetVisibility, reorderWidgets, resetLayout } = useDashboardCustomization();
  const [tempLayout, setTempLayout] = useState([...(dashboardLayout || [])]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Update the actual layout
    tempLayout.forEach((widget, index) => {
      if (widget.visible !== (dashboardLayout || []).find(w => w.id === widget.id)?.visible) {
        updateWidgetVisibility(widget.id, widget.visible);
      }
    });
    onClose();
  };

  const toggleWidget = (id) => {
    setTempLayout(prev => 
      prev.map(widget => 
        widget.id === id ? { ...widget, visible: !widget.visible } : widget
      )
    );
  };

  const moveWidget = (id, direction) => {
    setTempLayout(prev => {
      const newLayout = [...prev];
      const index = newLayout.findIndex(w => w.id === id);
      
      if (direction === 'up' && index > 0) {
        [newLayout[index - 1], newLayout[index]] = [newLayout[index], newLayout[index - 1]];
      } else if (direction === 'down' && index < newLayout.length - 1) {
        [newLayout[index + 1], newLayout[index]] = [newLayout[index], newLayout[index + 1]];
      }
      
      return newLayout;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden`}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customisasi Dashboard</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Geser dan atur urutan widget, serta pilih widget yang ingin ditampilkan di dashboard Anda.
            </p>
          </div>
          
          <div className="space-y-3">
            {tempLayout.map((widget, index) => (
              <div 
                key={widget.id} 
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  widget.visible 
                    ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700' 
                    : 'border-gray-200/50 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 opacity-70'
                }`}
              >
                <div className="flex items-center">
                  <div className="mr-3 text-gray-500 dark:text-gray-400 cursor-move">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{widget.title}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{widget.type}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => moveWidget(widget.id, 'up')}
                    disabled={index === 0}
                    className={`p-1 rounded ${
                      index === 0 
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <button 
                    onClick={() => moveWidget(widget.id, 'down')}
                    disabled={index === tempLayout.length - 1}
                    className={`p-1 rounded ${
                      index === tempLayout.length - 1 
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={widget.visible}
                      onChange={() => toggleWidget(widget.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={resetLayout}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-md"
          >
            Atur Ulang
          </button>
          
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCustomizationModal;