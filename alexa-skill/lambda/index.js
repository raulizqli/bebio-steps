/**
 * BebIO Steps - Alexa Skill Lambda Handler (Alternative Deployment)
 * 
 * This Lambda function can be used as an alternative to the webhook endpoint
 * in the NestJS backend. It forwards Alexa requests to the backend API.
 * 
 * For production, you can either:
 * 1. Use the NestJS webhook endpoint directly (recommended)
 * 2. Deploy this Lambda function that proxies to your backend
 */

const https = require('https');
const http = require('http');

// Configure your backend API URL
const API_BASE_URL = process.env.API_BASE_URL || 'https://your-api-domain.com';

exports.handler = async (event, context) => {
  console.log('Alexa Request:', JSON.stringify(event, null, 2));

  try {
    const response = await makeRequest(`${API_BASE_URL}/api/v1/alexa/webhook`, event);
    console.log('Backend Response:', JSON.stringify(response, null, 2));
    return response;
  } catch (error) {
    console.error('Error:', error);
    return buildErrorResponse('Lo siento, hubo un error al procesar tu solicitud. Intenta de nuevo más tarde.');
  }
};

function makeRequest(url, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function buildErrorResponse(message) {
  return {
    version: '1.0',
    response: {
      outputSpeech: {
        type: 'PlainText',
        text: message,
      },
      shouldEndSession: true,
    },
  };
}
