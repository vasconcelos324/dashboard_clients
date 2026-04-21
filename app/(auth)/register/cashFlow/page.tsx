"use client"

import Header from "@/components/header";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import z from "zod";
import { motion } from 'framer-motion';
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Coins, DollarSign, Loader2, ShoppingBag } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { formatCurrencyRegister, toNumber } from "@/utils";



const formSchema = z.object({
  valorEntrada: z.string().min(1, 'Informe o valor entrada'),
  valorSaida: z.string().min(1, 'Informe os saída'),
  periodo: z.string().min(1, 'Selecione a data'),

});

type FormValues = z.infer<typeof formSchema>;



export default function RegisterCachFlow() {
  const [valorEntrada, setValorEntrada] = useState('R$ 0,00');
  const [valorSaida, setValorSaida] = useState('R$ 0,00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valorEntrada: '',
      valorSaida: '',
      periodo: '',
    },
  });

  const valorSaldo = toNumber(valorEntrada) - toNumber(valorSaida)

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const entrada = toNumber(values.valorEntrada)
      const saida = toNumber(values.valorSaida)
      const saldo = entrada + saida

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'cashFlow',
          data: {
            ...values,
            valorEntrada: entrada,
            valorSaida: saida,
            valorSaldo: saldo,
          }
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data?.error || 'Erro ao salvar')
      } else {

        toast.success("Cash Flow adicionado com sucesso!")
        setValorEntrada('')
        setValorSaida('')
        form.reset()
      }

    } catch (err) {
      console.error(err)
      toast.error('Erro de conexão. Tente novamente.')
    }
    setIsSubmitting(false);

  };

  return (
    <>
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex flex-col md:flex-row flex-1">
          <div className="hidden md:block md:w-1/2 relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1"

            >
              <Image
                src="/cashflow.png"
                alt="regsiter/cashflow"
                fill
                className="object-cover"
                priority
              />
            </motion.div>
          </div>
          <div className="w-full md:w-1/2 flex flex-col p-4 md:p-6 space-y-8 overflow-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1"

            >
              <Card className="shadow-xl border-0 overflow-hidden">
                <CardHeader className="bg-linear-to-br from-blue-600 to-blue-700 text-white">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <Coins className="h-6 w-6" />Novo Fluxo de Caixa
                  </CardTitle>
                  <CardDescription className="text-blue-100">Preencha os dados do no fluxo de caixa</CardDescription>
                </CardHeader>
                <CardContent className="p-6 md:p-8">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="valorEntrada"
                        render={() => (
                          <FormItem>
                            <FormLabel>Valor Entrada</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="R$ 0,00"
                                  value={valorEntrada}
                                  onChange={(e) => {
                                    const formatted = formatCurrencyRegister(e.target.value)
                                    setValorEntrada(formatted)
                                    form.setValue('valorEntrada', formatted)
                                  }}
                                  className="h-12 pl-10 text-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-green-500"
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
                        name="valorSaida"
                        render={() => (
                          <FormItem>
                            <FormLabel>Valor Saída</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  placeholder="R$ 0,00"
                                  value={valorSaida}
                                  onChange={(e) => {
                                    const formatted = formatCurrencyRegister(e.target.value)
                                    setValorSaida(formatted)
                                    form.setValue('valorSaida', formatted)
                                  }}
                                  className="h-12 pl-10 text-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-red-500"
                                />
                                <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-red-600" />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div>
                        <Label className="flex items-center gap-2 text-blue-700 font-semibold">
                          <ShoppingBag className="w-4 h-4" />Valor Saldo
                        </Label>
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-2xl font-bold text-blue-700">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(valorSaldo)}
                          </p>
                        </div>
                      </div>
                      <FormField
                        control={form.control}
                        name="periodo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" /> Data Inicial
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type="date"
                                  className="h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
                          'Adicionar Fluxo de Caixa'
                        )}
                      </Button>

                    </form>
                  </Form>

                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        <Toaster position="bottom-left" richColors />
      </div>
    </>
  )
}