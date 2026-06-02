import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import BitacoraTable from '../components/BitacoraTable';

function BitacoraPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header showNav={false} showUserMenu variant="light" fixed={false} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <BitacoraTable itemsPerPage={5} />
        </main>
      </div>
    </div>
  );
}

export default BitacoraPage;