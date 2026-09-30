# 1.1.0

Umbral entero de 0 a 100, selección humedad/batería y alerta opcional persistente por ciclo, con rearme automático por recarga estimada.

# Changelog

## 1.0.1 - Verification fixes

- Added `repository`, `homepage`, and `bugs.url` metadata to `package.json`.
- Corrected `config.schema.json` to use object-level JSON Schema `required` array.

## 1.0.0 - 2026-09-07

- Primera versión pública de `homebridge-cuby-helios`.
- Autenticación automática contra Cuby Cloud con correo y contraseña.
- Generación y renovación automática de JWT.
- Reintento automático tras una respuesta `401 Unauthorized`.
- Lectura periódica del nivel de gas desde `/api/v2/history/gas/level/{deviceID}`.
- Representación del nivel de gas como porcentaje en HomeKit.
- Configuración mediante Homebridge UI con `config.schema.json`.
- Manejo de errores de API y timeouts sin detener Homebridge.
- Protección para evitar registrar contraseña o JWT en los logs.
