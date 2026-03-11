import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Truck, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  Lock,
  QrCode,
  Copy,
  Check,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Schema validation
const checkoutSchema = z.object({
  name: z.string().min(3, 'Nome completo é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  cpf: z.string().min(11, 'CPF inválido'),
  cep: z.string().min(8, 'CEP inválido'),
  street: z.string().min(3, 'Rua é obrigatória'),
  number: z.string().min(1, 'Número é obrigatório'),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, 'Bairro é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  state: z.string().length(2, 'UF inválida'),
  shipping: z.enum(['free', 'sedex']),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

const PRODUCT = {
  name: "Mounjax - Suplemento Avançado para Redução de Peso",
  price: 197.00,
  image: "https://picsum.photos/seed/supplement/400/400",
};

export default function App() {
  const [step, setStep] = useState<'form' | 'payment'>('form');
  const [loadingCep, setLoadingCep] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    setValue, 
    watch, 
    formState: { errors, isValid } 
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shipping: 'free',
    }
  });

  const selectedShipping = watch('shipping');
  const cepValue = watch('cep');

  const shippingPrice = selectedShipping === 'sedex' ? 21.53 : 0;
  const totalPrice = PRODUCT.price + shippingPrice;

  // CEP Lookup
  useEffect(() => {
    const fetchCep = async () => {
      const cleanCep = cepValue?.replace(/\D/g, '');
      if (cleanCep?.length === 8) {
        setLoadingCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
          const data = await response.json();
          if (!data.erro) {
            setValue('street', data.logradouro);
            setValue('neighborhood', data.bairro);
            setValue('city', data.localidade);
            setValue('state', data.uf);
          }
        } catch (error) {
          console.error("Erro ao buscar CEP", error);
        } finally {
          setLoadingCep(false);
        }
      }
    };
    fetchCep();
  }, [cepValue, setValue]);

  const onSubmit = (data: CheckoutFormData) => {
    console.log(data);
    setStep('payment');
  };

  const copyPix = () => {
    navigator.clipboard.writeText("00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3-a456-4266141740005204000053039865802BR5913NOME RECEBEDOR6008BRASILIA62070503***63041D3D");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#201b44]">
      {/* Header */}
      <header className="border-b border-white/10 py-3 sticky top-0 bg-[#1e173f] z-50 shadow-md">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <img 
            src="https://i.ibb.co/84jLpqqs/image.png" 
            alt="Logo" 
            className="h-8 w-auto"
            referrerPolicy="no-referrer"
          />
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck size={16} />
            <span>Ambiente Seguro</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div 
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Form */}
              <div className="lg:col-span-7 space-y-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Product Summary Mobile Only */}
                  <div className="lg:hidden bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex gap-4">
                      <img src={PRODUCT.image} alt={PRODUCT.name} className="w-20 h-20 rounded-lg object-cover" />
                      <div>
                        <h3 className="font-bold text-sm leading-tight">{PRODUCT.name}</h3>
                        <p className="text-[#d14d33] font-bold mt-1">R$ {PRODUCT.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>

                  {/* Section: Personal Data */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <div className="bg-[#7462a3] p-1.5 rounded-lg text-white">
                        <User size={18} />
                      </div>
                      <h2 className="font-bold text-lg">Dados Pessoais</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-500 ml-1">Nome Completo</label>
                        <input 
                          {...register('name')}
                          placeholder="Ex: João Silva"
                          className={`w-full p-3 rounded-xl border ${errors.name ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#7462a3]'} outline-none transition-all`}
                        />
                        {errors.name && <span className="text-red-500 text-xs">{errors.name.message}</span>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-gray-500 ml-1">E-mail</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                              {...register('email')}
                              placeholder="seu@email.com"
                              className={`w-full pl-10 p-3 rounded-xl border ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#7462a3]'} outline-none transition-all`}
                            />
                          </div>
                          {errors.email && <span className="text-red-500 text-xs">{errors.email.message}</span>}
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-gray-500 ml-1">WhatsApp / Telefone</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                              {...register('phone')}
                              placeholder="(00) 00000-0000"
                              className={`w-full pl-10 p-3 rounded-xl border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#7462a3]'} outline-none transition-all`}
                            />
                          </div>
                          {errors.phone && <span className="text-red-500 text-xs">{errors.phone.message}</span>}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold uppercase text-gray-500 ml-1">CPF</label>
                        <input 
                          {...register('cpf')}
                          placeholder="000.000.000-00"
                          className={`w-full p-3 rounded-xl border ${errors.cpf ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#7462a3]'} outline-none transition-all`}
                        />
                        {errors.cpf && <span className="text-red-500 text-xs">{errors.cpf.message}</span>}
                      </div>
                    </div>
                  </section>

                  {/* Section: Shipping Address */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <div className="bg-[#7462a3] p-1.5 rounded-lg text-white">
                        <MapPin size={18} />
                      </div>
                      <h2 className="font-bold text-lg">Endereço de Entrega</h2>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-gray-500 ml-1">CEP</label>
                          <div className="relative">
                            <input 
                              {...register('cep')}
                              placeholder="00000-000"
                              className={`w-full p-3 rounded-xl border ${errors.cep ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#7462a3]'} outline-none transition-all`}
                            />
                            {loadingCep && <div className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin rounded-full h-4 w-4 border-2 border-[#7462a3] border-t-transparent"></div>}
                          </div>
                          {errors.cep && <span className="text-red-500 text-xs">{errors.cep.message}</span>}
                        </div>
                      </div>

                      {cepValue?.replace(/\D/g, '').length === 8 && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-xs font-bold uppercase text-gray-500 ml-1">Rua / Logradouro</label>
                              <input 
                                {...register('street')}
                                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-gray-500 ml-1">Número</label>
                              <input 
                                {...register('number')}
                                placeholder="123"
                                className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#7462a3] outline-none"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-gray-500 ml-1">Complemento (Opcional)</label>
                              <input 
                                {...register('complement')}
                                placeholder="Apto, Bloco, etc"
                                className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#7462a3] outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-gray-500 ml-1">Bairro</label>
                              <input 
                                {...register('neighborhood')}
                                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-xs font-bold uppercase text-gray-500 ml-1">Cidade</label>
                              <input 
                                {...register('city')}
                                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold uppercase text-gray-500 ml-1">UF</label>
                              <input 
                                {...register('state')}
                                className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 outline-none"
                              />
                            </div>
                          </div>

                          {/* Shipping Options */}
                          <div className="space-y-3 pt-4">
                            <label className="text-xs font-bold uppercase text-gray-500 ml-1 flex items-center gap-2">
                              <Truck size={14} /> Opções de Frete
                            </label>
                            <div className="grid grid-cols-1 gap-3">
                              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedShipping === 'free' ? 'border-[#7462a3] bg-[#7462a3]/5' : 'border-gray-100 hover:border-gray-200'}`}>
                                <div className="flex items-center gap-3">
                                  <input type="radio" value="free" {...register('shipping')} className="accent-[#7462a3] w-4 h-4" />
                                  <div>
                                    <p className="font-bold text-sm">Frete Grátis</p>
                                    <p className="text-xs text-gray-500">7 a 10 dias úteis</p>
                                  </div>
                                </div>
                                <span className="font-bold text-emerald-600 uppercase text-xs">Grátis</span>
                              </label>
                              <label className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedShipping === 'sedex' ? 'border-[#7462a3] bg-[#7462a3]/5' : 'border-gray-100 hover:border-gray-200'}`}>
                                <div className="flex items-center gap-3">
                                  <input type="radio" value="sedex" {...register('shipping')} className="accent-[#7462a3] w-4 h-4" />
                                  <div>
                                    <p className="font-bold text-sm">Frete SEDEX</p>
                                    <p className="text-xs text-gray-500">2 a 3 dias úteis</p>
                                  </div>
                                </div>
                                <span className="font-bold text-sm text-[#201b44]">R$ 21,53</span>
                              </label>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </section>

                  {/* Section: Payment Method */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <div className="bg-[#7462a3] p-1.5 rounded-lg text-white">
                        <CreditCard size={18} />
                      </div>
                      <h2 className="font-bold text-lg">Forma de Pagamento</h2>
                    </div>
                    <div className="p-4 rounded-xl border-2 border-[#7462a3] bg-[#7462a3]/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          <img src="https://logopng.com.br/logos/pix-106.png" alt="PIX" className="h-6 w-auto" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Pagar via PIX</p>
                          <p className="text-xs text-gray-500">Aprovação imediata e 5% de desconto</p>
                        </div>
                      </div>
                      <CheckCircle2 className="text-[#7462a3]" size={20} />
                    </div>
                  </section>

                  <button 
                    type="submit"
                    className="w-full bg-[#d14d33] hover:bg-[#b8422b] text-white font-bold py-4 rounded-2xl shadow-lg shadow-[#d14d33]/20 flex items-center justify-center gap-2 transition-all group"
                  >
                    FINALIZAR COMPRA
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest pt-4">
                    <div className="flex items-center gap-1">
                      <Lock size={12} />
                      Criptografia SSL
                    </div>
                    <div className="flex items-center gap-1">
                      <ShieldCheck size={12} />
                      Compra Garantida
                    </div>
                  </div>
                </form>
              </div>

              {/* Right Column: Order Summary (Desktop) */}
              <div className="lg:col-span-5">
                <div className="sticky top-24 space-y-6">
                  <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 space-y-6">
                    <h3 className="font-bold text-xl flex items-center gap-2">
                      Resumo do Pedido
                    </h3>
                    
                    <div className="flex gap-4">
                      <div className="relative">
                        <img src={PRODUCT.image} alt={PRODUCT.name} className="w-24 h-24 rounded-2xl object-cover border border-white shadow-sm" />
                        <span className="absolute -top-2 -right-2 bg-[#7462a3] text-white text-[10px] font-bold w-6 h-6 rounded-full flex items-center justify-center">1</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm leading-tight text-gray-700">{PRODUCT.name}</h4>
                        <p className="text-xs text-gray-400 mt-1">Cor: Preto Space</p>
                        <p className="font-bold mt-2">R$ {PRODUCT.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span className="font-semibold">R$ {PRODUCT.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Frete</span>
                        <span className={`font-semibold ${shippingPrice === 0 ? 'text-emerald-600 uppercase text-xs' : ''}`}>
                          {shippingPrice === 0 ? 'Grátis' : `R$ ${shippingPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg pt-3 border-t border-gray-200">
                        <span className="font-bold">Total</span>
                        <span className="font-black text-[#201b44]">R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>

                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-3">
                      <div className="bg-emerald-500 text-white p-1 rounded-full">
                        <Check size={12} />
                      </div>
                      <p className="text-[10px] font-bold text-emerald-700 uppercase leading-tight">
                        Você está economizando R$ 45,00 hoje com esta oferta!
                      </p>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-3 gap-4 px-2">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="bg-gray-50 p-3 rounded-2xl">
                        <ShieldCheck className="text-gray-400" size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Seguro</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="bg-gray-50 p-3 rounded-2xl">
                        <Truck className="text-gray-400" size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Rápido</span>
                    </div>
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="bg-gray-50 p-3 rounded-2xl">
                        <CreditCard className="text-gray-400" size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">Garantido</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="payment"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-4">
                  <Check size={32} />
                </div>
                <h2 className="text-2xl font-black">Pedido Quase Finalizado!</h2>
                <p className="text-gray-500">Realize o pagamento via PIX para confirmar sua compra.</p>
              </div>

              <div className="bg-gray-50 rounded-3xl p-8 border border-gray-100 space-y-6 text-center">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Valor a pagar</p>
                  <p className="text-4xl font-black text-[#201b44]">R$ {totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-inner border border-gray-100 inline-block mx-auto">
                  <QrCode size={200} className="text-[#201b44]" />
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-600">Escaneie o QR Code acima ou copie o código abaixo:</p>
                  
                  <button 
                    onClick={copyPix}
                    className="w-full flex items-center justify-between p-4 bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-[#7462a3] transition-colors group"
                  >
                    <span className="text-xs font-mono truncate mr-4 text-gray-400">00020126580014BR.GOV.BCB.PIX0136123e4567-e89b-12d3...</span>
                    <div className="flex items-center gap-2 text-[#7462a3] font-bold text-sm whitespace-nowrap">
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                      {copied ? 'Copiado!' : 'Copiar Código'}
                    </div>
                  </button>
                </div>

                <div className="pt-4 space-y-3">
                  <div className="flex items-center gap-3 text-left bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="bg-blue-500 text-white p-2 rounded-lg">
                      <QrCode size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-900">Como pagar?</p>
                      <p className="text-[10px] text-blue-700">Abra o app do seu banco, escolha "Pagar via PIX" e escaneie o código ou cole a chave.</p>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setStep('form')}
                className="w-full text-gray-400 font-bold text-sm hover:text-gray-600 transition-colors"
              >
                Voltar e alterar dados
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-4xl mx-auto px-4 py-12 border-t border-gray-100 space-y-12">
        {/* Feedbacks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex items-center gap-1 text-yellow-500">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
            </div>
            <p className="text-sm italic text-gray-600">"Finalmente algo que funciona! Perdi 5kg no primeiro mês com o Mounjax sem passar fome. Recomendo muito!"</p>
            <p className="text-xs font-bold uppercase text-[#1e173f]">— Mariana S., São Paulo</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex items-center gap-1 text-yellow-500">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
            </div>
            <p className="text-sm italic text-gray-600">"O Mounjax me deu a energia que eu precisava para voltar aos treinos. O resultado na balança foi surpreendente."</p>
            <p className="text-xs font-bold uppercase text-[#1e173f]">— Ricardo M., Curitiba</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex items-center gap-1 text-yellow-500">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
            </div>
            <p className="text-sm italic text-gray-600">"Entrega super rápida e o produto é de altíssima qualidade. Sinto meu metabolismo muito mais acelerado."</p>
            <p className="text-xs font-bold uppercase text-[#1e173f]">— Ana Paula K., Rio de Janeiro</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex items-center gap-1 text-yellow-500">
              {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-current" />)}
            </div>
            <p className="text-sm italic text-gray-600">"Estava cética no início, mas o Mounjax realmente cumpre o que promete. Melhor investimento na minha saúde."</p>
            <p className="text-xs font-bold uppercase text-[#1e173f]">— Beatriz L., Belo Horizonte</p>
          </div>
        </div>

        <div className="text-center space-y-6 pt-8 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
            © 2024 Mounjax Official - Todos os direitos reservados.<br />
            CNPJ: 00.000.000/0001-00 | Rua Exemplo, 123 - São Paulo/SP
          </p>
        </div>
      </footer>
    </div>
  );
}
