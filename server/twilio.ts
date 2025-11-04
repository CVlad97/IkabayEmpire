import twilio from 'twilio';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.account_sid || !connectionSettings.settings.api_key || !connectionSettings.settings.api_key_secret)) {
    throw new Error('Twilio not connected');
  }
  return {
    accountSid: connectionSettings.settings.account_sid,
    apiKey: connectionSettings.settings.api_key,
    apiKeySecret: connectionSettings.settings.api_key_secret,
    phoneNumber: connectionSettings.settings.phone_number,
    authToken: connectionSettings.settings.auth_token || connectionSettings.settings.api_key_secret
  };
}

export async function getTwilioClient() {
  const { accountSid, apiKey, apiKeySecret } = await getCredentials();
  return twilio(apiKey, apiKeySecret, {
    accountSid: accountSid
  });
}

export async function getTwilioFromPhoneNumber() {
  const { phoneNumber } = await getCredentials();
  return phoneNumber;
}

export async function sendWhatsAppMessage(to: string, body: string) {
  const client = await getTwilioClient();
  const from = await getTwilioFromPhoneNumber();
  
  return await client.messages.create({
    from: `whatsapp:${from}`,
    to: `whatsapp:${to}`,
    body
  });
}

export async function sendWhatsAppMedia(to: string, body: string, mediaUrl: string) {
  const client = await getTwilioClient();
  const from = await getTwilioFromPhoneNumber();
  
  return await client.messages.create({
    from: `whatsapp:${from}`,
    to: `whatsapp:${to}`,
    body,
    mediaUrl: [mediaUrl]
  });
}

export async function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, any>
): Promise<boolean> {
  try {
    // Get auth token from Twilio connector
    const { authToken } = await getCredentials();
    
    // Use Twilio's built-in signature validation
    // This validates the X-Twilio-Signature header using HMAC-SHA1
    const isValid = twilio.validateRequest(
      authToken,
      signature,
      url,
      params
    );
    
    return isValid;
  } catch (error) {
    console.error("Error validating Twilio signature:", error);
    return false;
  }
}
