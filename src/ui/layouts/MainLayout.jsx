export const MainLayout = ({children, sidebar, navbar}) => {
    return (
    <div className="h-screen flex bg-[var(--color-bg)]">

      {/* Sidebar */}
      <aside className="w-64 hidden md:block">
        {sidebar}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">

        {/* Navbar */}
        <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center px-4">
          {navbar}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>

      </div>
    </div>
  )
}