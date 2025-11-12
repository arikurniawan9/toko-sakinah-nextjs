// components/Toast.js
import { useEffect, useState } from 'react';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onClose) onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!show) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg ${getTypeStyles()} transition-opacity duration-300`}>
      <div className="flex items-center">
        <span>{message}</span>
      </div>
    </div>
  );
};

export default Toast;