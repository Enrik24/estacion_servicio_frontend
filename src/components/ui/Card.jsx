function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl shadow-2xl p-8 sm:p-10 ${className}`}>
      {children}
    </div>
  );
}

export default Card;
