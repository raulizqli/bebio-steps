# Requisitos funcionales (ES)

## 1. Objetivo
Aplicacion para registrar tomas, horas de sueno, comidas (cuando aplique),
sintomas de enfermedad, enfermedades, medicinas y estado de animo del bebe.
Debe incluir apps para iOS y Android, mas integracion con Alexa.

## 2. Plataformas y componentes
- iOS (app nativa)
- Android (app nativa)
- Backend API y base de datos
- Integracion Alexa (skill + account linking)

## 3. Usuarios, roles y permisos
### 3.1 Roles
- Padre/Madre: rol administrador del perfil del bebe.
- Cuidador: nanny o familiar con permisos limitados y revocables.

### 3.2 Registro y vinculacion
- Se permite registrar a ambos padres o a uno solo.
- Un padre/madre debe existir como administrador principal.
- Soporte para multiples bebes por familia.

### 3.3 Invitaciones por codigo
- El padre/madre puede generar un codigo para invitar a una nanny o familiar.
- El codigo puede configurarse con:
  - Fecha de expiracion.
  - Duracion maxima de acceso (por ejemplo, 7 dias).
  - Uso unico o reutilizable.
- El acceso puede revocarse en cualquier momento.
- Se registra un historial de cambios de permisos.

### 3.4 Matriz de permisos (ejemplo base)
Accion | Padre/Madre | Familiar | Nanny
--- | --- | --- | ---
Ver registros | si | segun permiso | segun permiso
Crear/editar registros | si | opcional | opcional
Gestionar metas | si | no | no
Gestionar permisos | si | no | no
Ver historial completo | si | segun permiso | segun permiso

Nota: los permisos son por bebe, no globales.

## 4. Registro de eventos
Todos los eventos deben guardar: fecha/hora, zona horaria, usuario creador,
notas opcionales y origen (iOS/Android/Alexa).

### 4.1 Tomas (alimentacion con leche)
- Tipo: biberon o lactancia.
- Cantidad: onzas o mililitros (unidad obligatoria).
- Lado (si aplica para lactancia).

### 4.2 Sueno
- Inicio y fin (o duracion).
- Tipo: siesta o nocturno.

### 4.3 Comidas (cuando aplique)
- Tipo de alimento o menu.
- Cantidad y unidad.
- Alergenos o restricciones.

### 4.4 Sintomas y enfermedades
- Sintoma: tipo, severidad, inicio/fin.
- Enfermedad: diagnostico, fecha, notas.

### 4.5 Medicinas
- Nombre de la medicina.
- Dosis, unidad, frecuencia y horario.
- Fecha de inicio y fin.

### 4.6 Estado de animo
- Escala (1-5) y etiquetas (ej. calmado, irritable).

## 5. Metas y notificaciones
### 5.1 Metas configurables
- Meta diaria de sueno (horas por dia).
- Meta diaria de alimentacion (onzas por dia).
- Configurable por bebe.

### 5.2 Reglas de notificacion
- Notificar cuando el progreso del dia este por debajo de la meta.
- Ejemplo de control: checkpoints a las 12:00, 18:00 y 21:00.
- Evitar spam con enfriamiento (cooldown) por meta.
- Respetar horas de silencio.

## 6. Integracion con Alexa
- Account linking con el backend.
- Intents minimos:
  - Registrar una toma (cantidad en onzas).
  - Iniciar/detener sueno.
  - Registrar medicina.
  - Consultar ultima toma o resumen del dia.
- Respuestas por voz en espanol neutro.

## 7. Seguridad y privacidad
- Cifrado en transito (TLS) y en reposo.
- Control de acceso basado en roles.
- Historial de auditoria para cambios de permisos.

## 8. Datos y sincronizacion
- Soporte offline con cola de eventos.
- Resolucion de conflictos por timestamp y prioridad del servidor.
- Normalizacion de unidades (oz/ml) y zona horaria.
