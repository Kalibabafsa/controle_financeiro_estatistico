// Stub de envio de e-mail. Sem provedor configurado no MVP, apenas loga em
// desenvolvimento (nunca loga senha/token em claro em produção — RSP/seguranca.md).
// Troque por um provedor real (ex.: Resend/SendGrid) configurando EMAIL_PROVIDER_API_KEY.
export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`[email:dev] Link de redefinição de senha para ${email}: ${resetLink}`);
    return;
  }
  // TODO: integrar provedor de e-mail real via process.env.EMAIL_PROVIDER_API_KEY.
}
