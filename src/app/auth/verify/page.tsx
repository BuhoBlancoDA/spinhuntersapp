export default function VerifyPage({ searchParams }: { searchParams: { name?: string } }) {
  const name = searchParams?.name?.trim()
  return (
    <main className="min-h-dvh grid place-items-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold">Bienvenido {name ? name : 'Cazador'}</h1>
        <p className="text-gray-600">
          Estás a punto de ingresar. <br/>
          Revisa tu correo electrónico y verifica tu cuenta para continuar.
        </p>
        <p className="text-xs text-gray-500">
          Si no lo ves en la bandeja de entrada, revisa Spam/Promociones.
        </p>
        <a href="/auth/sign-in" className="inline-block px-4 py-2 rounded border">
          Ya verifiqué mi correo
        </a>
      </div>
    </main>
  )
}