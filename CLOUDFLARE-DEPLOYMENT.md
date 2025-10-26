# 🚀 Guía de Despliegue - Cloudflare Pages + D1

Esta guía te ayudará a desplegar la aplicación en Cloudflare Pages con base de datos D1.

## 🎯 Por qué Cloudflare?

- ✅ **10 GB de base de datos** (vs 256 MB en Vercel)
- ✅ **Bandwidth ilimitado** (vs 100 GB en otros)
- ✅ **5 millones de lecturas/día** (vs 30k comandos/mes en Vercel)
- ✅ **100% GRATIS** para siempre
- ✅ **Red global más rápida**

## Prerequisitos

- Cuenta de GitHub
- Cuenta de Cloudflare (gratis): https://dash.cloudflare.com/sign-up
- Repositorio en GitHub con el código

---

## Paso 1: Crear GitHub OAuth App

1. Ve a GitHub Settings: https://github.com/settings/developers
2. Haz clic en **"OAuth Apps"** > **"New OAuth App"**
3. Completa el formulario:
   - **Application name**: `Asador Callejero`
   - **Homepage URL**: `https://gestion-asador-callejero.pages.dev` (temporal)
   - **Authorization callback URL**: `https://gestion-asador-callejero.pages.dev`
   - **Application description**: `Sistema de gestión de ventas`
4. Haz clic en **"Register application"**
5. **Copia el Client ID** (lo necesitarás en el paso 4)

---

## Paso 2: Preparar el Repositorio

Asegúrate de que todos los cambios estén en GitHub:

```bash
cd /Users/dorianguzman/Work/repo/gestion-asador-callejero
git add .
git commit -m "Migrate to Cloudflare Pages + D1"
git push origin main
```

---

## Paso 3: Crear y Conectar el Proyecto en Cloudflare

### 3.1 Crear el Sitio

1. Ve a https://dash.cloudflare.com
2. En el panel izquierdo, haz clic en **"Workers & Pages"**
3. Haz clic en **"Create application"** > **"Pages"** > **"Connect to Git"**
4. Autoriza Cloudflare para acceder a GitHub
5. Selecciona el repositorio `gestion-asador-callejero`
6. Configuración del build:
   - **Project name**: `gestion-asador-callejero`
   - **Production branch**: `main`
   - **Build command**: (dejar vacío)
   - **Build output directory**: `.` (punto)
7. Haz clic en **"Save and Deploy"**

### 3.2 Obtener la URL del Sitio

Después del primer despliegue, obtendrás una URL como:
```
https://gestion-asador-callejero.pages.dev
```

**Guarda esta URL** para el siguiente paso.

---

## Paso 4: Configurar el Client ID de GitHub

### Opción A: Actualizar en el código (Recomendado)

1. Abre `js/auth.js` en tu editor
2. Busca la línea:
   ```javascript
   const GITHUB_CLIENT_ID = 'Ov23liVKdWL7qJVw24Ps';
   ```
3. Reemplaza con tu Client ID del Paso 1
4. Guarda y haz commit:
   ```bash
   git add js/auth.js
   git commit -m "Update GitHub Client ID"
   git push
   ```
5. Cloudflare desplegará automáticamente

### Opción B: Variable de entorno (Avanzado)

1. En Cloudflare dashboard, ve a tu proyecto
2. **Settings** > **Environment variables**
3. Agrega variable para Production:
   - **Variable name**: `GITHUB_CLIENT_ID`
   - **Value**: Tu Client ID
4. Click **"Save"**

---

## Paso 5: Actualizar GitHub OAuth App con URL Real

1. Ve a tu GitHub OAuth App: https://github.com/settings/developers
2. Haz clic en "Asador Callejero"
3. Actualiza las URLs con tu URL real de Cloudflare:
   - **Homepage URL**: `https://gestion-asador-callejero.pages.dev`
   - **Authorization callback URL**: `https://gestion-asador-callejero.pages.dev`
4. Guarda los cambios

---

## Paso 6: Crear la Base de Datos D1

### 6.1 Instalar Wrangler CLI

```bash
npm install -g wrangler
```

### 6.2 Iniciar Sesión

```bash
wrangler login
```

Esto abrirá tu navegador para autorizar Wrangler.

### 6.3 Crear la Base de Datos

```bash
cd /Users/dorianguzman/Work/repo/gestion-asador-callejero

# Crear base de datos D1
wrangler d1 create asador-callejero-db
```

Verás una salida como:
```
✅ Successfully created DB 'asador-callejero-db'
Database ID: xxxx-xxxx-xxxx-xxxx-xxxx
```

**Copia el Database ID**

### 6.4 Actualizar wrangler.toml

Abre `wrangler.toml` y reemplaza `database_id`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "asador-callejero-db"
database_id = "TU-DATABASE-ID-AQUI"  # ← Pega tu ID aquí
```

### 6.5 Inicializar el Schema

```bash
# Aplicar schema a la base de datos
wrangler d1 execute asador-callejero-db --file=./schema.sql
```

Deberías ver:
```
✅ Executed 14 commands in 0.5s
```

---

## Paso 7: Vincular D1 a Cloudflare Pages

1. Ve a tu proyecto en Cloudflare dashboard
2. **Settings** > **Functions** > **D1 database bindings**
3. Haz clic en **"Add binding"**:
   - **Variable name**: `DB`
   - **D1 database**: Selecciona `asador-callejero-db`
4. Click **"Save"**

---

## Paso 8: Redesplegar

```bash
git add wrangler.toml
git commit -m "Add D1 database configuration"
git push
```

O fuerza un redespliegue desde Cloudflare dashboard:
1. Ve a **Deployments**
2. Haz clic en **"Retry deployment"** en el último despliegue

---

## Paso 9: Probar la Aplicación

1. Abre tu sitio: `https://gestion-asador-callejero.pages.dev`
2. Haz clic en **"Iniciar Sesión con GitHub"**
3. Deberías ver un código
4. Ve a https://github.com/login/device
5. Ingresa el código
6. Autoriza la aplicación
7. ¡Listo! Ya puedes usar la app

---

## 🎨 Dominio Personalizado (Opcional)

1. En Cloudflare, ve a tu proyecto
2. **Custom domains** > **"Set up a custom domain"**
3. Ingresa tu dominio (ej: `asador.tudominio.com`)
4. Sigue las instrucciones para configurar DNS
5. Actualiza la GitHub OAuth App con el nuevo dominio

---

## 📊 Verificar que D1 Funciona

### Ver datos en la base de datos:

```bash
# Ver todas las tablas
wrangler d1 execute asador-callejero-db --command "SELECT name FROM sqlite_master WHERE type='table'"

# Ver ventas activas
wrangler d1 execute asador-callejero-db --command "SELECT * FROM sales_active"

# Ver gastos
wrangler d1 execute asador-callejero-db --command "SELECT * FROM expenses"
```

---

## 🔍 Troubleshooting

### Error: "DB is not defined"

**Problema**: La binding de D1 no está configurada

**Solución**:
1. Verifica que completaste el Paso 7
2. Redesplegar el sitio (Paso 8)

### Error: "Failed to fetch /api/..."

**Problema**: Las funciones no se están desplegando

**Solución**:
1. Verifica que la carpeta `functions/` existe en el repo
2. Verifica que hiciste push de todos los archivos
3. Revisa los logs en: Cloudflare dashboard > tu proyecto > **Functions**

### Error: "Table doesn't exist"

**Problema**: El schema no se aplicó correctamente

**Solución**:
```bash
wrangler d1 execute asador-callejero-db --file=./schema.sql --remote
```

### Error OAuth: "Invalid client_id"

**Problema**: El Client ID no está correcto

**Solución**:
1. Verifica el Client ID en `js/auth.js`
2. Verifica que las URLs en GitHub OAuth coincidan

---

## 📈 Monitoreo y Límites

### Límites del Free Tier:

| Recurso | Límite Gratis |
|---------|---------------|
| **D1 Storage** | 10 GB |
| **D1 Reads** | 5M/day |
| **D1 Writes** | 100k/day |
| **Pages Bandwidth** | Unlimited |
| **Pages Requests** | Unlimited |
| **Functions Requests** | 100k/day |

**Para tu uso estimado:**
- ~300 ventas/mes = ~3 writes/día ✅
- ~1000 lecturas/día ✅
- Bandwidth: Unlimited ✅

**Estarás MUY por debajo de los límites** 🎉

### Ver Métricas:

1. Cloudflare dashboard > Tu proyecto
2. **Analytics** para ver tráfico
3. **D1** en el menú lateral para ver uso de base de datos

---

## 🔄 Actualizaciones

Cada vez que hagas `git push`, Cloudflare desplegará automáticamente los cambios.

Para desplegar manualmente:
```bash
wrangler pages deploy .
```

---

## 💾 Backup de Datos

### Exportar toda la base de datos:

```bash
wrangler d1 export asador-callejero-db --output=backup.sql
```

### Restaurar desde backup:

```bash
wrangler d1 execute asador-callejero-db --file=backup.sql
```

**Recomendación**: Exporta backups regularmente usando la función de exportar en la app.

---

## 🆘 Soporte

Si tienes problemas:

1. **Logs de funciones**: Cloudflare dashboard > Functions > Log
2. **D1 Status**: https://www.cloudflarestatus.com
3. **Documentación**: https://developers.cloudflare.com/pages
4. **Community**: https://community.cloudflare.com

---

## 🎉 ¡Listo!

Tu aplicación está desplegada con:
- ✅ OAuth funcionando
- ✅ Base de datos D1 (10 GB)
- ✅ Bandwidth ilimitado
- ✅ Deploy automático
- ✅ **100% GRATIS**

**URL de tu app**: `https://gestion-asador-callejero.pages.dev`

¡Disfruta tu app! 🌮🔥
