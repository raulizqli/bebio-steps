# Bebio Steps Alexa Skill

Voice-enabled baby tracking with Amazon Alexa.

## Features

- Log feedings hands-free
- Start/stop sleep tracking
- Record baby's mood
- Get daily summaries
- View feeding and sleep statistics
- Multi-language support (English and Spanish)

## Voice Commands

### English
- "Alexa, ask Baby Steps to log a feeding"
- "Alexa, ask Baby Steps baby ate 4 ounces"
- "Alexa, ask Baby Steps to start sleep tracking"
- "Alexa, ask Baby Steps baby woke up"
- "Alexa, ask Baby Steps baby is happy"
- "Alexa, ask Baby Steps for a daily summary"
- "Alexa, ask Baby Steps how much did baby eat today"

### Spanish
- "Alexa, pide a Pasos del Bebé que registre una toma"
- "Alexa, pide a Pasos del Bebé que el bebé comió 4 onzas"
- "Alexa, pide a Pasos del Bebé que comience el seguimiento del sueño"
- "Alexa, pide a Pasos del Bebé que el bebé está feliz"
- "Alexa, pide a Pasos del Bebé un resumen diario"

## Setup

### Prerequisites
- Amazon Developer Account
- AWS Account for Lambda hosting
- Bebio Steps backend API running

### Installation

1. **Create Alexa Skill**
   - Go to Alexa Developer Console
   - Create a new skill
   - Choose Custom model
   - Upload interaction model from `interactionModels/`

2. **Deploy Lambda Function**
   ```bash
   cd lambda
   npm install
   zip -r function.zip .
   ```

3. **Create AWS Lambda**
   - Create a new Lambda function in AWS Console
   - Upload the function.zip
   - Set environment variable: `API_URL=https://your-api-url.com/api`
   - Copy the Lambda ARN

4. **Link Lambda to Alexa Skill**
   - In Alexa Developer Console, go to Endpoint
   - Paste Lambda ARN
   - Save and build model

5. **Configure Account Linking**
   - Enable Account Linking in Alexa skill settings
   - Set Authorization URI: `https://your-domain.com/oauth/authorize`
   - Set Access Token URI: `https://your-domain.com/oauth/token`
   - Set Client ID and Secret
   - Add redirect URLs from Alexa console

6. **Testing**
   - Use Alexa Developer Console test simulator
   - Test on actual Alexa devices
   - Check CloudWatch logs for debugging

## Architecture

```
User Voice Command
       ↓
   Alexa Device
       ↓
  Alexa Service (NLU)
       ↓
  AWS Lambda Function
       ↓
  Bebio Steps API
       ↓
   MongoDB Database
```

## Intent Handlers

- **LogFeedingIntent**: Records feeding with type, amount, and unit
- **GetFeedingStatsIntent**: Returns daily feeding statistics
- **StartSleepIntent**: Starts sleep session tracking
- **EndSleepIntent**: Ends current sleep session
- **GetSleepStatsIntent**: Returns daily sleep statistics
- **LogMoodIntent**: Records baby's current mood
- **LogSymptomIntent**: Records health symptoms
- **LogMedicationIntent**: Records medication administration
- **GetDailySummaryIntent**: Returns comprehensive daily summary

## Security

- Account linking required for all personal data
- OAuth 2.0 authentication
- JWT tokens for API access
- No sensitive data stored in Alexa skill

## Deployment

```bash
cd lambda
npm install
npm run deploy
```

## Monitoring

- AWS CloudWatch Logs for Lambda execution
- Alexa Analytics Dashboard for usage metrics
- API logs for backend integration

## Troubleshooting

### Common Issues

1. **Account Linking Failed**
   - Verify OAuth configuration
   - Check redirect URIs match
   - Ensure API is accessible

2. **Intent Not Recognized**
   - Rebuild interaction model
   - Check utterance samples
   - Review slot types

3. **API Calls Failing**
   - Verify API_URL environment variable
   - Check Lambda IAM permissions
   - Review CloudWatch logs

## Localization

Currently supported:
- English (en-US)
- Spanish (es-ES)

To add more languages:
1. Create new interaction model in `interactionModels/custom/`
2. Add translations in Lambda handler
3. Update skill.json with new locale

## Privacy

This skill:
- Requires account linking
- Accesses user's baby data
- Does not share data with third parties
- Complies with COPPA and GDPR
