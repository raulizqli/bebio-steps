# Baby Tracker - Plataforma de Seguimiento de Bebés

Una aplicación integral para el seguimiento y monitoreo de la salud y rutinas de bebés, con aplicaciones móviles para iOS y Android, backend API, e integración con Alexa.

## 🌟 Características

### Seguimiento Completo
- 🍼 **Alimentación**: Registra tomas de biberón, lactancia y sólidos (onzas consumidas)
- 😴 **Sueño**: Monitorea horas de sueño y calidad del descanso
- 🍽️ **Comidas**: Seguimiento de comidas sólidas cuando el bebé crezca
- 🤒 **Enfermedades**: Registra síntomas, enfermedades y severidad
- 💊 **Medicamentos**: Control de medicinas, dosis y frecuencia
- 😊 **Estado de Ánimo**: Monitorea el estado emocional del bebé

### Sistema de Usuarios y Permisos
- 👨‍👩‍👧 **Múltiples Padres**: Ambos padres pueden registrarse y acceder
- 👶 **Nannies/Cuidadores**: Sistema de códigos para compartir acceso
- 🔐 **Permisos Granulares**: Control detallado de qué puede ver/hacer cada usuario
- ⏰ **Acceso Temporal**: Configura accesos que expiran automáticamente
- 🔄 **Revocación**: Revoca permisos en cualquier momento

### Notificaciones Inteligentes
- 📊 **Metas Diarias**: Alertas cuando no se cumplen metas de alimentación
- 💤 **Control de Sueño**: Notificaciones sobre objetivos de descanso
- 📅 **Recordatorios**: Medicamentos y citas médicas

### Multiplataforma
- 📱 **iOS**: Aplicación nativa para iPhone y iPad
- 🤖 **Android**: Aplicación nativa para dispositivos Android
- 🗣️ **Alexa**: Control por voz para manos libres

## 🏗️ Arquitectura

```
baby-tracker/
├── backend/              # API REST con Node.js y Express
│   ├── src/
│   │   ├── routes/      # Endpoints de la API
│   │   ├── middleware/  # Autenticación y validación
│   │   ├── jobs/        # Tareas programadas (notificaciones)
│   │   └── utils/       # Utilidades y helpers
│   └── prisma/          # Esquema de base de datos
│
├── mobile/              # Aplicación React Native
│   ├── src/
│   │   ├── screens/    # Pantallas de la app
│   │   ├── context/    # Estado global (Auth, Baby)
│   │   └── config/     # Configuración API
│   └── App.js
│
└── alexa-skill/        # Skill de Alexa
    ├── interactionModels/
    └── skill.json
```

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js 18+
- PostgreSQL 14+
- npm o yarn
- Expo CLI (para mobile)

### Backend

1. **Instalar dependencias**
```bash
cd backend
npm install
```

2. **Configurar variables de entorno**
```bash
cp .env.example .env
# Edita .env con tus configuraciones
```

3. **Configurar base de datos**
```bash
# Crea una base de datos PostgreSQL
createdb baby_tracker

# Ejecuta las migraciones
npx prisma migrate dev
npx prisma generate
```

4. **Iniciar servidor**
```bash
npm run dev
# Servidor corriendo en http://localhost:3000
```

### Mobile

1. **Instalar dependencias**
```bash
cd mobile
npm install
```

2. **Configurar API**
Edita `src/config/api.js` y actualiza la URL del backend:
```javascript
const API_URL = 'http://tu-backend-url.com/api';
```

3. **Iniciar aplicación**
```bash
# Para iOS
npm run ios

# Para Android
npm run android

# Para web (testing)
npm run web
```

### Alexa Skill

Ver [alexa-skill/README.md](alexa-skill/README.md) para instrucciones detalladas.

## 📱 Uso de la Aplicación

### Registro e Inicio de Sesión

1. Abre la aplicación móvil
2. Registra una cuenta como padre/madre
3. Agrega información de tu bebé
4. ¡Comienza a registrar actividades!

### Compartir Acceso

1. Ve a "Compartir Acceso" en el menú
2. Selecciona los permisos que deseas otorgar
3. Configura la fecha de expiración (opcional)
4. Copia el código generado
5. Comparte el código con la nanny/familiar
6. Ellos lo canjean en su aplicación

### Usar con Alexa

1. Habilita la skill "Rastreador de Bebés" en la app de Alexa
2. Vincula tu cuenta
3. Usa comandos de voz:
   - "Alexa, dile a rastreador de bebés que registre 4 onzas"
   - "Alexa, pregunta a rastreador de bebés cuánto ha dormido mi bebé hoy"

## 🔐 Seguridad

- Contraseñas hasheadas con bcrypt
- Autenticación JWT
- Permisos granulares por recurso
- HTTPS en producción
- Validación de datos en backend
- Rate limiting
- Tokens de larga duración para Alexa

## 📊 Base de Datos

El sistema utiliza PostgreSQL con Prisma ORM. El esquema incluye:

- **Users**: Usuarios del sistema (padres, nannies, familiares)
- **Babies**: Información de los bebés
- **SharedAccess**: Códigos y permisos compartidos
- **FeedingLog**: Registros de alimentación
- **SleepLog**: Registros de sueño
- **MealLog**: Registros de comidas
- **IllnessLog**: Registros de enfermedades
- **MedicationLog**: Registros de medicamentos
- **MoodLog**: Registros de estado de ánimo
- **Notifications**: Notificaciones del sistema

## 🔄 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `GET /api/auth/me` - Obtener usuario actual

### Bebés
- `GET /api/babies` - Listar bebés
- `POST /api/babies` - Crear bebé
- `PUT /api/babies/:id` - Actualizar bebé
- `DELETE /api/babies/:id` - Eliminar bebé

### Alimentación
- `POST /api/feeding` - Registrar alimentación
- `GET /api/feeding/:babyId` - Obtener registros
- `GET /api/feeding/:babyId/summary/today` - Resumen del día

### Sueño
- `POST /api/sleep` - Registrar sueño
- `GET /api/sleep/:babyId` - Obtener registros
- `GET /api/sleep/:babyId/summary/today` - Resumen del día

### Compartir
- `POST /api/share/create` - Crear código para compartir
- `POST /api/share/redeem` - Canjear código
- `GET /api/share/baby/:babyId` - Ver accesos compartidos
- `DELETE /api/share/:shareId` - Revocar acceso

Ver documentación completa de la API en `/backend/API_DOCS.md`

## 🎯 Notificaciones Automáticas

El sistema ejecuta tareas programadas cada hora para:

1. **Verificar metas de alimentación** (6 PM)
   - Si el bebé no ha alcanzado su meta diaria de onzas
   - Envía notificación a los padres

2. **Verificar metas de sueño** (8 PM)
   - Si el bebé no ha alcanzado su meta diaria de horas
   - Envía notificación a los padres

3. **Alertas de accesos expirando**
   - Notifica 24 horas antes de que expire un acceso compartido
   - Tanto al creador como al usuario con acceso

## 🛠️ Desarrollo

### Estructura de Permisos

```javascript
const PERMISSIONS = [
  'VIEW_FEEDING',    // Ver registros de alimentación
  'ADD_FEEDING',     // Agregar registros de alimentación
  'VIEW_SLEEP',      // Ver registros de sueño
  'ADD_SLEEP',       // Agregar registros de sueño
  'VIEW_MEALS',      // Ver comidas
  'ADD_MEALS',       // Agregar comidas
  'VIEW_ILLNESS',    // Ver enfermedades
  'ADD_ILLNESS',     // Agregar enfermedades
  'VIEW_MEDICATION', // Ver medicamentos
  'ADD_MEDICATION',  // Agregar medicamentos
  'VIEW_MOOD',       // Ver estado de ánimo
  'ADD_MOOD',        // Agregar estado de ánimo
  'MANAGE_SHARES',   // Gestionar accesos compartidos
];
```

### Roles de Usuario

- **PARENT**: Control total sobre sus bebés
- **NANNY**: Acceso basado en permisos otorgados
- **FAMILY**: Acceso basado en permisos otorgados

## 📈 Roadmap

- [ ] Gráficas y estadísticas
- [ ] Exportar datos a PDF
- [ ] Recordatorios de medicamentos
- [ ] Integración con Google Calendar
- [ ] Modo oscuro
- [ ] Soporte multiidioma
- [ ] Aplicación web
- [ ] Sincronización offline
- [ ] Fotos y galería

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver el archivo LICENSE para más detalles

## 👥 Autores

Baby Tracker Team

## 🙏 Agradecimientos

- React Native community
- Prisma team
- Amazon Alexa developers
- Todas las familias que ayudaron a probar la aplicación

## 📞 Soporte

Para soporte, envía un email a support@babytracker.com o abre un issue en GitHub.

---

Hecho con ❤️ para padres y bebés
