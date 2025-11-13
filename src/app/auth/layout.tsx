export default function AuthLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Auth Hero Background */}
      <section className="from-primary/10 via-primary/5 to-background relative flex flex-1 items-center justify-center bg-linear-to-br px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">{children}</div>
      </section>
    </div>
  )
}
