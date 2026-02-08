const Alexa = require('ask-sdk-core');
const axios = require('axios');

const API_URL = process.env.API_URL || 'https://your-api-url.com/api';

// Helper function to get user's auth token from account linking
function getAuthToken(handlerInput) {
  const { accessToken } = handlerInput.requestEnvelope.context.System.user;
  return accessToken;
}

// Helper function to make API calls
async function callAPI(endpoint, method = 'GET', data = null, token = null) {
  const config = {
    method,
    url: `${API_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
}

// Launch Request Handler
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'Welcome to Bebio Steps! You can ask me to log feedings, track sleep, record mood, or get a daily summary. What would you like to do?';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// Log Feeding Intent Handler
const LogFeedingIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LogFeedingIntent';
  },
  async handle(handlerInput) {
    const token = getAuthToken(handlerInput);
    
    if (!token) {
      return handlerInput.responseBuilder
        .speak('Please link your account in the Alexa app to use this feature.')
        .withLinkAccountCard()
        .getResponse();
    }

    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const feedingType = slots.feedingType?.value || 'bottle';
    const amount = slots.amount?.value;
    const unit = slots.unit?.value || 'ounces';

    try {
      // Get user's babies
      const babies = await callAPI('/babies', 'GET', null, token);
      
      if (!babies.babies || babies.babies.length === 0) {
        return handlerInput.responseBuilder
          .speak('You need to create a baby profile in the app first.')
          .getResponse();
      }

      const baby = babies.babies[0];

      // Map feeding type
      const typeMap = {
        'breast': 'breast',
        'bottle': 'bottle',
        'solid': 'solid'
      };

      // Map unit
      const unitMap = {
        'ounces': 'oz',
        'milliliters': 'ml',
        'mililitros': 'ml',
        'onzas': 'oz',
        'servings': 'servings'
      };

      const feedingData = {
        baby: baby._id,
        type: typeMap[feedingType.toLowerCase()] || 'bottle',
        amount: amount ? parseInt(amount) : undefined,
        unit: unitMap[unit.toLowerCase()] || 'oz',
        startTime: new Date().toISOString(),
      };

      await callAPI('/feedings', 'POST', feedingData, token);

      let speakOutput = `I've logged a ${feedingType} feeding`;
      if (amount) {
        speakOutput += ` of ${amount} ${unit}`;
      }
      speakOutput += ' for your baby.';

      return handlerInput.responseBuilder
        .speak(speakOutput)
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('Sorry, I had trouble logging the feeding. Please try again.')
        .getResponse();
    }
  }
};

// Get Feeding Stats Intent Handler
const GetFeedingStatsIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetFeedingStatsIntent';
  },
  async handle(handlerInput) {
    const token = getAuthToken(handlerInput);
    
    if (!token) {
      return handlerInput.responseBuilder
        .speak('Please link your account in the Alexa app to use this feature.')
        .withLinkAccountCard()
        .getResponse();
    }

    try {
      const babies = await callAPI('/babies', 'GET', null, token);
      
      if (!babies.babies || babies.babies.length === 0) {
        return handlerInput.responseBuilder
          .speak('You need to create a baby profile in the app first.')
          .getResponse();
      }

      const baby = babies.babies[0];
      const stats = await callAPI(`/feedings/${baby._id}/stats/daily`, 'GET', null, token);

      const speakOutput = `Today, your baby has had ${stats.feedingCount} feedings, totaling ${stats.totalAmount} ounces.`;

      return handlerInput.responseBuilder
        .speak(speakOutput)
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('Sorry, I had trouble getting the feeding stats. Please try again.')
        .getResponse();
    }
  }
};

// Start Sleep Intent Handler
const StartSleepIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StartSleepIntent';
  },
  async handle(handlerInput) {
    const token = getAuthToken(handlerInput);
    
    if (!token) {
      return handlerInput.responseBuilder
        .speak('Please link your account in the Alexa app to use this feature.')
        .withLinkAccountCard()
        .getResponse();
    }

    try {
      const babies = await callAPI('/babies', 'GET', null, token);
      const baby = babies.babies[0];

      const sleepData = {
        baby: baby._id,
        startTime: new Date().toISOString(),
      };

      await callAPI('/sleep', 'POST', sleepData, token);

      const speakOutput = 'Sleep tracking started. Let me know when baby wakes up.';

      return handlerInput.responseBuilder
        .speak(speakOutput)
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('Sorry, I had trouble starting sleep tracking. Please try again.')
        .getResponse();
    }
  }
};

// Get Sleep Stats Intent Handler
const GetSleepStatsIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetSleepStatsIntent';
  },
  async handle(handlerInput) {
    const token = getAuthToken(handlerInput);
    
    if (!token) {
      return handlerInput.responseBuilder
        .speak('Please link your account in the Alexa app to use this feature.')
        .withLinkAccountCard()
        .getResponse();
    }

    try {
      const babies = await callAPI('/babies', 'GET', null, token);
      const baby = babies.babies[0];
      const stats = await callAPI(`/sleep/${baby._id}/stats/daily`, 'GET', null, token);

      const speakOutput = `Today, your baby has slept ${stats.totalHours} hours in ${stats.sleepCount} sessions.`;

      return handlerInput.responseBuilder
        .speak(speakOutput)
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('Sorry, I had trouble getting the sleep stats. Please try again.')
        .getResponse();
    }
  }
};

// Log Mood Intent Handler
const LogMoodIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LogMoodIntent';
  },
  async handle(handlerInput) {
    const token = getAuthToken(handlerInput);
    
    if (!token) {
      return handlerInput.responseBuilder
        .speak('Please link your account in the Alexa app to use this feature.')
        .withLinkAccountCard()
        .getResponse();
    }

    const slots = handlerInput.requestEnvelope.request.intent.slots;
    const mood = slots.mood?.value || 'calm';
    const intensity = slots.intensity?.value || 5;

    try {
      const babies = await callAPI('/babies', 'GET', null, token);
      const baby = babies.babies[0];

      // Map Spanish moods to English
      const moodMap = {
        'feliz': 'happy',
        'tranquilo': 'calm',
        'inquieto': 'fussy',
        'llorando': 'crying',
        'alerta': 'alert'
      };

      const moodData = {
        baby: baby._id,
        mood: moodMap[mood.toLowerCase()] || mood.toLowerCase(),
        intensity: parseInt(intensity),
        timestamp: new Date().toISOString(),
      };

      await callAPI('/mood', 'POST', moodData, token);

      const speakOutput = `I've recorded that your baby is ${mood}.`;

      return handlerInput.responseBuilder
        .speak(speakOutput)
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('Sorry, I had trouble logging the mood. Please try again.')
        .getResponse();
    }
  }
};

// Get Daily Summary Intent Handler
const GetDailySummaryIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GetDailySummaryIntent';
  },
  async handle(handlerInput) {
    const token = getAuthToken(handlerInput);
    
    if (!token) {
      return handlerInput.responseBuilder
        .speak('Please link your account in the Alexa app to use this feature.')
        .withLinkAccountCard()
        .getResponse();
    }

    try {
      const babies = await callAPI('/babies', 'GET', null, token);
      const baby = babies.babies[0];

      const [feedingStats, sleepStats] = await Promise.all([
        callAPI(`/feedings/${baby._id}/stats/daily`, 'GET', null, token),
        callAPI(`/sleep/${baby._id}/stats/daily`, 'GET', null, token),
      ]);

      const speakOutput = `Here's today's summary for ${baby.name}. ` +
        `Your baby has had ${feedingStats.feedingCount} feedings, totaling ${feedingStats.totalAmount} ounces, ` +
        `and has slept ${sleepStats.totalHours} hours in ${sleepStats.sleepCount} sessions.`;

      return handlerInput.responseBuilder
        .speak(speakOutput)
        .getResponse();
    } catch (error) {
      return handlerInput.responseBuilder
        .speak('Sorry, I had trouble getting the daily summary. Please try again.')
        .getResponse();
    }
  }
};

// Help Intent Handler
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'You can say things like: log a feeding, start sleep tracking, baby is happy, or get daily summary. What would you like to do?';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// Cancel and Stop Intent Handler
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speakOutput = 'Goodbye!';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};

// Session Ended Request Handler
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended: ${JSON.stringify(handlerInput.requestEnvelope)}`);
    return handlerInput.responseBuilder.getResponse();
  }
};

// Error Handler
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    const speakOutput = 'Sorry, I had trouble doing what you asked. Please try again.';
    console.log(`Error handled: ${JSON.stringify(error)}`);

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// Lambda Handler
exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    LogFeedingIntentHandler,
    GetFeedingStatsIntentHandler,
    StartSleepIntentHandler,
    GetSleepStatsIntentHandler,
    LogMoodIntentHandler,
    GetDailySummaryIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
