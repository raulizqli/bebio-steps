# Alexa Skill - Baby Tracker

## Descripción

Esta skill de Alexa permite a los usuarios registrar y consultar información sobre sus bebés usando comandos de voz.

## Características

- **Registrar Alimentación**: Registra cuántas onzas ha tomado el bebé
- **Registrar Sueño**: Registra las horas de sueño del bebé
- **Consultar Resumen de Alimentación**: Obtén un resumen de cuánto ha comido el bebé hoy
- **Consultar Resumen de Sueño**: Obtén un resumen de cuánto ha dormido el bebé hoy
- **Registrar Estado de Ánimo**: Registra cómo se siente el bebé

## Comandos de Ejemplo

### Registrar Alimentación
- "Alexa, dile a rastreador de bebés que registre 4 onzas"
- "Alexa, pregunta a rastreador de bebés que registre 5 onzas para Sofia"

### Registrar Sueño
- "Alexa, dile a rastreador de bebés que mi bebé durmió 2 horas"
- "Alexa, pregunta a rastreador de bebés que registre 3 horas de sueño para Lucas"

### Consultar Resúmenes
- "Alexa, pregunta a rastreador de bebés cuánto ha comido mi bebé hoy"
- "Alexa, pregunta a rastreador de bebés cuánto ha dormido Sofia hoy"

### Registrar Estado de Ánimo
- "Alexa, dile a rastreador de bebés que mi bebé está feliz"
- "Alexa, pregunta a rastreador de bebés que registre que Lucas está llorando"

## Configuración

### 1. Crear la Skill en Amazon Developer Console

1. Ve a [Amazon Developer Console](https://developer.amazon.com/alexa/console/ask)
2. Crea una nueva skill
3. Nombre: "Rastreador de Bebés"
4. Idioma: Español (ES)
5. Modelo: Custom
6. Backend: Provision your own

### 2. Configurar el Interaction Model

Copia el contenido de `interactionModels/es-ES.json` en el JSON Editor de tu skill.

### 3. Configurar Account Linking

1. En la consola de Alexa, ve a "Account Linking"
2. Activa "Do you allow users to create an account or link to an existing account?"
3. Configura los campos según `accountLinking.json`
4. El usuario necesitará vincular su cuenta de Baby Tracker

### 4. Desplegar el Endpoint

Puedes usar AWS Lambda o tu propio servidor HTTPS.

#### Opción A: AWS Lambda

1. Crea una función Lambda en AWS
2. Usa el código del backend en `/backend/src/routes/alexa.js`
3. Configura el trigger de Alexa Skills Kit
4. Copia el ARN de la función
5. Pégalo en la configuración de Endpoint de tu skill

#### Opción B: HTTPS Endpoint

1. Despliega tu backend en un servidor con HTTPS
2. El endpoint debe ser: `https://your-domain.com/api/alexa/intent`
3. El certificado SSL debe ser válido
4. Configura este endpoint en la skill

### 5. Pruebas

1. En la consola de Alexa, ve a la pestaña "Test"
2. Activa el testing para "Development"
3. Prueba con comandos de voz o texto:
   - "abre rastreador de bebés"
   - "registra 4 onzas"

## Vinculación de Cuenta

Para que los usuarios puedan usar la skill, necesitan vincular su cuenta:

1. El usuario abre la app de Alexa
2. Va a Skills > Tus Skills > Rastreador de Bebés
3. Presiona "Vincular Cuenta"
4. Ingresa sus credenciales de Baby Tracker
5. La skill ahora puede acceder a los datos del usuario

## Flujo de Autenticación

1. Usuario solicita vincular cuenta en la app de Alexa
2. Alexa redirige a tu endpoint de autenticación
3. Usuario ingresa email y contraseña
4. Backend genera un token de larga duración
5. Alexa guarda el token
6. Todas las solicitudes futuras incluyen este token

## Seguridad

- Los tokens de Alexa tienen una validez de 1 año
- Los usuarios pueden revocar el acceso desde la app de Alexa
- Todos los datos se transmiten sobre HTTPS
- Los tokens se almacenan de forma segura por Amazon

## Soporte

Para más información sobre el desarrollo de Alexa Skills:
- [Alexa Skills Kit Documentation](https://developer.amazon.com/docs/ask-overviews/build-skills-with-the-alexa-skills-kit.html)
- [Account Linking](https://developer.amazon.com/docs/account-linking/understand-account-linking.html)
