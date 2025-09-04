import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🚀</span>
              <span className="text-xl font-bold">COICIT 2025</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-4">
              <Link 
                href="/" 
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Actividades
              </Link>
              <Link 
                href="/login" 
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Inscripciones
              </Link>
              <Link 
                href="/admin" 
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Administración
              </Link>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm">Universidad Tecnológica de Panamá</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
