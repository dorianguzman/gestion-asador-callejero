# 🌮 Asador Callejero - Sistema de Gestión

Sistema de gestión de ventas y control financiero para Asador Callejero, optimizado para dispositivos móviles y tablets.

## 📱 Características

- **Gestión de Ventas**: Registra ventas activas y ciérralas al recibir el pago
- **Control de Gastos**: Lleva un registro detallado de todos los gastos
- **Reportes P&L**: Visualiza ingresos, gastos y ganancias con gráficas
- **Menú Configurable**: Administra productos y precios desde la app
- **Sincronización GitHub**: Tus datos se guardan automáticamente en tu repositorio
- **Diseño Mobile-First**: Optimizado para uso en teléfono y tablet
- **Métodos de Pago**: Efectivo, Transferencia, Otro

## 🚀 Instalación

### Opción 1: Servidor Local Simple

1. Clona o descarga este repositorio
2. Abre una terminal en la carpeta del proyecto
3. Inicia un servidor HTTP simple:

```bash
# Con Python 3
python3 -m http.server 8000

# O con Python 2
python -m SimpleHTTPServer 8000

# O con Node.js (http-server)
npx http-server -p 8000
```

4. Abre tu navegador en `http://localhost:8000`

### Opción 2: GitHub Pages

1. Haz fork de este repositorio o sube los archivos a tu propio repositorio
2. Ve a Settings > Pages
3. Selecciona la rama `main` como source
4. Guarda y espera unos minutos
5. Tu app estará disponible en `https://[tu-usuario].github.io/gestion-asador-callejero`

## 🚀 Despliegue

Esta aplicación está diseñada para **Cloudflare Pages + D1** (la mejor opción gratuita).

### Para Producción (Cloudflare Pages)

**📖 Ver [CLOUDFLARE-DEPLOYMENT.md](./CLOUDFLARE-DEPLOYMENT.md) para instrucciones completas**

Resumen:
1. Crea cuenta en Cloudflare (gratis)
2. Conecta tu repositorio de GitHub
3. Crea base de datos D1
4. ¡Listo! 10 GB de base de datos gratis

### Almacenamiento de Datos

Los datos se guardan en **Cloudflare D1** (SQLite distribuido):
- ✅ 10 GB de almacenamiento
- ✅ 5 millones de lecturas/día
- ✅ Bandwidth ilimitado
- ✅ 100% GRATIS para siempre

### Desarrollo Local

1. Abre la aplicación en `http://localhost:8080`
2. La app cargará automáticamente (sin autenticación en v1)
3. Los datos se cargarán desde archivos locales en modo desarrollo

## 📖 Uso

### Registrar una Venta

1. Ve a **Ventas** > **Nueva Venta**
2. Selecciona los productos del menú (tacos, charolas, bebidas, etc.)
3. Los items se agregan automáticamente con sus precios
4. Si necesitas servicio a domicilio, ingresa el monto
5. Haz clic en **Guardar Venta**

### Cerrar una Venta

1. Ve a **Ventas** > **Activas**
2. Selecciona la venta que quieres cerrar
3. Haz clic en **Cerrar Venta**
4. Selecciona el método de pago (Efectivo, Transferencia, Otro)

### Registrar un Gasto

1. Ve a **Gastos**
2. Completa el formulario:
   - Fecha
   - Descripción
   - Monto
   - Categoría
3. Haz clic en **Registrar Gasto**

### Ver Reportes

1. Ve a **Reportes**
2. Selecciona el periodo (mes y año)
3. Haz clic en **Generar Reporte**
4. Visualiza:
   - KPIs (Ingresos, Gastos, Ganancia Neta)
   - Gráfica de Ingresos vs Gastos
   - Desglose de Gastos por Categoría

## 📊 Menú de Productos

### Tacos ($25-30)
- Arrachera: $25
- Chorizo Español: $25
- Chorizo Argentino: $25
- Chistorra: $25
- Diezmillo: $30
- Aguja: $30

### Quesadillas
Precio de taco + $15

### Charolas
- Arrachera: $200
- Chorizo Español: $200
- Chorizo Argentino: $200
- Diezmillo: $300
- Aguja: $300
- Combinada (una carne): $250
- Combinada (dos carnes): $300

### Otros
- Papas al Grill: $70 (2x$100)
- Tortas: $80 (2x$150)
- Chavindecas: $60 (2x$100)
- Refrescos Vidrio: $25
- Refrescos Plástico: $30
- Servicio a Domicilio: Variable

## 💾 Almacenamiento de Datos

Tus datos se guardan automáticamente en Cloudflare D1 Database en tiempo real cada vez que:
- Agregas una nueva venta
- Cierras una venta
- Registras un gasto
- Modificas el menú

También puedes:
- **Recargar Datos**: Fuerza una recarga desde la base de datos

## 🛠️ Tecnologías

- **HTML/CSS/JavaScript**: Aplicación estática
- **Chart.js**: Gráficas y visualizaciones
- **Cloudflare D1**: Base de datos SQLite distribuida
- **Cloudflare Pages Functions**: API serverless para CRUD
- **Cache en memoria**: Optimización de rendimiento

## 📱 Compatibilidad

- ✅ Chrome (Desktop & Mobile)
- ✅ Safari (iOS)
- ✅ Firefox
- ✅ Edge
- ✅ Tablets Android/iOS

## 🔒 Seguridad

- Los datos se almacenan en Cloudflare D1 Database (vinculado a tu cuenta de Cloudflare)
- Acceso protegido a través de Cloudflare Pages Functions
- Comunicación segura mediante HTTPS
- Sin autenticación de usuario en v1 (diseñado para uso interno)

## 📝 Licencia

© 2025 Asador Callejero. Todos los derechos reservados.

## 🆘 Soporte

Si encuentras algún problema o tienes sugerencias, por favor crea un issue en el repositorio.
