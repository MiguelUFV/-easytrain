# 🚀 Tutorial Literal: Vincular GA4 con Google BigQuery

Sigue estos pasos exactamente en orden. No te preocupes por el coste: BigQuery tiene una capa gratuita (Sandbox) que es más que suficiente para empezar con EasyTrain.

## Parte 1: Crear el proyecto en Google Cloud (Si no tienes uno)
1. Entra en [Google Cloud Console](https://console.cloud.google.com/).
2. Arriba a la izquierda, junto al logo de Google Cloud, haz clic en el desplegable de proyectos y pulsa **"Proyecto nuevo"**.
3. Ponle de nombre `EasyTrain-Data` y dale a **Crear**.
4. ¡Listo! Quédate con el ID del proyecto (ej: `easytrain-data-415218`).

## Parte 2: El "Click-a-Click" en Google Analytics
1. Abre [Google Analytics](https://analytics.google.com/) y entra en tu propiedad de EasyTrain.
2. Haz clic en **Administrar** (la rueda dentada abajo a la izquierda).
3. En la columna del medio ("Propiedad"), baja hasta encontrar la sección **Vinculaciones con otros productos**.
4. Haz clic en **Vinculaciones con BigQuery**.
5. Pulsa el botón azul **Vincular**.
6. Haz clic en **Elegir un proyecto de Google Cloud**.
7. Selecciona el proyecto que creaste en la Parte 1 (`EasyTrain-Data`) y dale a **Confirmar**.
8. En **Ubicación de los datos**, elige `EU (Europa)` (importante para el cumplimiento legal).
9. Dale a **Siguiente**.

## Parte 3: Configuración de los Datos
1. En **Configurar flujos de datos y eventos**, asegúrate de que tu flujo de la web está marcado.
2. En **Ajustes de exportación**, verás dos opciones:
   - **Diaria**: (RECOMENDADO) Envía un paquete con todo lo de ayer cada mañana. Es gratis.
   - **Streaming**: Envía los datos al segundo. Puede tener un coste mínimo si tienes muchísimas visitas. Para empezar, déjalo **desactivado**.
3. Haz clic en **Siguiente**, revisa que todo esté bien y pulsa **Enviar**.

## Parte 4: ¿Cómo sé si funciona?
1. Espera **24 horas** (Google tarda un día en hacer el primer envío).
2. Mañana, entra en [BigQuery Console](https://console.cloud.google.com/bigquery).
3. A la izquierda verás tu proyecto. Despliégalo y verás un conjunto de datos llamado `analytics_XXXXXXX`.
4. Dentro habrá una tabla llamada `events_YYYYMMDD`. ¡Ahí están tus datos!

---

### 🧪 Prueba de Uso Real (SQL)
Cuando tengas la tabla mañana, pega esto en el editor de BigQuery para ver tus búsquedas reales:

```sql
SELECT 
  event_date,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'origen') as origen,
  (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'destino') as destino,
  (SELECT value.int_value FROM UNNEST(event_params) WHERE key = 'num_pasajeros') as pasajeros
FROM `tu-proyecto.analytics_XXXXX.events_*`
WHERE event_name = 'search_route'
ORDER BY event_date DESC
```

¡Ya tienes una arquitectura de datos profesional! ¿Quieres que te explique cómo conectar esto con Excel una vez lo tengas?
