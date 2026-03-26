import { WebpayPlus, IntegrationCommerceCodes, IntegrationApiKeys } from 'transbank-sdk';

const isProduction = process.env.TRANSBANK_ENVIRONMENT === 'production';

export const webpayTransaction = isProduction
  ? WebpayPlus.Transaction.buildForProduction(
      process.env.TRANSBANK_COMMERCE_CODE!,
      process.env.TRANSBANK_API_KEY!
    )
  : WebpayPlus.Transaction.buildForIntegration(
      IntegrationCommerceCodes.WEBPAY_PLUS,
      IntegrationApiKeys.WEBPAY
    );
