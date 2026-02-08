# Guía de Configuración - Bebio Steps

## Requisitos Previos

### Para el Backend
- Node.js 18+ y npm
- MongoDB 6.0+
- Cuenta de Firebase (para notificaciones push)

### Para la App Móvil
- Node.js 18+ y npm
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (para desarrollo en Mac)
- Android Studio y Android SDK (para desarrollo Android)

### Para Alexa Skill
- Cuenta de Amazon Developer
- Cuenta de AWS
- AWS CLI configurado

## Configuración Paso a Paso

### 1. Configurar el Backend

```bash
# Clonar el repositorio
git clone <repository-url>
cd bebio-steps

# Instalar dependencias del backend
cd backend
npm install

# Configurar variables de entorno
cp .env.example .env
```

Editar `.env`:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bebio-steps
JWT_SECRET=tu-secreto-muy-seguro-cambiar-en-produccion
JWT_EXPIRE=7d
FIREBASE_PROJECT_ID=tu-proyecto-firebase
FIREBASE_PRIVATE_KEY=tu-llave-privada-firebase
FIREBASE_CLIENT_EMAIL=tu-email-cliente-firebase
```

```bash
# Iniciar servidor de desarrollo
npm run dev
```

El servidor estará corriendo en `http://localhost:3000`

### 2. Configurar MongoDB

#### Opción A: MongoDB Local
```bash
# Instalar MongoDB
# macOS
brew tap mongodb/brew
brew install mongodb-community

# Iniciar MongoDB
brew services start mongodb-community

# Linux
sudo apt-get install mongodb
sudo systemctl start mongodb
```

#### Opción B: MongoDB Atlas (Cloud)
1. Crear cuenta en https://www.mongodb.com/cloud/atlas
2. Crear cluster gratuito
3. Configurar IP Whitelist (agregar 0.0.0.0/0 para desarrollo)
4. Crear usuario de base de datos
5. Obtener connection string
6. Actualizar `MONGODB_URI` en `.env`

### 3. Configurar Firebase (Notificaciones Push)

1. Ir a https://console.firebase.google.com
2. Crear nuevo proyecto
3. Agregar app iOS y Android
4. Descargar archivos de configuración:
   - `google-services.json` (Android)
   - `GoogleService-Info.plist` (iOS)
5. Ir a Project Settings > Service Accounts
6. Generar nueva clave privada
7. Copiar credenciales a `.env`:
```env
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@tu-proyecto.iam.gserviceaccount.com
```

### 4. Configurar App Móvil

```bash
cd ../mobile
npm install

# Configurar URL del API
# Editar src/config/api.ts
# Cambiar API_URL a tu servidor backend
```

#### Para iOS
```bash
npm run ios
```

Si tienes problemas con pods:
```bash
cd ios
pod install
cd ..
npm run ios
```

#### Para Android
```bash
npm run android
```

Asegúrate de tener:
- Android Studio instalado
- Android SDK configurado
- Emulador Android corriendo o dispositivo conectado

### 5. Configurar Alexa Skill

#### Crear Skill en Amazon Developer Console
1. Ir a https://developer.amazon.com/alexa/console/ask
2. Click "Create Skill"
3. Nombre: "Bebio Steps"
4. Modelo: Custom
5. Método de hosting: Provision your own

#### Configurar Interaction Model
```bash
cd ../alexa-skill

# Copiar contenido de interactionModels/custom/en-US.json
# Pegar en JSON Editor en Alexa Developer Console
```

#### Desplegar Lambda Function
1. Crear función Lambda en AWS Console:
   - Runtime: Node.js 18.x
   - Nombre: bebio-steps-alexa
   - Create new role with basic Lambda permissions

2. Configurar código:
```bash
cd lambda
npm install
zip -r function.zip .

# Subir function.zip a Lambda
aws lambda update-function-code \
  --function-name bebio-steps-alexa \
  --zip-file fileb://function.zip
```

3. Configurar variables de entorno en Lambda:
```
API_URL=https://tu-api-url.com/api
```

4. Copiar ARN de Lambda
5. Pegar ARN en Alexa Skill Endpoint

#### Configurar Account Linking
1. En Alexa Developer Console > Account Linking
2. Authorization URI: `https://tu-dominio.com/oauth/authorize`
3. Access Token URI: `https://tu-dominio.com/oauth/token`
4. Client ID: Generar ID único
5. Client Secret: Generar secreto seguro
6. Scopes: `read write`

### 6. Testing

#### Backend
```bash
cd backend
npm test
```

#### Mobile
```bash
cd mobile
npm test
```

#### Alexa
- Usar Alexa Developer Console Test Simulator
- Comando: "Alexa, open Baby Steps"

## Troubleshooting

### Backend no conecta a MongoDB
```bash
# Verificar que MongoDB esté corriendo
mongo --eval "db.runCommand({ connectionStatus: 1 })"

# Verificar connection string
echo $MONGODB_URI
```

### Mobile no puede conectar al backend
1. Si usas localhost, cambiar a IP local:
```javascript
// src/config/api.ts
const API_URL = 'http://192.168.1.X:3000/api';
```

2. Para iOS, permitir HTTP en Info.plist:
```xml
<key>NSAppTransportSecurity</key>
<dict>
  <key>NSAllowsArbitraryLoads</key>
  <true/>
</dict>
```

### Alexa Skill no responde
1. Verificar CloudWatch Logs en AWS
2. Verificar que Lambda tiene permisos correctos
3. Verificar que API_URL es correcta y accesible

### Push Notifications no funcionan
1. Verificar que Firebase está configurado correctamente
2. Verificar que los archivos de configuración están en mobile/
3. Para iOS, verificar que APNs está configurado en Firebase

## Configuración de Producción

### Backend
```bash
# Usar PM2 para process management
npm install -g pm2
pm2 start dist/server.js --name bebio-backend
pm2 save
pm2 startup
```

### Variables de entorno de producción
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/bebio
JWT_SECRET=secreto-muy-largo-y-aleatorio-generado-de-forma-segura
```

### SSL/HTTPS
Usar Let's Encrypt con Nginx:
```bash
sudo certbot --nginx -d api.bebiosteps.com
```

### Mobile
```bash
# Build para producción
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit a App Store / Google Play
eas submit --platform ios
eas submit --platform android
```

## Próximos Pasos

1. Configurar CI/CD (GitHub Actions, GitLab CI)
2. Configurar monitoreo (Sentry, LogRocket)
3. Configurar analytics (Google Analytics, Mixpanel)
4. Implementar rate limiting
5. Configurar backups automáticos de base de datos
6. Implementar CDN para assets estáticos

## Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Revisa CloudWatch logs (Alexa)
3. Revisa la consola del navegador/app
4. Abre un issue en GitHub
