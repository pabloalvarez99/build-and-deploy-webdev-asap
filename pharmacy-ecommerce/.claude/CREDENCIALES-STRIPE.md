# Credenciales de Stripe - CONFIGURADAS ✅

**Fecha**: 2026-01-11  
**Cuenta**: New business sandbox (acct_1RsUUTFWMnoouNk2)  
**Modo**: TEST (sandbox)

---

## 🔑 API Keys

### Secret Key (Backend)
```
sk_test_51RsUUTFWMnoouNk2bXSeQoy6mQZxPS3psEVVk96Kn79wb5UrrFnMp6OwVdGQAPTNUzAfybGakwunAyOq6p8dQwOt00jFKvDWlQ
```

### Publishable Key (Frontend - si se necesita)
```
pk_test_51RsUUTFWMnoouNk2XFitRDJsaR6I4wOMeE0s1kg8NgeqLVQYfLN6GwbEW1RUMfJUei8gGzP73pFOZAcUT3uGY8e900lQ2E4LMi
```

### Webhook Secret
```
whsec_qVUy2U7yeIDWKpM8dyLgLSaXTvAd7KjG
```

---

## 🔗 Webhook Configurado

**URL**: `https://build-and-deploy-webdev-asap-production.up.railway.app/api/webhook/stripe`  
**ID**: `we_1SoXl7FWMnoouNk2g04UxZvY`  
**Eventos**: `checkout.session.completed`  
**Estado**: ✅ Enabled

---

## 📝 Expiración

Las keys expiran el **2026-04-12**. Después de esa fecha necesitarás re-autenticar:
```bash
stripe login
```

---

## ⚠️ PENDIENTE: Configurar en Railway

Necesitas agregar estas variables de entorno en Railway manualmente:

1. Ve a: https://railway.app/project/f9fb341e-dfa9-4e46-aefa-b4fd9115c86d
2. Click en **order-service**
3. Click en **Variables**
4. Agregar:

| Variable | Valor |
|----------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_51RsUUTFWMnoouNk2bXSeQoy6mQZxPS3psEVVk96Kn79wb5UrrFnMp6OwVdGQAPTNUzAfybGakwunAyOq6p8dQwOt00jFKvDWlQ` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_qVUy2U7yeIDWKpM8dyLgLSaXTvAd7KjG` |

5. Click en **Deploy** para aplicar cambios

---

## 🧪 MCP de Stripe

El MCP de Stripe está configurado en Cursor. Reinicia Cursor para activarlo.

**Herramientas disponibles**:
- `balance.read` - Leer balance
- `customers.create/read` - Crear/leer clientes
- `products.create/read` - Crear/leer productos
- `prices.create/read` - Crear/leer precios
- `paymentLinks.create` - Crear links de pago
- `invoices.create/read/update` - Facturas
- `subscriptions.read/update` - Suscripciones
- `refunds.create` - Crear reembolsos
- `disputes.read/update` - Disputas
- `documentation.read` - Buscar en docs de Stripe

---

**Última actualización**: 2026-01-11
