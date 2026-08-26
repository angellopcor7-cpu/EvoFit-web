// Bloqueo local de dispositivo (huella, rostro o contraseña/PIN del
// dispositivo) para proteger la vista de fotos de evolución física.
//
// Usa la Web Authentication API (WebAuthn) con un autenticador de
// plataforma. No hay verificación en servidor: esto es una capa de
// privacidad local (evitar que alguien que toma el celular desbloqueado
// vea las fotos), no un mecanismo de autenticación de cuenta. El
// navegador/sistema operativo es quien pide huella/rostro/PIN y decide
// si el usuario quedó verificado.

function base64UrlToBuffer(base64Url: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buffer[i] = raw.charCodeAt(i);
  return buffer.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomChallenge(): BufferSource {
  return crypto.getRandomValues(new Uint8Array(32)) as BufferSource;
}

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.PublicKeyCredential &&
    !!navigator.credentials
  );
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

// Registra un autenticador de plataforma (huella/rostro/PIN del
// dispositivo) y devuelve el credential id para guardarlo en el perfil.
export async function registerDeviceLock(
  userId: string,
  displayName: string,
): Promise<string> {
  const credential = (await navigator.credentials.create({
    publicKey: {
      challenge: randomChallenge(),
      rp: { name: "EvoFit", id: window.location.hostname },
      user: {
        id: new TextEncoder().encode(userId),
        name: displayName || "usuario",
        displayName: displayName || "Usuario EvoFit",
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: 60_000,
      attestation: "none",
    },
  })) as PublicKeyCredential | null;

  if (!credential) throw new Error("No se pudo registrar el bloqueo");
  return bufferToBase64Url(credential.rawId);
}

// Pide verificación (huella/rostro/PIN) contra el credential ya
// registrado. Devuelve true si el usuario quedó verificado.
export async function verifyDeviceLock(credentialId: string): Promise<boolean> {
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomChallenge(),
        allowCredentials: [
          { id: base64UrlToBuffer(credentialId), type: "public-key" },
        ],
        userVerification: "required",
        timeout: 60_000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}
