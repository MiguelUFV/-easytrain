# 📊 Guía de Datos y Exportación en EasyTrain

En esta guía aprenderás **cuándo** verás tus primeros datos y **cómo** sacarlos de Google Analytics para usarlos en Excel, Python o R.

## 🕒 1. ¿Cuándo veré los primeros datos?

Google Analytics 4 tiene dos "velocidades":

1.  **Tiempo Real (Inmediato)**: 
    - Tardas unos **5-10 segundos** en ver un evento después de que ocurre.
    - Úsalo para probar: Abre tu web, acepta las cookies, busca una ruta y verás el evento `search_route` aparecer en el panel "Tiempo real" de GA4.
2.  **Informes Estándar (Día siguiente)**:
    - Los gráficos generales tardan entre **24 y 48 horas** en procesarse. 
    - No te asustes si hoy ves el panel de control vacío; los datos de hoy aparecerán mañana.

## 📥 2. ¿Cómo exportar los datos?

Tienes tres formas principales de sacar la información:

### Opción A: Exportación Manual (Rápida)
Ideal para informes rápidos de una página.
1. Ve a cualquier informe en GA4 (ej. "Eventos").
2. Arriba a la derecha, haz clic en el icono de **Compartir informe** (parece una flecha saliendo de una caja).
3. Selecciona **Descargar archivo** y elige **CSV** o **Excel**.

### Opción B: Google BigQuery (Profesional - La que configuramos)
Es la mejor para análisis masivos.
- **Cómo**: Una vez vinculado (ver `walkthrough.md`), los datos se envían automáticamente cada noche.
- **Resultado**: Tendrás una tabla con cada búsqueda individual (origen, destino, etc.) lista para usar con SQL o Python.

### Opción C: Google Sheets (Sincronizada)
Hay un complemento oficial gratuito para Google Sheets llamado **"Google Analytics"**.
- Te permite hacer "Consultas" y traer los datos de las rutas más buscadas directamente a una hoja de cálculo con un solo clic, sin descargar archivos.

## ⚠️ IMPORTANTE: El Factor Cookies
Recuerda que con la nueva configuración legal que hemos puesto:
- **Si el usuario NO pulsa "Aceptar"** en el banner de cookies, los datos **no se envían**. 
- Esto es normal y es lo que exige la ley (RGPD). Asegúrate de aceptar las cookies tú mismo cuando hagas las pruebas.

---
*¿Quieres que preparemos un script de Python de ejemplo para leer estos datos cuando los tengas?*
