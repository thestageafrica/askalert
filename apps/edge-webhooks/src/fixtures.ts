export const whatsappMessagePayload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_ID',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '15550001111', phone_number_id: 'PNID' },
            contacts: [{ profile: { name: 'Buyer' }, wa_id: '2348011111111' }],
            messages: [
              {
                from: '2348011111111',
                id: 'wamid.MESSAGE_1',
                timestamp: '1710000000',
                type: 'text',
                text: { body: 'I need a shortlet in Lekki' },
              },
            ],
          },
        },
      ],
    },
  ],
};

export const whatsappStatusOnlyPayload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_ID',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            statuses: [
              { id: 'wamid.STATUS_SENT', status: 'sent', timestamp: '1710000001' },
              { id: 'wamid.STATUS_DELIVERED', status: 'delivered', timestamp: '1710000002' },
              { id: 'wamid.STATUS_READ', status: 'read', timestamp: '1710000003' },
            ],
          },
        },
      ],
    },
  ],
};

export const whatsappFailedStatusPayload = {
  object: 'whatsapp_business_account',
  entry: [
    {
      id: 'WABA_ID',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            statuses: [
              {
                id: 'wamid.STATUS_FAILED',
                status: 'failed',
                timestamp: '1710000004',
                errors: [{ code: 131026 }],
              },
            ],
          },
        },
      ],
    },
  ],
};

export const paystackChargeSuccessPayload = {
  event: 'charge.success',
  data: {
    id: 123456,
    reference: 'askalert_demo_ref',
    amount: 12850000,
    currency: 'NGN',
  },
};
