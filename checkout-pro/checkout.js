// Lógica do checkout em JS puro

const DEFAULT_PRODUCT = {
  name: "Mounjax 1 frasco",
  image: "../images/kit1-2.webp",
  price: 37.90,
  quantity: 1
};
const BASE_UNIT_PRICE = 37.90;
const SAVINGS_BY_PACK_UNITS = {
  1: 50.00,
  3: 187.70,
  5: 325.80,
  8: 523.70
};
const SHIPPING_SEDEX = 21.53;
const PIX_API_PROXY_URL = '/api/pix/charge';
const PIX_CODE = "00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-4266141740005204000053039865802BR5913NOME RECEBEDOR6008BRASILIA62070503***63041D3D";

const formStep = document.getElementById('form-step');
const paymentStep = document.getElementById('payment-step');
const checkoutForm = document.getElementById('checkout-form');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const cpfInput = document.getElementById('cpf');
const cepInput = document.getElementById('cep');
const addressFields = document.getElementById('address-fields');
const loadingCep = document.getElementById('loading-cep');
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryShipping = document.getElementById('summary-shipping');
const summaryTotal = document.getElementById('summary-total');
const summarySavings = document.getElementById('summary-savings');
const paymentTotal = document.getElementById('payment-total');
const qtyMinusDesktop = document.getElementById('qty-minus-desktop');
const qtyPlusDesktop = document.getElementById('qty-plus-desktop');
const qtyValueDesktop = document.getElementById('qty-value-desktop');
const qtyMinusMobile = document.getElementById('qty-minus-mobile');
const qtyPlusMobile = document.getElementById('qty-plus-mobile');
const qtyValueMobile = document.getElementById('qty-value-mobile');
const productNameDesktop = document.getElementById('product-name-desktop');
const productNameMobile = document.getElementById('product-name-mobile');
const productImageDesktop = document.getElementById('product-image-desktop');
const productImageMobile = document.getElementById('product-image-mobile');
const productPriceDesktop = document.getElementById('product-price-desktop');
const productPriceMobile = document.getElementById('product-price-mobile');
const productBadgeQuantity = document.getElementById('product-badge-quantity');
const submitOrderBtn = document.getElementById('submit-order-btn');
const submitOrderText = document.getElementById('submit-order-text');
const submitOrderArrow = document.getElementById('submit-order-arrow');
const submitOrderLoading = document.getElementById('submit-order-loading');
const paymentQrImage = document.getElementById('payment-qr-image');
const pixCodePreview = document.getElementById('pix-code-preview');
const copyPixBtn = document.getElementById('copy-pix');
const pixIcon = document.getElementById('pix-icon');
const pixText = document.getElementById('pix-text');
const backToFormBtn = document.getElementById('back-to-form');
let isCepVerified = false;
let currentPixCode = PIX_CODE;

function parsePositiveNumber(rawValue, fallbackValue) {
  const normalized = String(rawValue || '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallbackValue;
}

function parseProductFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('product') || DEFAULT_PRODUCT.name;
  const image = params.get('image') || DEFAULT_PRODUCT.image;
  const price = parsePositiveNumber(params.get('price'), DEFAULT_PRODUCT.price);
  return { name, image, price, quantity: 1 };
}

const currentProduct = parseProductFromQuery();

function getPackUnitsFromName(productName) {
  const match = String(productName || '').match(/(\d+)\s*frasco/i);
  if (!match) return 1;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function formatBRL(value) {
  return 'R$ ' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function getUtmPayload() {
  const params = new URLSearchParams(window.location.search);
  const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const utm = {};
  keys.forEach((key) => {
    const valueFromUrl = params.get(key);
    const storageKey = `utmify:${key}`;
    if (valueFromUrl) {
      sessionStorage.setItem(storageKey, valueFromUrl);
    }
    const value = valueFromUrl || sessionStorage.getItem(storageKey);
    if (value) utm[key] = value;
  });
  return utm;
}

function showAddressFields() {
  addressFields.classList.remove('hidden');
}

function hideAddressFields() {
  addressFields.classList.add('hidden');
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateCPF(cpf) {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += Number(digits[i]) * (10 - i);
  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) firstDigit = 0;
  if (firstDigit !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i += 1) sum += Number(digits[i]) * (11 - i);
  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) secondDigit = 0;
  return secondDigit === Number(digits[10]);
}

function validateCEP(cep) {
  return cep.replace(/\D/g, '').length === 8;
}

function validatePhone(phone) {
  return phone.replace(/\D/g, '').length >= 10;
}

function showError(id, msg) {
  const el = document.getElementById('error-' + id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function hideError(id) {
  const el = document.getElementById('error-' + id);
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function formatCEP(value) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function formatCPF(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function updateSummary() {
  currentProduct.quantity = Math.max(1, Math.min(5, Math.floor(currentProduct.quantity)));
  qtyValueDesktop.textContent = String(currentProduct.quantity);
  qtyValueMobile.textContent = String(currentProduct.quantity);
  productBadgeQuantity.textContent = String(currentProduct.quantity);

  productNameDesktop.textContent = currentProduct.name;
  productNameMobile.textContent = currentProduct.name;
  productImageDesktop.src = currentProduct.image;
  productImageMobile.src = currentProduct.image;
  productImageDesktop.alt = currentProduct.name;
  productImageMobile.alt = currentProduct.name;
  productPriceDesktop.textContent = formatBRL(currentProduct.price);
  productPriceMobile.textContent = formatBRL(currentProduct.price);

  const shipping = checkoutForm.shipping.value;
  const shippingPrice = shipping === 'sedex' ? SHIPPING_SEDEX : 0;
  summaryShipping.textContent = shippingPrice === 0 ? 'Grátis' : formatBRL(shippingPrice);
  summaryShipping.className = shippingPrice === 0 ? 'font-semibold text-emerald-600 uppercase text-xs' : 'font-semibold';
  const subtotal = currentProduct.price * currentProduct.quantity;
  const total = subtotal + shippingPrice;
  summarySubtotal.textContent = formatBRL(subtotal);
  summaryTotal.textContent = formatBRL(total);
  paymentTotal.textContent = formatBRL(total);

  const packUnits = getPackUnitsFromName(currentProduct.name);
  const fullPrice = packUnits * BASE_UNIT_PRICE;
  const fixedSavings = SAVINGS_BY_PACK_UNITS[packUnits];
  const savingsPerPack = fixedSavings !== undefined ? fixedSavings : Math.max(0, fullPrice - currentProduct.price);
  const savings = savingsPerPack;
  summarySavings.textContent = `Você está economizando ${formatBRL(savings)} hoje com esta oferta!`;
}

function handleCEP(e) {
  e.target.value = formatCEP(e.target.value);
  const cep = e.target.value;
  isCepVerified = false;
  hideError('cep');

  if (validateCEP(cep)) {
    loadingCep.classList.remove('hidden');
    fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`)
      .then(res => res.json())
      .then(data => {
        if (!data.erro) {
          document.getElementById('street').value = data.logradouro || '';
          document.getElementById('neighborhood').value = data.bairro || '';
          document.getElementById('city').value = data.localidade || '';
          document.getElementById('state').value = data.uf || '';
          isCepVerified = true;
          hideError('cep');
          showAddressFields();
        } else {
          isCepVerified = false;
          hideAddressFields();
          showError('cep', 'CEP inválido. Verifique o número informado.');
        }
      })
      .catch(() => {
        isCepVerified = false;
        hideAddressFields();
        showError('cep', 'Não foi possível validar o CEP. Tente novamente.');
      })
      .finally(() => {
        loadingCep.classList.add('hidden');
      });
  } else {
    isCepVerified = false;
    hideError('cep');
    hideAddressFields();
  }
}

function handleShippingChange() {
  updateSummary();
}

function changeQuantity(delta) {
  currentProduct.quantity = Math.max(1, Math.min(5, currentProduct.quantity + delta));
  updateSummary();
}

function setSubmitLoading(isLoading) {
  if (!submitOrderBtn) return;
  submitOrderBtn.disabled = isLoading;
  if (submitOrderText) submitOrderText.classList.toggle('hidden', isLoading);
  if (submitOrderArrow) submitOrderArrow.classList.toggle('hidden', isLoading);
  if (submitOrderLoading) {
    submitOrderLoading.classList.toggle('hidden', !isLoading);
    submitOrderLoading.classList.toggle('flex', isLoading);
  }
}

async function createFruitfyPixCharge() {
  const shipping = checkoutForm.shipping.value;
  const shippingPrice = shipping === 'sedex' ? SHIPPING_SEDEX : 0;
  const subtotal = currentProduct.price * currentProduct.quantity;
  const total = subtotal + shippingPrice;
  const ticketValue = Math.round(total * 100);

  const response = await fetch(PIX_API_PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value,
      cpf: cpfInput.value.replace(/\D/g, ''),
      amount: ticketValue,
      utm: getUtmPayload()
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Falha ao gerar cobrança PIX na Fruitfy.');
  }

  const pix = payload?.data?.pix || {};
  const pixCode = pix.copy_paste || pix.copyPaste || pix.payload || pix.emv || pix.code || '';
  let qrCode = pix.qr_code || pix.qrCode || pix.qrcode || '';

  if (qrCode && !qrCode.startsWith('http') && !qrCode.startsWith('data:image')) {
    qrCode = `data:image/png;base64,${qrCode}`;
  }
  if (!qrCode && pixCode) {
    qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`;
  }
  if (!pixCode) {
    throw new Error('A Fruitfy não retornou código PIX válido.');
  }

  currentPixCode = pixCode;
  pixCodePreview.textContent = `${pixCode.slice(0, 48)}...`;
  if (qrCode) paymentQrImage.src = qrCode;
}

cepInput.addEventListener('input', handleCEP);
phoneInput.addEventListener('input', function (e) {
  e.target.value = formatPhone(e.target.value);
});
cpfInput.addEventListener('input', function (e) {
  e.target.value = formatCPF(e.target.value);
  if (e.target.value.replace(/\D/g, '').length === 11) {
    if (!validateCPF(e.target.value)) {
      showError('cpf', 'CPF inválido. Verifique o número informado.');
    } else {
      hideError('cpf');
    }
  } else {
    hideError('cpf');
  }
});
checkoutForm.shipping.forEach ? checkoutForm.shipping.forEach(r => r.addEventListener('change', handleShippingChange)) : checkoutForm.shipping.addEventListener('change', handleShippingChange);
qtyMinusDesktop.addEventListener('click', function () { changeQuantity(-1); });
qtyPlusDesktop.addEventListener('click', function () { changeQuantity(1); });
qtyMinusMobile.addEventListener('click', function () { changeQuantity(-1); });
qtyPlusMobile.addEventListener('click', function () { changeQuantity(1); });

checkoutForm.addEventListener('submit', function(e) {
  async function submitWithPix() {
    setSubmitLoading(true);
    await createFruitfyPixCharge();
    formStep.classList.add('hidden');
    paymentStep.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  e.preventDefault();
  let valid = true;
  // Validar campos
  if (nameInput.value.trim().length < 3) {
    showError('name', 'Nome completo é obrigatório');
    valid = false;
  } else {
    hideError('name');
  }
  if (!validateEmail(emailInput.value)) {
    showError('email', 'E-mail inválido');
    valid = false;
  } else {
    hideError('email');
  }
  if (!validatePhone(phoneInput.value)) {
    showError('phone', 'Telefone inválido');
    valid = false;
  } else {
    hideError('phone');
  }
  if (!validateCPF(cpfInput.value)) {
    showError('cpf', 'CPF inválido');
    valid = false;
  } else {
    hideError('cpf');
  }
  if (!validateCEP(cepInput.value) || !isCepVerified) {
    showError('cep', 'CEP inválido');
    valid = false;
  } else {
    hideError('cep');
  }
  if (addressFields.classList.contains('hidden')) {
    valid = false;
  }
  if (document.getElementById('street').value.trim().length < 3) {
    showError('street', 'Rua é obrigatória');
    valid = false;
  } else {
    hideError('street');
  }
  if (document.getElementById('number').value.trim().length < 1) {
    showError('number', 'Número é obrigatório');
    valid = false;
  } else {
    hideError('number');
  }
  if (document.getElementById('neighborhood').value.trim().length < 2) {
    showError('neighborhood', 'Bairro é obrigatório');
    valid = false;
  } else {
    hideError('neighborhood');
  }
  if (document.getElementById('city').value.trim().length < 2) {
    showError('city', 'Cidade é obrigatória');
    valid = false;
  } else {
    hideError('city');
  }
  if (document.getElementById('state').value.trim().length !== 2) {
    showError('state', 'UF inválida');
    valid = false;
  } else {
    hideError('state');
  }
  if (!valid) return;
  submitWithPix().catch((error) => {
    const message = error instanceof Error ? error.message : 'Erro ao gerar PIX. Tente novamente.';
    alert(message);
  }).finally(() => {
    setSubmitLoading(false);
  });
});

copyPixBtn.addEventListener('click', function() {
  navigator.clipboard.writeText(currentPixCode);
  pixIcon.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/></svg>';
  pixText.textContent = 'Copiado!';
  setTimeout(() => {
    pixIcon.innerHTML = '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 12H8m8 0l-4-4m4 4l-4 4"/></svg>';
    pixText.textContent = 'Copiar Código';
  }, 2000);
});

if (backToFormBtn) {
  backToFormBtn.addEventListener('click', function() {
    paymentStep.classList.add('hidden');
    formStep.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

updateSummary();
