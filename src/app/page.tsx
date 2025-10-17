export default function Home() {
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="max-w-md w-full space-y-4 text-center">
        <h1 className="text-3xl font-bold">SpinHunters – App</h1>
        <p className="text-sm text-gray-500">
          Inicia sesión o crea tu cuenta para acceder a tus recursos.
        </p>
        <div className="flex gap-3 justify-center">
          <a className="px-4 py-2 rounded bg-black text-white" href="/auth/sign-in">Iniciar sesión</a>
          <a className="px-4 py-2 rounded border" href="/auth/sign-up">Crear cuenta</a>
        </div>
      </div>
    </main>
  )
}