import { MainLayout } from '@/ui/layouts/MainLayout.jsx';

function App() {
  
  return (
    <>
      <MainLayout
        sidebar={<div className="h-full bg-[var(--color-primary)] text-white p-4">Sidebar</div>}
        navbar={<div>Navbar</div>}
      >
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </MainLayout>
    </>
  );
}

export default App
