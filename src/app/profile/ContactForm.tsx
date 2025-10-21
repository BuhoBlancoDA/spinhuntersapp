// src/app/profile/ContactForm.tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { updateProfile } from './actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      disabled={pending}
      className="px-4 py-2 rounded bg-brand text-white hover:bg-brand/90 disabled:opacity-60"
    >
      {pending ? 'Guardando…' : 'Guardar cambios'}
    </button>
  )
}

type Props = {
  defaultDiscord?: string
  defaultWhatsapp?: string
}

export default function ContactForm({ defaultDiscord = '', defaultWhatsapp = '' }: Props) {
  // Adaptamos updateProfile (que recibe solo formData) a la firma de useFormState
  const [state, formAction] = useFormState(
    async (_prevState: any, formData: FormData) => {
      const res = await updateProfile(formData)
      // Garantizamos un shape estable
      return { ok: !!res?.ok, error: res?.error ?? null }
    },
    { ok: false, error: null as string | null }
  )

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-white/70 mb-1">Usuario de Discord</label>
          <input
            name="discord_user"
            defaultValue={defaultDiscord}
            className="w-full border border-white/10 p-3 rounded bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>
        <div>
          <label className="block text-sm text-white/70 mb-1">WhatsApp</label>
          <input
            name="whatsapp"
            defaultValue={defaultWhatsapp}
            className="w-full border border-white/10 p-3 rounded bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <SubmitButton />
      </div>

      {/* Mensajes */}
      <div aria-live="polite">
        {state.ok && !state.error && (
          <p className="text-green-500 text-sm mt-2">Cambios guardados correctamente.</p>
        )}
        {state.error && (
          <p className="text-red-500 text-sm mt-2">{state.error}</p>
        )}
      </div>
    </form>
  )
}
