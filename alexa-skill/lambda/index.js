const Alexa = require('ask-sdk-core');
const axios = require('axios');

// API Configuration - set these in Lambda environment variables
const API_BASE_URL = process.env.BEBIO_API_URL || 'https://api.bebio-steps.com/api';

// Helper to make authenticated API calls
async function apiCall(handlerInput, method, path, data = null) {
  const token = getToken(handlerInput);
  if (!token) {
    throw new Error('NOT_LINKED');
  }

  const config = {
    method,
    url: `${API_BASE_URL}${path}`,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    config.data = data;
  }

  const response = await axios(config);
  return response.data;
}

function getToken(handlerInput) {
  // Get token from account linking or session attributes
  const accessToken = handlerInput.requestEnvelope.context.System.user.accessToken;
  if (accessToken) return accessToken;

  // Fallback: token stored in session
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  return sessionAttributes.authToken || null;
}

function getBabyId(handlerInput) {
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  return sessionAttributes.currentBabyId || null;
}

// ============ HANDLERS ============

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const token = getToken(handlerInput);

    if (!token) {
      return handlerInput.responseBuilder
        .speak('Bienvenido a BebIO Steps. Para usar este skill, necesitas vincular tu cuenta. Ve a la app de Alexa para hacerlo.')
        .withLinkAccountCard()
        .getResponse();
    }

    try {
      // Get user profile and babies
      const profile = await apiCall(handlerInput, 'GET', '/auth/me');
      const userName = profile.user.name.split(' ')[0];

      if (profile.families.length === 0) {
        return handlerInput.responseBuilder
          .speak(`Hola ${userName}. No tienes ninguna familia configurada todavía. Configura tu familia desde la app.`)
          .getResponse();
      }

      const familyId = profile.families[0].id;
      const babiesData = await apiCall(handlerInput, 'GET', `/babies/family/${familyId}`);

      if (babiesData.babies.length === 0) {
        return handlerInput.responseBuilder
          .speak(`Hola ${userName}. No has registrado ningún bebé aún. Agrega a tu bebé desde la app.`)
          .getResponse();
      }

      const baby = babiesData.babies[0];

      // Store baby info in session
      const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
      sessionAttributes.currentBabyId = baby.id;
      sessionAttributes.babyName = baby.name;
      sessionAttributes.familyId = familyId;
      handlerInput.attributesManager.setSessionAttributes(sessionAttributes);

      const speechText = `Hola ${userName}. Estoy lista para ayudarte con ${baby.name}. Puedes preguntarme el resumen del día, registrar una toma, sueño, o estado de ánimo. ¿Qué deseas hacer?`;

      return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt('¿Qué deseas registrar o consultar?')
        .getResponse();
    } catch (error) {
      if (error.message === 'NOT_LINKED') {
        return handlerInput.responseBuilder
          .speak('Necesitas vincular tu cuenta de BebIO Steps. Ve a la app de Alexa para hacerlo.')
          .withLinkAccountCard()
          .getResponse();
      }
      return handlerInput.responseBuilder
        .speak('Hubo un error al conectar con BebIO Steps. Intenta de nuevo más tarde.')
        .getResponse();
    }
  },
};

// Log Feeding
const LogFeedingIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LogFeedingIntent';
  },
  async handle(handlerInput) {
    const babyId = getBabyId(handlerInput);
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const babyName = sessionAttributes.babyName || 'el bebé';

    if (!babyId) {
      return handlerInput.responseBuilder
        .speak('Primero necesito saber de qué bebé hablamos. Di "abrir bebio steps" para empezar.')
        .getResponse();
    }

    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const amount = slots.amount?.value ? parseFloat(slots.amount.value) : null;
    const feedingType = slots.feedingType?.value || 'bottle';

    // Map Spanish feeding type to API type
    const typeMap = {
      'biberón': 'bottle', 'biberon': 'bottle', 'botella': 'bottle',
      'pecho': 'breast', 'lactancia': 'breast',
      'fórmula': 'formula', 'formula': 'formula',
      'mixto': 'mixed', 'combinado': 'mixed',
    };
    const apiType = typeMap[feedingType.toLowerCase()] || 'bottle';

    try {
      await apiCall(handlerInput, 'POST', '/tracking/feedings', {
        baby_id: babyId,
        type: apiType,
        amount_oz: amount,
        started_at: new Date().toISOString(),
      });

      let speech = `Listo. Registré una toma`;
      if (amount) speech += ` de ${amount} onzas`;
      speech += ` de ${apiType === 'breast' ? 'pecho' : apiType === 'formula' ? 'fórmula' : 'biberón'} para ${babyName}.`;

      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt('¿Deseas registrar algo más?')
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('No pude registrar la toma. Intenta de nuevo.')
        .getResponse();
    }
  },
};

// Log Sleep
const LogSleepIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LogSleepIntent';
  },
  async handle(handlerInput) {
    const babyId = getBabyId(handlerInput);
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const babyName = sessionAttributes.babyName || 'el bebé';

    if (!babyId) {
      return handlerInput.responseBuilder
        .speak('Primero abre bebio steps para seleccionar un bebé.')
        .getResponse();
    }

    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const hours = slots.hours?.value ? parseFloat(slots.hours.value) : 2;
    const quality = slots.quality?.value || null;

    const qualityMap = {
      'bien': 'good', 'bueno': 'good',
      'regular': 'fair', 'normal': 'fair',
      'mal': 'poor', 'malo': 'poor', 'inquieto': 'restless',
    };

    const startTime = new Date(Date.now() - hours * 3600000);

    try {
      await apiCall(handlerInput, 'POST', '/tracking/sleep', {
        baby_id: babyId,
        started_at: startTime.toISOString(),
        ended_at: new Date().toISOString(),
        quality: quality ? (qualityMap[quality.toLowerCase()] || 'good') : null,
      });

      return handlerInput.responseBuilder
        .speak(`Perfecto. Registré ${hours} horas de sueño para ${babyName}.`)
        .reprompt('¿Algo más?')
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('No pude registrar el sueño. Intenta de nuevo.')
        .getResponse();
    }
  },
};

// Log Mood
const LogMoodIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LogMoodIntent';
  },
  async handle(handlerInput) {
    const babyId = getBabyId(handlerInput);
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const babyName = sessionAttributes.babyName || 'el bebé';

    if (!babyId) {
      return handlerInput.responseBuilder
        .speak('Primero abre bebio steps.')
        .getResponse();
    }

    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const mood = slots.mood?.value || 'calm';

    const moodMap = {
      'feliz': 'happy', 'contento': 'happy',
      'tranquilo': 'calm', 'calmado': 'calm',
      'inquieto': 'fussy', 'intranquilo': 'fussy',
      'llorando': 'crying', 'llora': 'crying',
      'somnoliento': 'sleepy', 'cansado': 'sleepy',
      'juguetón': 'playful', 'activo': 'playful',
      'irritable': 'irritable', 'molesto': 'irritable',
      'enfermo': 'sick', 'malito': 'sick',
    };

    try {
      await apiCall(handlerInput, 'POST', '/tracking/moods', {
        baby_id: babyId,
        mood: moodMap[mood.toLowerCase()] || 'calm',
        recorded_at: new Date().toISOString(),
      });

      return handlerInput.responseBuilder
        .speak(`Registrado. ${babyName} está ${mood}.`)
        .reprompt('¿Algo más?')
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('No pude registrar el estado de ánimo.')
        .getResponse();
    }
  },
};

// Log Symptom
const LogSymptomIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LogSymptomIntent';
  },
  async handle(handlerInput) {
    const babyId = getBabyId(handlerInput);
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const babyName = sessionAttributes.babyName || 'el bebé';

    if (!babyId) {
      return handlerInput.responseBuilder
        .speak('Primero abre bebio steps.')
        .getResponse();
    }

    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const symptom = slots.symptom?.value || 'síntoma general';
    const temperature = slots.temperature?.value ? parseFloat(slots.temperature.value) : null;

    try {
      await apiCall(handlerInput, 'POST', '/tracking/symptoms', {
        baby_id: babyId,
        symptom_type: symptom,
        severity: temperature && temperature >= 38.5 ? 'severe' : temperature >= 37.5 ? 'moderate' : 'mild',
        temperature: temperature,
        recorded_at: new Date().toISOString(),
      });

      let speech = `Registré síntoma de ${symptom} para ${babyName}`;
      if (temperature) speech += ` con temperatura de ${temperature} grados`;
      speech += '.';

      if (temperature && temperature >= 38.5) {
        speech += ' La temperatura es alta. Te recomiendo consultar con el pediatra.';
      }

      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt('¿Algo más?')
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('No pude registrar el síntoma.')
        .getResponse();
    }
  },
};

// Log Medicine
const LogMedicineIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LogMedicineIntent';
  },
  async handle(handlerInput) {
    const babyId = getBabyId(handlerInput);
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const babyName = sessionAttributes.babyName || 'el bebé';

    if (!babyId) {
      return handlerInput.responseBuilder
        .speak('Primero abre bebio steps.')
        .getResponse();
    }

    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const medicineName = slots.medicineName?.value || 'medicina';
    const dosage = slots.dosage?.value || '';

    try {
      await apiCall(handlerInput, 'POST', '/tracking/medicines', {
        baby_id: babyId,
        name: medicineName,
        dosage: dosage || 'según indicación',
        dosage_unit: 'ml',
        administered_at: new Date().toISOString(),
      });

      let speech = `Registré ${medicineName}`;
      if (dosage) speech += ` ${dosage} mililitros`;
      speech += ` para ${babyName}.`;

      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt('¿Algo más?')
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('No pude registrar la medicina.')
        .getResponse();
    }
  },
};

// Get Daily Summary
const GetSummaryIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetSummaryIntent';
  },
  async handle(handlerInput) {
    const babyId = getBabyId(handlerInput);
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const babyName = sessionAttributes.babyName || 'el bebé';

    if (!babyId) {
      return handlerInput.responseBuilder
        .speak('Primero abre bebio steps.')
        .getResponse();
    }

    try {
      const data = await apiCall(handlerInput, 'GET', `/tracking/summary/${babyId}`);
      const s = data.summary;

      let speech = `Resumen de hoy para ${babyName}: `;
      speech += `Ha tomado ${s.feedings.total_oz.toFixed(1)} onzas en ${s.feedings.count} tomas. `;
      speech += `Ha dormido ${s.sleep.total_hours.toFixed(1)} horas. `;

      if (s.meals.count > 0) {
        speech += `Ha tenido ${s.meals.count} comida${s.meals.count > 1 ? 's' : ''} sólida${s.meals.count > 1 ? 's' : ''}. `;
      }

      if (s.symptoms.count > 0) {
        speech += `Tiene ${s.symptoms.count} síntoma${s.symptoms.count > 1 ? 's' : ''} activo${s.symptoms.count > 1 ? 's' : ''}. `;
      }

      // Goal progress
      if (s.goal_progress && s.goal_progress.length > 0) {
        const unmetGoals = s.goal_progress.filter((g) => !g.met);
        if (unmetGoals.length > 0) {
          speech += 'Metas pendientes: ';
          unmetGoals.forEach((g) => {
            if (g.goal_type === 'feeding_oz') {
              speech += `Le faltan ${(g.target_value - g.current_value).toFixed(1)} onzas para la meta de alimentación. `;
            } else if (g.goal_type === 'sleep_hours') {
              speech += `Le faltan ${(g.target_value - g.current_value).toFixed(1)} horas para la meta de sueño. `;
            }
          });
        } else {
          speech += 'Todas las metas del día se han cumplido. ¡Excelente! ';
        }
      }

      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt('¿Deseas saber algo más?')
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('No pude obtener el resumen. Intenta de nuevo.')
        .getResponse();
    }
  },
};

// Get Feeding Total
const GetFeedingTotalIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetFeedingTotalIntent';
  },
  async handle(handlerInput) {
    const babyId = getBabyId(handlerInput);
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const babyName = sessionAttributes.babyName || 'el bebé';

    if (!babyId) {
      return handlerInput.responseBuilder
        .speak('Primero abre bebio steps.')
        .getResponse();
    }

    try {
      const data = await apiCall(handlerInput, 'GET', `/tracking/feedings/${babyId}`);
      const total = data.daily_total;

      return handlerInput.responseBuilder
        .speak(`${babyName} ha tomado ${total.total_oz.toFixed(1)} onzas en ${total.count} tomas hoy.`)
        .reprompt('¿Algo más?')
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('No pude obtener la información de alimentación.')
        .getResponse();
    }
  },
};

// Get Sleep Total
const GetSleepTotalIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetSleepTotalIntent';
  },
  async handle(handlerInput) {
    const babyId = getBabyId(handlerInput);
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const babyName = sessionAttributes.babyName || 'el bebé';

    if (!babyId) {
      return handlerInput.responseBuilder
        .speak('Primero abre bebio steps.')
        .getResponse();
    }

    try {
      const data = await apiCall(handlerInput, 'GET', `/tracking/sleep/${babyId}`);
      const total = data.daily_total;

      return handlerInput.responseBuilder
        .speak(`${babyName} ha dormido ${total.total_hours.toFixed(1)} horas hoy en ${total.count} siesta${total.count !== 1 ? 's' : ''}.`)
        .reprompt('¿Algo más?')
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('No pude obtener la información de sueño.')
        .getResponse();
    }
  },
};

// Get Last Feeding
const GetLastFeedingIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetLastFeedingIntent';
  },
  async handle(handlerInput) {
    const babyId = getBabyId(handlerInput);
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const babyName = sessionAttributes.babyName || 'el bebé';

    if (!babyId) {
      return handlerInput.responseBuilder
        .speak('Primero abre bebio steps.')
        .getResponse();
    }

    try {
      const data = await apiCall(handlerInput, 'GET', `/tracking/feedings/${babyId}?limit=1`);

      if (data.feedings.length === 0) {
        return handlerInput.responseBuilder
          .speak(`No hay tomas registradas hoy para ${babyName}.`)
          .getResponse();
      }

      const lastFeeding = data.feedings[0];
      const feedingTime = new Date(lastFeeding.started_at);
      const minutesAgo = Math.round((Date.now() - feedingTime.getTime()) / 60000);

      let timeText;
      if (minutesAgo < 60) {
        timeText = `hace ${minutesAgo} minutos`;
      } else {
        const hours = Math.floor(minutesAgo / 60);
        const mins = minutesAgo % 60;
        timeText = `hace ${hours} hora${hours > 1 ? 's' : ''}${mins > 0 ? ` y ${mins} minutos` : ''}`;
      }

      let speech = `La última toma de ${babyName} fue ${timeText}`;
      if (lastFeeding.amount_oz) speech += `, ${lastFeeding.amount_oz} onzas`;
      speech += '.';

      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt('¿Algo más?')
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('No pude obtener la información.')
        .getResponse();
    }
  },
};

// Get Goal Progress
const GetGoalProgressIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetGoalProgressIntent';
  },
  async handle(handlerInput) {
    const babyId = getBabyId(handlerInput);
    const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const babyName = sessionAttributes.babyName || 'el bebé';

    if (!babyId) {
      return handlerInput.responseBuilder
        .speak('Primero abre bebio steps.')
        .getResponse();
    }

    try {
      const data = await apiCall(handlerInput, 'GET', `/tracking/summary/${babyId}`);
      const goals = data.summary.goal_progress;

      if (!goals || goals.length === 0) {
        return handlerInput.responseBuilder
          .speak(`No hay metas configuradas para ${babyName}. Configúralas desde la app.`)
          .getResponse();
      }

      let speech = `Progreso de metas para ${babyName}: `;
      goals.forEach((g) => {
        if (g.goal_type === 'feeding_oz') {
          speech += `Alimentación: ${g.current_value.toFixed(1)} de ${g.target_value} onzas, ${g.percentage}%. `;
        } else if (g.goal_type === 'sleep_hours') {
          speech += `Sueño: ${g.current_value.toFixed(1)} de ${g.target_value} horas, ${g.percentage}%. `;
        } else if (g.goal_type === 'meals_count') {
          speech += `Comidas: ${g.current_value} de ${g.target_value}, ${g.percentage}%. `;
        }
        speech += g.met ? 'Meta cumplida. ' : 'Pendiente. ';
      });

      return handlerInput.responseBuilder
        .speak(speech)
        .reprompt('¿Algo más?')
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('No pude obtener el progreso de las metas.')
        .getResponse();
    }
  },
};

// Built-in Handlers
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speech = 'Con BebIO Steps puedes: registrar tomas diciendo "registra una toma de 4 onzas", ' +
      'registrar sueño diciendo "el bebé durmió 2 horas", ' +
      'consultar el resumen del día diciendo "cómo va el día", ' +
      'registrar estado de ánimo diciendo "el bebé está feliz", ' +
      'registrar síntomas diciendo "el bebé tiene fiebre", ' +
      'o consultar las metas diciendo "cómo van las metas". ¿Qué deseas hacer?';

    return handlerInput.responseBuilder
      .speak(speech)
      .reprompt('¿Qué deseas hacer?')
      .getResponse();
  },
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('¡Hasta luego! Cuida mucho a tu bebé.')
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error('Error handled:', error.message);

    return handlerInput.responseBuilder
      .speak('Lo siento, hubo un error. Intenta de nuevo.')
      .reprompt('¿Puedes repetirlo?')
      .getResponse();
  },
};

// Skill Builder
const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    LogFeedingIntentHandler,
    LogSleepIntentHandler,
    LogMoodIntentHandler,
    LogSymptomIntentHandler,
    LogMedicineIntentHandler,
    GetSummaryIntentHandler,
    GetFeedingTotalIntentHandler,
    GetSleepTotalIntentHandler,
    GetLastFeedingIntentHandler,
    GetGoalProgressIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
