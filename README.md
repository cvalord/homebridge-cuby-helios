# homebridge-cuby-helios

**Versión 1.0.0**

Plugin de Homebridge para consultar el nivel de gas de **Cuby Helios** mediante la API de Cuby.

## Funciones

- Autenticación automática con correo y contraseña.
- Generación y renovación automática del JWT.
- Reintento automático una vez si Cuby responde `401 Unauthorized`.
- Consulta periódica de `GET /api/v2/history/gas/level/{deviceID}`.
- Manejo de errores HTTP y timeouts sin provocar un crash de Homebridge.
- Configuración desde Homebridge UI mediante `config.schema.json`.
- El JWT y la contraseña nunca se imprimen en logs.

## Requisitos

- Homebridge 1.11.4+ o 2.x.
- Node.js 22.12+, 24.x o 26.x.
- Una cuenta Cuby válida.
- El `deviceID` de 12 caracteres de tu Cuby Helios.

## Instalación local para pruebas

```bash
npm install
npm run build
sudo npm link
```

Después reinicia Homebridge. Para desarrollo, Homebridge recomienda `npm link` y arrancar Homebridge en modo debug.

## Configuración

La forma recomendada es usar la interfaz de Homebridge. Equivalente en `config.json`:

```json
{
  "platform": "CubyHelios",
  "name": "Cuby Helios",
  "email": "tu-correo@ejemplo.com",
  "password": "TU_CONTRASENA",
  "deviceID": "XXXXXXXXXXXX",
  "pollingInterval": 300,
  "tokenExpiration": 3600,
  "lowGasThreshold": 20
}
```

### Seguridad

La contraseña se almacena en la configuración de Homebridge porque es necesaria para renovar el JWT automáticamente. El plugin no la escribe en logs. Protege el acceso al servidor Homebridge y su archivo `config.json`.

Si una contraseña se ha compartido públicamente o en un chat, cámbiala antes de usar el plugin.

## Cómo se muestra en HomeKit

Apple HomeKit no tiene un servicio estándar para "nivel de tanque". Esta primera versión representa el nivel como un **HumiditySensor** llamado **Nivel de Gas**, porque ese servicio permite mostrar de forma nativa un valor porcentual de 0 a 100 en la app Casa.

Esto es únicamente una representación visual; el dato procede de `level` devuelto por Cuby.

## API utilizada

### Crear JWT

`POST https://cuby.cloud/api/v2/token/{email}`

Body:

```json
{
  "password": "...",
  "expiration": 3600
}
```

Respuesta esperada:

```json
{
  "expiration": 3600,
  "status": "ok",
  "token": "..."
}
```

### Consultar nivel de gas

`GET https://cuby.cloud/api/v2/history/gas/level/{deviceID}?token={JWT}`

Respuesta esperada:

```json
{
  "level": 50
}
```

## Publicar en npm

Antes de publicar por primera vez, confirma que el nombre `homebridge-cuby-helios` está disponible en npm y, si vas a usar GitHub, agrega `repository`, `homepage` y `bugs` a `package.json`.

Ejecuta:

```bash
npm install
npm run build
npm run pack:check
npm login
npm publish
```

Después de publicarlo, la instalación global será:

```bash
sudo npm install -g homebridge-cuby-helios
```

Para cada nueva versión, incrementa `version`, actualiza `CHANGELOG.md`, crea la release correspondiente en GitHub y vuelve a ejecutar `npm publish`.
