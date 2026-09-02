import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { createRemoteJWKSet, errors, jwtVerify } from 'jose';

declare module 'fastify' {
  interface FastifyRequest {
    authUserId: string;
  }
  interface FastifyInstance {
    authenticate: (solicitud: FastifyRequest, respuesta: FastifyReply) => Promise<void>;
  }
}

/**
 * Cache de JWKS remoto para evitar descargas repetidas de claves públicas
 */
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function obtenerJwks(uri: string) {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(new URL(uri), {
      cacheMaxAge: 10 * 60 * 1000, // 10 minutos de caché en memoria
      cooldownDuration: 30 * 1000, // 30 segundos entre reintentos ante error
    });
  }
  return jwksCache;
}

/**
 * Plugin de Autenticación de Chapter One (Fase 5)
 * Valida tokens JWT asimétricos emitidos por Clerk/OIDC mediante JWKS
 */
const pluginAutenticacionAsync: FastifyPluginAsync = async (servidor) => {
  const uriJwks = process.env.AUTH_JWKS_URI;
  const emisorEsperado = process.env.AUTH_ISSUER;
  const audienciaEsperada = process.env.AUTH_AUDIENCE;
  const esModoMock = process.env.AUTH_MOCK === 'true' && process.env.NODE_ENV !== 'production';

  const autenticar = async (solicitud: FastifyRequest, respuesta: FastifyReply): Promise<void> => {
    const cabeceraAutorizacion = solicitud.headers.authorization;

    if (!cabeceraAutorizacion || !cabeceraAutorizacion.startsWith('Bearer ')) {
      return respuesta.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Se requiere una cabecera Authorization con formato Bearer <token>',
        },
      });
    }

    const token = cabeceraAutorizacion.slice(7).trim();
    if (!token) {
      return respuesta.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'El token de autenticación no puede estar vacío',
        },
      });
    }

    // Soporte para pruebas y desarrollo local controlado (nunca activo en producción)
    if (esModoMock) {
      if (token.startsWith('mock_') || token.startsWith('mock-') || token.startsWith('test_')) {
        solicitud.authUserId = token;
        return;
      }

      // En modo mock, si el token no tiene el prefijo de prueba y no hay JWKS configurado, es inválido
      if (!uriJwks) {
        return respuesta.status(401).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'El token de autenticación es inválido',
          },
        });
      }
    }

    if (!uriJwks) {
      servidor.log.error('AUTH_JWKS_URI no está configurado en las variables de entorno');
      return respuesta.status(500).send({
        success: false,
        error: {
          code: 'AUTH_CONFIGURATION_ERROR',
          message: 'El servicio de autenticación no está configurado adecuadamente',
        },
      });
    }

    try {
      const jwks = obtenerJwks(uriJwks);
      const opcionesVerificacion: { issuer?: string; audience?: string } = {};

      if (emisorEsperado) {
        opcionesVerificacion.issuer = emisorEsperado;
      }
      if (audienciaEsperada) {
        opcionesVerificacion.audience = audienciaEsperada;
      }

      const { payload } = await jwtVerify(token, jwks, opcionesVerificacion);

      if (!payload.sub) {
        return respuesta.status(401).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'El token no contiene el identificador de usuario obligatorio (sub)',
          },
        });
      }

      // Inyectar el ID de usuario autenticado en la solicitud
      solicitud.authUserId = payload.sub;
    } catch (error: unknown) {
      if (error instanceof errors.JWTExpired) {
        return respuesta.status(401).send({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'El token de autenticación ha expirado',
          },
        });
      }

      if (
        error instanceof errors.JWSSignatureVerificationFailed ||
        error instanceof errors.JWTClaimValidationFailed ||
        error instanceof errors.JWTInvalid
      ) {
        return respuesta.status(401).send({
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'El token de autenticación es inválido o no superó la verificación de firma',
          },
        });
      }

      const errObj = error instanceof Error ? error : new Error(String(error));
      const errorDetallado = {
        name: errObj.name,
        message: errObj.message,
        code: 'code' in errObj ? (errObj as { code: unknown }).code : undefined,
        cause: errObj.cause instanceof Error ? { name: errObj.cause.name, message: errObj.cause.message } : errObj.cause,
        claim: 'claim' in errObj ? (errObj as { claim: unknown }).claim : undefined,
        reason: 'reason' in errObj ? (errObj as { reason: unknown }).reason : undefined,
        stack: errObj.stack,
      };

      servidor.log.warn(errorDetallado, 'Fallo inesperado durante la verificación del token');
      return respuesta.status(401).send({
        success: false,
        error: {
          code: 'AUTHENTICATION_FAILED',
          message: 'No fue posible validar la autenticidad del token',
        },
      });
    }
  };

  servidor.decorate('authenticate', autenticar);
};

export const pluginAutenticacion = fp(pluginAutenticacionAsync, {
  name: 'plugin-autenticacion',
});

export const authPlugin = pluginAutenticacion;
