export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200 pb-4">
          <p className="text-sm font-medium text-emerald-700">MaaSheba AI</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
            Admin Dashboard
          </h1>
        </header>
        {children}
      </div>
    </main>
  );
}
