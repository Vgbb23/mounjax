const FRUITFY_API_URL = process.env.FRUITFY_API_URL || 'https://api.fruitfy.io/api/pix/charge';

const sendJson = (res, statusCode, payload) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.status(statusCode).json(payload);
};

const parseBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string' && req.body.trim()) return JSON.parse(req.body);

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const rawBody = Buffer.concat(chunks).toString('utf-8');
  return rawBody ? JSON.parse(rawBody) : {};
};

const normalizeDigits = (value) => String(value || '').replace(/\D/g, '');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return sendJson(res, 405, { success: false, message: 'Method not allowed' });
  }

  const token = process.env.FRUITFY_TOKEN;
  const storeId = process.env.FRUITFY_STORE_ID;
  const productId = process.env.FRUITFY_PRODUCT_ID;

  if (!token || !storeId || !productId) {
    return sendJson(res, 500, {
      success: false,
      message: 'Variáveis Fruitfy ausentes (FRUITFY_TOKEN, FRUITFY_STORE_ID, FRUITFY_PRODUCT_ID).',
    });
  }

  try {
    const body = await parseBody(req);
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim();
    const cpf = normalizeDigits(body?.cpf);
    const phone = normalizeDigits(body?.phone);
    const amount = Number(body?.amount);
    const utm = body?.utm && typeof body.utm === 'object' ? body.utm : undefined;

    if (!name || !email || cpf.length !== 11 || phone.length < 10 || !Number.isFinite(amount) || amount <= 0) {
      return sendJson(res, 422, {
        success: false,
        message: 'Dados inválidos para gerar cobrança PIX.',
      });
    }

    const response = await fetch(FRUITFY_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Store-Id': storeId,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Language': 'pt_BR',
      },
      body: JSON.stringify({
        name,
        email,
        phone: phone.startsWith('55') ? phone : `55${phone}`,
        cpf,
        items: [
          {
            id: productId,
            value: Math.round(amount),
            quantity: 1,
          },
        ],
        ...(utm ? { utm } : {}),
      }),
    });

    const responseData = await response.json().catch(() => null);
    return sendJson(
      res,
      response.status,
      responseData || { success: false, message: 'Resposta inválida da Fruitfy.' }
    );
  } catch (error) {
    return sendJson(res, 500, {
      success: false,
      message: 'Falha ao gerar cobrança PIX.',
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
};
