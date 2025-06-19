import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';

// Initialize the Neynar client with proper configuration
const config = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY || '',
});

const neynarClient = new NeynarAPIClient(config);

export interface CrosscastPayload {
  text: string;
  embeds?: string[];
  replyTo?: string;
}

export async function publishCast(
  signerUuid: string,
  payload: CrosscastPayload
) {
  try {
    const { text, embeds = [], replyTo } = payload;
    
    const response = await neynarClient.publishCast({
      signerUuid,
      text,
      embeds: embeds.map(url => ({ url })),
      ...(replyTo && { parent: replyTo }),
    });

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('Error publishing cast:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to publish cast',
    };
  }
}

export async function getSignerStatus(signerUuid: string) {
  try {
    const response = await neynarClient.lookupSigner({ signerUuid });
    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error('Error getting signer status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get signer status',
    };
  }
}