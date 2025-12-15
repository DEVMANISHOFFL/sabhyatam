export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-black text-white px-6 py-4 font-bold">
        Sabhyatam Admin
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
