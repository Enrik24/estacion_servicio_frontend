import { createContext, useContext, useState } from 'react';

const ErrorContext = createContext(null);

export function ErrorProvider({ children }) {
  const [error403, setError403] = useState(false);
  const [errorMessage, setErrorMessage] = useState('No tienes permiso para acceder a este recurso');

  const showAccessDenied = (message = 'No tienes permiso para acceder a este recurso') => {
    setErrorMessage(message);
    setError403(true);
  };

  const closeAccessDenied = () => {
    setError403(false);
  };

  const value = {
    error403,
    errorMessage,
    showAccessDenied,
    closeAccessDenied,
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useErrorContext() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
}

export default ErrorContext;
