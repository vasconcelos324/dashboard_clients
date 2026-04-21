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
import { Calendar, ChartNoAxesColumn, DollarSign, Landmark, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrencyRegister, toNumber } from "@/utils";


const formSchema = z.object({
    instituicao: z.string().min(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
    opcoes_investimento: z.string().min(2, { message: 'Selecione uma opção de investimento' }),
    valorInicial: z.string().min(1, 'Informe o valor inicial'),
    valorTotal: z.string().min(1, 'Informe o valor final'),
    periodo: z.string().min(1, 'Selecione a data'),

});

type FormValues = z.infer<typeof formSchema>;


export default function RegisterInvestment() {

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            instituicao: '',
            opcoes_investimento: '',
            valorInicial: '',
            valorTotal: '',
            periodo: '',
        },
    });

    const [valorInicial, setValorInicial] = useState("R$ 0,00");
    const [valorTotal, setValorTotal] = useState("R$ 0,00");
    const juros = toNumber(valorTotal) - toNumber(valorInicial);
    const tx = toNumber(valorInicial) > 0 ? (juros / toNumber(valorInicial)) * 100 : 0;
    const [isSubmitting, setIsSubmitting] = useState(false);


    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            const receita = toNumber(values.valorInicial)
            const total = toNumber(values.valorTotal)
            const juros = Number((total - receita).toFixed(2))
            const tx = receita > 0 ? Number(((juros / receita) * 100).toFixed(2)) : 0

            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'investment',
                    data: {
                        ...values,
                        valorInicial: receita,
                        valorJuros: juros,
                        valorTotal: total,
                        txJuros: tx

                    }
                }),
            })
            const data = await res.json()

            if (!res.ok) {
                toast.error(data?.error || 'Erro ao salvar')
            } else {
                toast.success("Investimento adicionado com sucesso!")
                setValorInicial('')
                setValorTotal('')
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
                                src="/investment.webp"
                                alt="regsiter/investment"
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
                                        <ChartNoAxesColumn className="h-6 w-6" />Novo Investimento Pessoal
                                    </CardTitle>
                                    <CardDescription className="text-blue-100">Preencha os dados do novo investimento</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8">
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                <FormField
                                                    control={form.control}
                                                    name="instituicao"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Instituição</FormLabel>
                                                            <FormControl>
                                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                    <SelectTrigger>
                                                                        <div className="flex items-center gap-2">
                                                                            <Landmark className="w-4 h-4" />
                                                                            <SelectValue placeholder="Selecione uma opção de instituição" />
                                                                        </div>
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="BCO Inter">Banco Inter</SelectItem>
                                                                        <SelectItem value="BCO Itau">Banco Itaú</SelectItem>
                                                                        <SelectItem value="Caixa">Caixa Econômica</SelectItem>
                                                                        <SelectItem value="CM Capital">CM Capital</SelectItem>
                                                                        <SelectItem value="Especie">Especie</SelectItem>
                                                                        <SelectItem value="Mercado Pago">Mercado Pago</SelectItem>
                                                                        <SelectItem value="Nubank">Nubank</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name='opcoes_investimento'
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className='flex items-center gap-2'>Forma do Crediario</FormLabel>
                                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Selecione opção do investimento" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Acoes">Ações</SelectItem>
                                                                    <SelectItem value="CDI/CDB">CDI/CDB</SelectItem>
                                                                    <SelectItem value="Especie">Especie</SelectItem>
                                                                    <SelectItem value="LCI/LCA">LCI/LCA</SelectItem>
                                                                    <SelectItem value="Poupanca">Poupança</SelectItem>
                                                                    <SelectItem value="Tesouro Direto">Tesouro Direto</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )} />


                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="valorInicial"
                                                render={() => (
                                                    <FormItem>
                                                        <FormLabel>Valor Aplicação</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    placeholder="R$ 0,00"
                                                                    value={valorInicial}
                                                                    onChange={(e) => {
                                                                        const formatted = formatCurrencyRegister(e.target.value)
                                                                        setValorInicial(formatted)
                                                                        form.setValue('valorInicial', formatted)
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

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                                                <div>
                                                    <Label className="text-xs text-slate-500">Valor do Retorno</Label>
                                                    <p className="text-xl font-bold text-orange-600">
                                                        {new Intl.NumberFormat('pt-BR', {
                                                            style: 'currency',
                                                            currency: 'BRL',
                                                        }).format(juros)}</p>
                                                </div>
                                                <div>
                                                    <Label className="text-xs text-slate-500">Taxa de Juros</Label>
                                                    <p className="text-xl font-bold text-pink-600">{tx.toFixed(2)}% </p>
                                                </div>
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="valorTotal"
                                                render={() => (
                                                    <FormItem>
                                                        <FormLabel>Valor Resgate</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Input
                                                                    placeholder="R$ 0,00"
                                                                    value={valorTotal}
                                                                    onChange={(e) => {
                                                                        const formatted = formatCurrencyRegister(e.target.value)
                                                                        setValorTotal(formatted)
                                                                        form.setValue('valorTotal', formatted)
                                                                    }}
                                                                    className="h-12 pl-10 text-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                                                                />
                                                                <DollarSign className="absolute left-3 top-3.5 h-5 w-5 text-blue-600" />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

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
                                                    'Adicionar Investimento'
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