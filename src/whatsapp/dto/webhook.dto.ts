export class WebhookVerificationDto {
  'hub.mode': string;
  'hub.verify_token': string;
  'hub.challenge': string;
}

export class WhatsAppMessageDto {
  object: string;
  entry: WhatsAppEntry[];
}

export class WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export class WhatsAppChange {
  value: WhatsAppValue;
  field: string;
}

export class WhatsAppValue {
  messaging_product: string;
  metadata: WhatsAppMetadata;
  contacts?: WhatsAppContact[];
  messages?: WhatsAppMessage[];
  statuses?: WhatsAppStatus[];
}

export class WhatsAppMetadata {
  display_phone_number: string;
  phone_number_id: string;
}

export class WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export class WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'button' | 'image' | 'document';
  text?: {
    body: string;
  };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
  button?: {
    text: string;
    payload: string;
  };
}

export class WhatsAppStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}
