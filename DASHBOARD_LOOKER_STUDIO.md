# 📊 Tutorial: Crea tu Cuadro de Mando en Looker Studio

Looker Studio es la herramienta que transformará tus datos aburridos en gráficos espectaculares que se actualizan solos. Es totalmente gratis.

## Paso 1: Entrar y Conectar
1. Entra en [Looker Studio](https://lookerstudio.google.com/).
2. Haz clic en el botón grande de **"Informe vacío"** (arriba a la izquierda, con un símbolo +).
3. Se abrirá un panel llamado "Añadir datos al informe". Busca el conector de **Google Analytics**.
4. En la lista, selecciona tu cuenta y luego la propiedad **EasyTrain**.
5. Haz clic en el botón azul **Añadir** (abajo a la derecha) y confirma en la ventana emergente pulsando "Añadir al informe".

## Paso 2: Crear tu primer gráfico de "Rutas Top"
Ahora verás una tabla genérica. Vamos a personalizarla para ver tus búsquedas de trenes:
1. Haz clic en la tabla que se ha creado por defecto.
2. A la derecha verás el panel de **Configuración**.
3. En **Dimensión**, busca y arrastra el campo `Nombre del evento`.
4. En **Métrica**, asegúrate de que ponga `Recuento de eventos`.
5. *Consejo*: Para ver solo las búsquedas, baja hasta "Filtro" en ese panel derecho, pulsa "Añadir un filtro" y configúralo como: `Incluir` -> `Nombre del evento` -> `Igual a` -> `search_route`.

## Paso 3: Añadir un Mapa de Calor (¡El toque pro!)
1. En el menú superior, haz clic en **Añadir un gráfico**.
2. Selecciona el **Mapa de burbujas** o el **Mapa coroplético**.
3. En el panel derecho de configuración:
   - **Ubicación**: Arrastra el campo `Ciudad` o `País`.
   - **Tamaño/Color**: Arrastra `Recuento de eventos`.
4. ¡Boom! Ahora verás desde qué puntos de Europa hay más interés por tus rutas de tren.

## Paso 4: Ajustes de Diseño (Premium Feel)
Para que el panel se vea tan bien como tu web:
1. Haz clic fuera de cualquier gráfico (en el fondo blanco).
2. A la derecha, ve a la pestaña **Tema y diseño**.
3. Elige el tema **Constellation** (el oscuro) si quieres que combine con el estilo "Glassmorphism" de EasyTrain.

## ⚡ Acceso Rápido y Guardado

No busques el botón de "Guardar": ¡No existe! Looker Studio funciona como Google Docs y **guarda cada cambio automáticamente** en la nube.

### Cómo acceder siempre en 1 segundo:
1.  **Favoritos**: Pulsa `Ctrl + D` en tu navegador mientras ves el informe y guárdalo en tu barra de marcadores como "📈 EasyTrain - Stats".
2.  **Enlace Directo**: Pulsa el botón **Compartir** (arriba a la derecha) -> **Obtener enlace al informe**. Guárdate ese enlace en tus notas o pásatelo por WhatsApp/Slack.
3.  **App de Escritorio**: En Chrome, puedes ir a los 3 puntos (arriba a la derecha) -> **Guardar y compartir** -> **Instalar esta página como aplicación**. Así lo tendrás como un programa más en tu barra de tareas de Windows.

---

### 📅 El Truco Final: Informe por Email
¿No quieres entrar a mirar? Haz que el gráfico te busque a ti:
1.  Pulsa en la flechita junto al botón **Compartir**.
2.  Elige **Programar entrega por correo electrónico**.
3.  Pon tu email y elige "Cada lunes a las 09:00". 
4.  Recibirás un PDF precioso con tus estadísticas sin mover un dedo.
