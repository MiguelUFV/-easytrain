# 📂 Guía de Estructura de EasyTrain

¡Bienvenido! He organizado el código del proyecto para que sea mucho más fácil de entender y navegar. Aquí tienes una explicación sencilla de dónde está cada cosa:

## 🏗️ La Nueva Estructura

Ahora, todo lo visual está dentro de la carpeta `src/components`, organizada por su función:

### 1. `src/components/ui/` (Interfaz de Usuario)
Aquí encontrarás los "bloques de construcción" de la app. Son componentes visuales pequeños y reutilizables.
- **Botones**: `BookingButton.tsx`
- **Diálogos y Alertas**: `Toast.tsx`, `OnboardingTour.tsx`
- **Elementos de Lista**: `RouteCard.tsx`
- **Buscadores**: `StationSearch.tsx`, `PassengerSelector.tsx`

### 2. `src/components/maps/` (Mapas)
Todo lo relacionado con la visualización geográfica.
- **Mapa Principal**: `EuropeMap.tsx`
- **Vista 3D**: `Map3D.tsx`

### 3. `src/components/features/` (Funcionalidades)
Componentes complejos que unen lógica y diseño para una función específica.
- **Buscador Principal**: `SearchPanel.tsx`
- **Historial**: `SearchHistory.tsx`
- **Planificador**: `InterrailPlanner.tsx`
- **Exportación**: `ItineraryExporter.tsx`

### 4. `src/pages/` (Páginas)
Aquí están las pantallas completas de la aplicación.
- `ProfilePage.tsx` (Tu Perfil)
- `Settings.tsx` (Configuración)
- `TicketsPage.tsx` (Mis Billetes)
- `PriceAlertsPage.tsx` (Alertas de Precio)

## 🛠️ Otras carpetas importantes
- `src/lib/`: La "inteligencia" de la app (cálculos, conexión con datos, lógica de reserva).
- `src/store/`: Donde la app recuerda tus datos (favoritos, historial, etc.).
- `src/types/`: Definiciones técnicas para evitar errores.
- `src/App.tsx`: El corazón que conecta todas las páginas.

---
*Esta estructura ha sido diseñada para ser profesional, escalable y, sobre todo, amigable para el equipo. ¡Feliz desarrollo!* 🚂✨
