import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { authGuardDecision, guestGuardDecision } from '../../app/route-guards.ts'
import { ApiError } from '../../shared/lib/api-error.ts'
import { parseContinuation } from './auth-contract.ts'
import {
  activationDescription,
  activationFailure,
  activationProfileBody,
  activationSchema,
  activationTitle,
  attributeLabel,
  finishActivation,
  newPasswordChallengeBody,
  passwordIndicators,
  retryOwnProfile,
} from './activation.ts'

const user = { id: 'actor-1', email: 'ana@enercol.example', roles: ['SPECIALIST'] }

describe('inicio de sesión', () => {
  it('continúa con la sesión cuando no hay desafío', async () => {
    const client = mockClient({
      authenticated: true,
      csrfToken: 'csrf-1',
      user,
    })
    const result = await client.post('/auth/login', { email: user.email, password: 'temporal' })
    const continuation = parseContinuation(result)
    assert.equal(continuation.authenticated, true)
    if (!continuation.authenticated) return
    assert.equal(continuation.user.id, 'actor-1')
    assert.equal(client.calls[0]?.url, '/auth/login')
    assert.equal('challenge' in continuation, false)
  })

  it('presenta la activación cuando Cognito pide una contraseña definitiva', async () => {
    const client = mockClient({
      authenticated: false,
      challenge: { id: 'opaque-1', name: 'NEW_PASSWORD_REQUIRED', requiredAttributes: [] },
    })
    const continuation = parseContinuation(await client.post('/auth/login', { email: user.email, password: 'temporal' }))
    assert.equal(continuation.authenticated, false)
    if (continuation.authenticated) return
    assert.equal(continuation.challenge.name, 'NEW_PASSWORD_REQUIRED')
    assert.equal(activationTitle, 'Activa tu cuenta')
    assert.match(activationDescription, /contraseña personal/)
    assert.equal(attributeLabel('phone_number'), 'Teléfono')
  })
})

describe('activación de la cuenta', () => {
  it('exige nombre, apellido y coincidencia, sin fijar una política de Cognito', () => {
    const schema = activationSchema([])
    const draft = {
      firstName: 'Ana',
      lastName: 'Mejía',
      phoneNumber: '',
      newPassword: 'una-clave',
      confirmPassword: 'otra',
      attributes: {},
    }
    assert.equal(schema.safeParse(draft).success, false)
    assert.equal(schema.safeParse({ ...draft, confirmPassword: 'una-clave' }).success, true)
    assert.equal(schema.safeParse({ ...draft, firstName: ' ', confirmPassword: 'una-clave' }).success, false)
    assert.equal(schema.safeParse({ ...draft, phoneNumber: '12', confirmPassword: 'una-clave' }).success, false)
    assert.equal(
      schema.safeParse({ ...draft, phoneNumber: '+57 300 111 2233', confirmPassword: 'una-clave' }).success,
      true,
    )
    assert.deepEqual(
      passwordIndicators('una-clave', 'una-clave').map((item) => item.met),
      [true, true],
    )
    assert.equal(JSON.stringify(passwordIndicators('', '')).includes('8 caracteres'), false)
  })

  it('envía el identificador opaco y la contraseña nueva, sin el nombre del desafío', async () => {
    const client = mockClient({ authenticated: true, csrfToken: 'csrf-2', user })
    const body = newPasswordChallengeBody('opaque-1', 'clave-definitiva', {}, [])
    const continuation = parseContinuation(await client.post('/auth/challenge', body))
    assert.deepEqual(client.calls[0]?.body, { challengeId: 'opaque-1', newPassword: 'clave-definitiva' })
    assert.equal(JSON.stringify(client.calls[0]?.body).includes('NEW_PASSWORD_REQUIRED'), false)
    assert.equal(continuation.authenticated, true)
  })

  it('permite corregir la contraseña cuando Cognito la rechaza', () => {
    const failure = activationFailure(new ApiError('La contraseña no cumple la política de seguridad', 400))
    assert.equal(failure.kind, 'retry')
    assert.equal(failure.returnToLogin, false)
    assert.equal(failure.message, 'La contraseña no cumple la política de seguridad')
  })

  it('explica un dato requerido inválido sin volver a pedir la contraseña temporal', () => {
    const failure = activationFailure(new ApiError('La solicitud de activación no es válida', 400))
    assert.equal(failure.kind, 'attributes')
    assert.equal(failure.returnToLogin, false)
    const body = newPasswordChallengeBody('opaque-1', 'clave', { phone_number: '123' }, ['phone_number'])
    assert.deepEqual(body.attributes, { phone_number: '123' })
    assert.equal('password' in body, false)
  })

  it('pide iniciar de nuevo con la contraseña temporal cuando el desafío expira', () => {
    const failure = activationFailure(new ApiError('El proceso de activación expiró. Inicie sesión de nuevo.', 401))
    assert.equal(failure.kind, 'expired')
    assert.equal(failure.returnToLogin, true)
    assert.match(failure.message, /contraseña temporal/)
  })

  it('informa cuando la autenticación no está disponible y oculta errores internos', () => {
    const unavailable = activationFailure(new ApiError('No fue posible completar la autenticación. Inténtelo más tarde.', 503))
    assert.equal(unavailable.kind, 'unavailable')
    const internal = activationFailure(new ApiError('NotAuthorizedException from Cognito', 500))
    assert.equal(internal.kind, 'generic')
    assert.equal(internal.message.includes('Cognito'), false)
  })

  it('establece la sesión solo después de completar el desafío', async () => {
    const client = mockClient({ authenticated: true, csrfToken: 'csrf-3', user })
    const pending = parseContinuation({
      authenticated: false,
      challenge: { id: 'opaque-1', name: 'NEW_PASSWORD_REQUIRED', requiredAttributes: [] },
    })
    assert.equal(pending.authenticated, false)
    const completed = parseContinuation(
      await client.post('/auth/challenge', newPasswordChallengeBody('opaque-1', 'clave-definitiva', {}, [])),
    )
    assert.equal(completed.authenticated, true)
    if (!completed.authenticated) return
    assert.equal(completed.csrfToken, 'csrf-3')
    assert.deepEqual(completed.user.roles, ['SPECIALIST'])
  })

  it('guarda el perfil después de la sesión y permite reintentarlo sin repetir el desafío', async () => {
    const calls: string[] = []
    const draft = {
      firstName: ' Ana ',
      lastName: 'Mejía',
      phoneNumber: '',
      newPassword: 'clave-definitiva',
      confirmPassword: 'clave-definitiva',
      attributes: {},
    }
    const saved = await finishActivation(draft, 'opaque-1', [], {
      answer: async (body) => {
        calls.push('challenge')
        assert.equal('firstName' in body, false)
        assert.equal(body.challengeId, 'opaque-1')
        return parseContinuation({ authenticated: true, csrfToken: 'csrf-4', user })
      },
      saveProfile: async (body) => {
        calls.push('profile')
        assert.deepEqual(body, activationProfileBody(draft))
        assert.equal('phoneNumber' in body, false)
      },
    })
    assert.deepEqual(saved, { kind: 'entered' })
    assert.deepEqual(calls, ['challenge', 'profile'])

    const failed = await finishActivation(draft, 'opaque-1', [], {
      answer: async () => parseContinuation({ authenticated: true, csrfToken: 'csrf-4', user }),
      saveProfile: async () => {
        throw new ApiError('Para crear el perfil se requieren nombre, apellido y teléfono', 400)
      },
    })
    assert.equal(failed.kind, 'profile-pending')
    if (failed.kind !== 'profile-pending') return
    assert.equal(failed.sessionActive, true)

    const retried = await retryOwnProfile(async () => {
      calls.push('retry')
    })
    assert.deepEqual(retried, { repeatedChallenge: false })
    assert.equal(calls.includes('retry'), true)
    assert.equal(calls.filter((call) => call === 'challenge').length, 1)
  })
})

describe('rutas durante la activación', () => {
  it('mantiene al usuario fuera del espacio de trabajo mientras el desafío está pendiente', () => {
    assert.deepEqual(authGuardDecision('challenge', '/app/profile'), {
      type: 'redirect',
      to: '/login?redirect=%2Fapp%2Fprofile',
    })
    assert.deepEqual(guestGuardDecision('challenge', '/app/profile'), { type: 'allow' })
  })

  it('regresa a la ruta original cuando la activación establece la sesión', () => {
    const towardLogin = authGuardDecision('unauthenticated', '/app/profile')
    assert.equal(towardLogin.type, 'redirect')
    if (towardLogin.type !== 'redirect') return
    const requested = new URLSearchParams(towardLogin.to.split('?')[1]).get('redirect')
    assert.deepEqual(guestGuardDecision('authenticated', requested), { type: 'redirect', to: '/app/profile' })
  })
})

function mockClient(response: unknown) {
  const calls: Array<{ url: string; body: unknown }> = []
  return {
    calls,
    post(url: string, body: unknown) {
      calls.push({ url, body })
      return Promise.resolve(response)
    },
  }
}
