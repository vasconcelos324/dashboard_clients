"use client"



import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Header from '@/components/header';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Calendar, CreditCard, DollarSign, Loader2, Phone, User } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { formatCurrency, handleCurrencyInput, maskedToNumber } from '@/utils';



const formSchema = z.object({
  nome: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
  opcoes_credito: z.string().min(2, { message: 'Selecione uma opção de crédito' }),
  valorInicial: z.string().min(1, { message: 'Valor inicial é obrigatório' }),
  qntParcelas: z.string().min(1, { message: 'Quantidade de parcelas é obrigatória' }),
  valorParcelas: z.string().min(1, { message: 'Valor das parcelas é obrigatório' }),
  dataInicio: z.string().min(1, { message: 'Data é obrigatória' }),
  telefone: z.string().min(10, { message: 'Telefone deve ter pelo menos 10 dígitos' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function RegisterCredit() {

  const [valorInicialMask, setValorInicialMask] = useState('');
  const [valorParcelasMask, setValorParcelasMask] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      opcoes_credito: '',
      valorInicial: '',
      qntParcelas: '',
      valorParcelas: '',
      dataInicio: '',
      telefone: '',
    },
  });

  const valorInicial = maskedToNumber(valorInicialMask);
  const valorParcelas = maskedToNumber(valorParcelasMask);
  const qntParcelas = Number(useWatch({
    control: form.control,
    name: 'qntParcelas'
  })) || 0;
  const dataInicio = useWatch({
    control: form.control,
    name: 'dataInicio'
  });

  const valorTotal = valorParcelas * qntParcelas;
  const valorJuros = valorTotal - valorInicial;
  const taxaJuros = valorInicial > 0 ? (valorJuros / valorInicial) * 100 : 0;


  const dataEntrega = dataInicio && qntParcelas > 0
    ? new Date(new Date(dataInicio).setMonth(new Date(dataInicio).getMonth() + qntParcelas)).toISOString().split("T")[0]
    : '';

  useEffect(() => {
    form.setValue('valorInicial', valorInicialMask);
  }, [valorInicialMask, form]);

  useEffect(() => {
    form.setValue('valorParcelas', valorParcelasMask);
  }, [valorParcelasMask, form]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const inicial = maskedToNumber(values.valorInicial);
      const parcela = maskedToNumber(values.valorParcelas);
      const total = parcela * qntParcelas;
      const juros = total - inicial;
      const taxa = inicial > 0 ? (juros / inicial) * 100 : 0;
      const telefoneLimpo = values.telefone.replace(/\D/g, '');

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'credit',
          data: {
            ...values,
            telefone: telefoneLimpo,
            valorInicial: inicial,
            valorParcelas: parcela,
            valorJuros: juros,
            valorTotal: total,
            txJuros: taxa,
            dataEntrega,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || 'Erro ao salvar cliente');
      } else {
        toast.success('Cliente adicionado com sucesso!', {
          description: `${values.nome} foi registrado com ${qntParcelas} parcelas.`,
        });
        setValorInicialMask('');
        setValorParcelasMask('');
        form.reset();
      }
    } catch {
      toast.error('Erro inesperado. Tente novamente.');
    }
    setIsSubmitting(false);
  }


  return (
    <>
      <div className='min-h-screen flex flex-col'>
        <Header />
        <div className='flex flex-col md:flex-row flex-1'>
          <div className='hidden md:block md:w-1/2 relative '>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1"
            >
              <Image
                src="/credit.webp"
                alt="register/credit"
                fill
                className="object-cover"
                priority
              />
            </motion.div>
          </div>
          <div className='w-full md:w-1/2 flex flex-col p-4 space-y-1 overflow-y-auto'>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1"
            >
              <Card className='shadow-xl border-0 overflow-hidden'>
                <CardHeader className='bg-linear-to-br from-blue-600 to-blue-700 text-white'>
                  <CardTitle className='text-2xl font-bold flex items-center gap-2'>
                    <User className='w-6 h-6' />
                    Novo Credito
                  </CardTitle>
                  <CardDescription className='text-blue-100'>
                    Preencha os dados do novo cliente em parcelamento
                  </CardDescription>
                </CardHeader>
                <CardContent className='p-6 md:p-8'>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormField
                          control={form.control}
                          name="nome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Completo</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                  <Input placeholder="Ex: João Silva" className="pl-10" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='opcoes_credito'
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className='flex items-center gap-2'>Forma do Crediario</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione tipo de crédito..." />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value='Cartao Credito'>
                                    <div className='flex items-center gap-2'>
                                      <CreditCard className='w-4 h-4' />
                                      Cartão de Crédito
                                    </div>
                                  </SelectItem>
                                  <SelectItem value='Dinheiro'>
                                    <div className='flex items-center gap-2'>
                                      <CreditCard className='w-4 h-4' />
                                      Dinheiro
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )} />
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                        <FormField
                          control={form.control}
                          name="valorInicial"
                          render={() => (
                            <FormItem>
                              <FormLabel>Valor do Crediario</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input
                                    placeholder="R$ 0,00"
                                    value={valorInicialMask}
                                    className="h-12 pl-10 text-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-green-500"
                                    onChange={(e) => handleCurrencyInput(e.target.value, setValorInicialMask)}
                                  />
                                  <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-green-600" />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="qntParcelas"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nº de Parcelas</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Calculator className="absolute left-3 top-3 h-4 w-4 text-blue-500" />
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder="5"
                                    className="pl-10"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="valorParcelas"
                          render={() => (
                            <FormItem>
                              <FormLabel>Valor da Parcela</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-purple-500" />
                                  <Input
                                    value={valorParcelasMask}
                                    onChange={(e) => handleCurrencyInput(e.target.value, setValorParcelasMask)}
                                    placeholder="R$ 0,00"
                                    className="pl-10 font-medium"
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                        <div>
                          <Label className="text-xs text-slate-500">Total a Pagar</Label>
                          <p className="text-xl font-bold text-blue-600">{formatCurrency(valorTotal)}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-500">Juros Totais</Label>
                          <p className="text-xl font-bold text-orange-600"> {formatCurrency(valorJuros)} </p>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-500">Taxa de Juros</Label>
                          <p className="text-xl font-bold text-pink-600">{taxaJuros.toFixed(2)}% </p>
                        </div>
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
                        <FormField
                          control={form.control}
                          name="telefone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Telefone</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                  <Input placeholder="(11) 99999-9999" className="pl-10" {...field}
                                    onChange={(e) => {
                                      let value = e.target.value.replace(/\D/g, '');
                                      if (value.length <= 11) {
                                        value = value.replace(/(\d{2})(\d)/, '($1) $2');
                                        value = value.replace(/(\d{5})(\d)/, '$1-$2');
                                        field.onChange(value);
                                      }
                                    }} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="dataInicio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel> Data Inicial</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                  <Input type="date"{...field} className='pl-10' />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div>
                          <Label className="flex items-center gap-2 text-purple-700 font-semibold">
                            <Calendar className="w-4 h-4" /> Previsão de Entrega
                          </Label>
                          <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                            <p className="text-lg font-medium text-purple-700">
                              {dataEntrega ? format(parseISO(dataEntrega), 'dd/MM/yyyy') : '--/--/----'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 text-lg font-semibold bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg transition-all duration-300"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Adicionando...
                          </>
                        ) : (
                          'Adicionar Cliente'
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

            </motion.div>
          </div>
        </div>
      </div >
      <Toaster position="bottom-left" richColors />

    </>
  );
}