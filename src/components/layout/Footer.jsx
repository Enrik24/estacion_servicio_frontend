function Footer({ 
  variant = 'dark',
  expanded = false,
  companyName = 'SurtidorBolivia',
  companyDescription = 'Sistema especializado para la gestión eficiente de estaciones de servicio o surtidores, optimizando el control de combustibles y atención al cliente.'
}) {
  const bgStyles = variant === 'dark' 
    ? 'bg-slate-950 text-white' 
    : 'bg-white text-gray-600 border-t border-gray-200';
    
  const linkStyles = variant === 'dark'
    ? 'text-gray-400 hover:text-orange-500'
    : 'text-gray-600 hover:text-slate-900';

  if (expanded) {
    return (
      <footer id="soporte" className={`${bgStyles} py-16`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12 mb-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">{companyName}</h3>
              <p className="text-gray-400 leading-relaxed">
                {companyDescription}
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Compañía</h4>
              <ul className="space-y-2">
                <li><a href="#" className={`${linkStyles} transition`}>Acerca de</a></li>
                <li><a href="#" className={`${linkStyles} transition`}>Carreras</a></li>
                <li><a href="#" className={`${linkStyles} transition`}>Noticias</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2">
                <li><a href="#" className={`${linkStyles} transition`}>Centro de Ayuda</a></li>
                <li><a href="#" className={`${linkStyles} transition`}>Contacto</a></li>
                <li><a href="#" className={`${linkStyles} transition`}>FAQ</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2026 {companyName}. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6">
              <a href="#" className={`${linkStyles} transition text-sm`}>Privacidad</a>
              <a href="#" className={`${linkStyles} transition text-sm`}>Términos</a>
              <a href="#" className={`${linkStyles} transition text-sm`}>Legal</a>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`${bgStyles} py-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm mb-4 md:mb-0">
            © 2026 {companyName}. Todos los derechos reservados.
          </p>
          <div className="flex space-x-6">
            <a href="#" className={`${linkStyles} transition text-sm`}>Privacidad</a>
            <a href="#" className={`${linkStyles} transition text-sm`}>Términos</a>
            <a href="#" className={`${linkStyles} transition text-sm`}>Soporte</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
