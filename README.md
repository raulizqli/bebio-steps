# Bebio Steps - Plataforma de Seguimiento de Bebé

Plataforma completa para el seguimiento y monitoreo del cuidado de bebés, con aplicaciones móviles para iOS y Android, integración con Alexa, y un sistema de permisos compartidos para padres, nannies y familiares.

## 🚀 Características Principales

### Seguimiento Completo
- **Alimentación (Tomas)**: Registra lactancia materna, biberón y alimentos sólidos con cantidades en onzas/ml
- **Sueño**: Monitorea horas de sueño, calidad y patrones
- **Salud**: Rastrea síntomas de enfermedad, enfermedades diagnosticadas y medicamentos
- **Estado de Ánimo**: Registra el estado emocional del bebé (feliz, tranquilo, inquieto, llorando, etc.)

### Plataformas Múltiples
- ✅ **Aplicación iOS** - React Native con Expo
- ✅ **Aplicación Android** - React Native con Expo
- ✅ **Integración con Alexa** - Control por voz en inglés y español

### Sistema de Permisos Avanzado
- **Registro de Padres**: Ambos padres o uno solo
- **Códigos de Compartición**: Genera códigos únicos para compartir acceso
- **Permisos Granulares**: Control detallado sobre qué puede ver/editar cada usuario
- **Acceso Temporal**: Configura tiempo límite para nannies
- **Revocación Instantánea**: Revoca permisos en cualquier momento

### Notificaciones Inteligentes
- Alertas cuando no se cumplen metas de sueño
- Notificaciones de objetivos de alimentación (onzas al día)
- Recordatorios de medicamentos
- Resúmenes diarios

## 🏗️ Arquitectura del Sistema

```
bebio-steps/
├── backend/              # API REST con Node.js/Express/TypeScript
├── mobile/               # App móvil React Native (iOS & Android)
├── alexa-skill/          # Skill de Alexa para control por voz
└── README.md            # Este archivo
```

## 📱 Backend API

### Tecnologías
- Node.js con Express
- TypeScript
- MongoDB con Mongoose
- JWT Authentication
- Firebase Cloud Messaging (notificaciones push)
- bcryptjs para seguridad de contraseñas

### Características
- API RESTful completa
- Autenticación y autorización basada en roles
- Sistema de permisos granular
- Notificaciones programadas con cron
- Validación de datos
- Manejo de errores robusto

### Instalación
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus credenciales
npm run dev
```

### Endpoints Principales
- `/api/auth` - Autenticación (registro/login)
- `/api/babies` - Gestión de perfiles de bebés
- `/api/feedings` - Registro de alimentación
- `/api/sleep` - Seguimiento de sueño
- `/api/health` - Monitoreo de salud (síntomas, enfermedades, medicamentos)
- `/api/mood` - Registro de estado de ánimo
- `/api/sharing` - Sistema de códigos compartidos
- `/api/goals` - Metas y objetivos

## 📱 Aplicación Móvil

### Tecnologías
- React Native con Expo
- TypeScript
- Expo Router para navegación
- Context API para gestión de estado
- Axios para llamadas API
- AsyncStorage para persistencia local

### Características
- Interfaz moderna y amigable
- Autenticación segura con JWT
- Múltiples perfiles de bebés
- Gráficos y estadísticas
- Modo offline (próximamente)
- Notificaciones push
- Compartir acceso con códigos QR

### Instalación
```bash
cd mobile
npm install
```

### Ejecución
```bash
# iOS
npm run ios

# Android
npm run android

# Web (desarrollo)
npm run web
```

## 🎙️ Alexa Skill

### Comandos de Voz (Español)
- "Alexa, pide a Pasos del Bebé que registre una toma"
- "Alexa, pregunta a Pasos del Bebé cuánto comió el bebé hoy"
- "Alexa, pide a Pasos del Bebé que inicie el seguimiento del sueño"
- "Alexa, pide a Pasos del Bebé que el bebé está feliz"
- "Alexa, pide a Pasos del Bebé un resumen diario"

### Comandos de Voz (Inglés)
- "Alexa, ask Baby Steps to log a feeding"
- "Alexa, ask Baby Steps how much did baby eat today"
- "Alexa, ask Baby Steps to start sleep tracking"
- "Alexa, ask Baby Steps baby is happy"
- "Alexa, ask Baby Steps for a daily summary"

### Instalación
Ver [alexa-skill/README.md](alexa-skill/README.md) para instrucciones detalladas de configuración.

## 🔐 Sistema de Permisos

### Roles de Usuario
1. **Padre/Madre (Parent)**: Acceso completo, puede crear y revocar permisos
2. **Nanny**: Acceso configurable con tiempo límite
3. **Familiar (Family)**: Acceso de solo lectura o edición según configuración

### Tipos de Permisos
- `canView`: Ver datos generales
- `canEdit`: Editar datos generales
- `canViewFeeding`: Ver alimentación
- `canEditFeeding`: Editar alimentación
- `canViewSleep`: Ver sueño
- `canEditSleep`: Editar sueño
- `canViewHealth`: Ver salud
- `canEditHealth`: Editar salud
- `canViewMood`: Ver estado de ánimo
- `canEditMood`: Editar estado de ánimo

### Flujo de Compartición
1. Padre crea código de compartición con permisos específicos
2. Padre envía código a nanny/familiar
3. Nanny/familiar ingresa código en la app
4. Sistema valida y otorga acceso
5. Padre puede revocar acceso en cualquier momento

### Acceso Temporal para Nannies
```javascript
// Ejemplo: Crear código que expira en 7 días
{
  "babyId": "baby_id",
  "permissions": {
    "canViewFeeding": true,
    "canEditFeeding": true,
    "canViewSleep": true,
    "canEditSleep": true
  },
  "expiresInDays": 7
}
```

## 📊 Notificaciones y Metas

### Configuración de Metas
```javascript
// Ejemplo: Meta de alimentación diaria
{
  "baby": "baby_id",
  "type": "feeding",
  "target": 24,        // 24 onzas al día
  "unit": "oz",
  "period": "daily"
}

// Ejemplo: Meta de sueño diaria
{
  "baby": "baby_id",
  "type": "sleep",
  "target": 14,        // 14 horas al día
  "unit": "hours",
  "period": "daily"
}
```

### Sistema de Notificaciones
- Verificación cada hora del progreso
- Notificación a las 11 PM si no se cumplieron metas
- Push notifications vía Firebase Cloud Messaging
- Notificaciones en la app Alexa

## 🚀 Despliegue

### Backend
```bash
cd backend
npm run build
npm start
```

Recomendado: Deploy en servicios como:
- Heroku
- AWS EC2 + MongoDB Atlas
- DigitalOcean + MongoDB Atlas
- Google Cloud Platform

### Mobile
```bash
cd mobile
eas build --platform ios
eas build --platform android
eas submit
```

### Alexa Skill
```bash
cd alexa-skill/lambda
npm install
npm run deploy
```

## 🔒 Seguridad

- Autenticación JWT con tokens seguros
- Contraseñas hasheadas con bcrypt
- Validación de datos en backend
- Permisos granulares por recurso
- HTTPS requerido en producción
- Rate limiting (recomendado para producción)
- Sanitización de inputs

## 📈 Roadmap Futuro

- [ ] Modo offline con sincronización
- [ ] Gráficos y análisis avanzados
- [ ] Exportación de datos (PDF, CSV)
- [ ] Múltiples idiomas
- [ ] Integración con Google Assistant
- [ ] Widget para iOS/Android
- [ ] Apple Watch y Android Wear
- [ ] Comunidad y consejos de padres
- [ ] IA para predicción de patrones
- [ ] Integración con dispositivos IoT (monitores de bebé)

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - ver el archivo LICENSE para más detalles

## 👥 Soporte

Para preguntas y soporte:
- Email: support@bebiosteps.com
- Issues: GitHub Issues
- Documentación: [docs.bebiosteps.com](https://docs.bebiosteps.com)

## 🙏 Agradecimientos

- React Native Community
- Expo Team
- Amazon Alexa Developer Team
- MongoDB
- Todos los padres beta testers

---

Hecho con ❤️ para padres y cuidadores de todo el mundo
