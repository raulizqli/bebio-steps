import * as Alexa from "ask-sdk-core";
import axios from "axios";

const API_URL = process.env.API_URL ?? "http://localhost:3001";

type Linked = { amazonUserId: string; token: string; babyId: string };

async function link(amazonUserId: string, code: string): Promise<Linked> {
  const res = await axios.post(`${API_URL}/alexa/link`, { amazonUserId, code });
  return { amazonUserId, token: res.data.token, babyId: res.data.babyId };
}

async function addFeeding(amazonUserId: string, token: string, amountOz: number) {
  await axios.post(`${API_URL}/alexa/feeding`, { amazonUserId, token, amountOz });
}

async function getSummary(amazonUserId: string, token: string) {
  const res = await axios.get(`${API_URL}/alexa/summary`, { params: { amazonUserId, token } });
  return res.data as { ounces: number; feedingCount: number; sleepHours: number };
}

const LaunchRequestHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === "LaunchRequest";
  },
  handle(handlerInput) {
    const speakOutput =
      "Hola. Para vincular, di: vincular con código, seguido del código. Por ejemplo: vincular con código A B C. Luego puedes decir: agrega una toma de cuatro onzas, o: resumen de hoy.";
    return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
  },
};

const LinkBabyIntentHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "LinkBabyIntent"
    );
  },
  async handle(handlerInput) {
    const amazonUserId = handlerInput.requestEnvelope.session?.user.userId ?? "unknown";
    const code = Alexa.getSlotValue(handlerInput.requestEnvelope, "code") ?? "";
    if (!code) {
      return handlerInput.responseBuilder.speak("No escuché el código. Intenta otra vez.").reprompt("Dime el código.").getResponse();
    }
    try {
      const linked = await link(amazonUserId, code.replace(/\s/g, ""));
      const session = handlerInput.attributesManager.getSessionAttributes();
      session.linked = linked;
      handlerInput.attributesManager.setSessionAttributes(session);
      return handlerInput.responseBuilder.speak("Listo. Ya quedó vinculado.").getResponse();
    } catch {
      return handlerInput.responseBuilder.speak("No pude vincular con ese código. Verifica que no haya expirado.").getResponse();
    }
  },
};

const AddFeedingIntentHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AddFeedingIntent"
    );
  },
  async handle(handlerInput) {
    const amountStr = Alexa.getSlotValue(handlerInput.requestEnvelope, "ounces") ?? "";
    const ounces = Number(amountStr);
    const session = handlerInput.attributesManager.getSessionAttributes() as any;
    const linked = session.linked as Linked | undefined;
    if (!linked) return handlerInput.responseBuilder.speak("Primero vincula con un código.").getResponse();
    if (!Number.isFinite(ounces) || ounces <= 0) return handlerInput.responseBuilder.speak("Dime cuántas onzas.").reprompt("¿Cuántas onzas?").getResponse();
    try {
      await addFeeding(linked.amazonUserId, linked.token, ounces);
      return handlerInput.responseBuilder.speak(`Listo. Registré una toma de ${ounces} onzas.`).getResponse();
    } catch {
      return handlerInput.responseBuilder.speak("No pude registrar la toma.").getResponse();
    }
  },
};

const SummaryIntentHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "GetSummaryIntent"
    );
  },
  async handle(handlerInput) {
    const session = handlerInput.attributesManager.getSessionAttributes() as any;
    const linked = session.linked as Linked | undefined;
    if (!linked) return handlerInput.responseBuilder.speak("Primero vincula con un código.").getResponse();
    try {
      const s = await getSummary(linked.amazonUserId, linked.token);
      const speakOutput = `Hoy lleva ${Math.round(s.ounces * 10) / 10} onzas en ${s.feedingCount} tomas, y ${Math.round(s.sleepHours * 10) / 10} horas de sueño.`;
      return handlerInput.responseBuilder.speak(speakOutput).getResponse();
    } catch {
      return handlerInput.responseBuilder.speak("No pude obtener el resumen.").getResponse();
    }
  },
};

const HelpIntentHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    const speakOutput = "Puedes decir: vincular con código, agrega una toma de X onzas, o resumen de hoy.";
    return handlerInput.responseBuilder.speak(speakOutput).reprompt(speakOutput).getResponse();
  },
};

const CancelAndStopIntentHandler: Alexa.RequestHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === "IntentRequest" &&
      (Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.CancelIntent" ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === "AMAZON.StopIntent")
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak("Listo.").getResponse();
  },
};

const ErrorHandler: Alexa.ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak("Hubo un error. Intenta otra vez.").getResponse();
  },
};

export const handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    LinkBabyIntentHandler,
    AddFeedingIntentHandler,
    SummaryIntentHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();

