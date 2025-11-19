"use client"


import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format, parseISO } from 'date-fns';
import { Calendar, DollarSign, Phone, User, ShoppingBag, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import Header from '@/components/header';
import Image from 'next/image';
import { formatCurrencyRegister, toNumber } from '@/utils';
import { Toaster } from '@/components/ui/sonner';


const formSchema = z.object({
    nome: z.string().min(2, 'Nome muito curto'),
    valorInicial: z.string().min(1, 'Informe o valor inicial'),
    valorJuros: z.string().min(1, 'Informe os juros'),
    telefone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Telefone inválido'),
    dataInicial: z.string().min(1, 'Selecione a data'),

});

type FormValues = z.infer<typeof formSchema>;

export default function RegisterClients() {
    const [valorInicial, setValorInicial] = useState('R$ 0,00');
    const [valorJuros, setValorJuros] = useState('R$ 0,00');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nome: '',
            valorInicial: '',
            valorJuros: '',
            telefone: '',
            dataInicial: '',

        },
    });


    const valorTotal = toNumber(valorInicial) + toNumber(valorJuros)

    const data = useWatch({
        control: form.control,
        name: "dataInicial",
    });
    const dataEntrega =
        data && data
            ? new Date(new Date(data).setMonth(new Date(data).getMonth() + 1))
                .toISOString()
                .split("T")[0]
            : ""

    const onSubmit = async (values: FormValues) => {
        setIsSubmitting(true);
        try {
            const receita = toNumber(values.valorInicial)
            const juros = toNumber(values.valorJuros)
            const telefoneLimpo = values.telefone.replace(/\D/g, '');

            const saldo = receita + juros

            const res = await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'client',
                    data: {
                        ...values,
                        telefone: telefoneLimpo,
                        valorInicial: receita,
                        valorJuros: juros,
                        valorTotal: saldo,
                        dataEntrega: dataEntrega,

                    }
                }),
            })
            const data = await res.json()

            if (!res.ok) {
                toast.error(data?.error || 'Erro ao salvar')
            } else {

                toast.success("Cliente adicionado com sucesso!")
                setValorInicial('')
                setValorJuros('')
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
                                src="clients.webp"
                                alt="register/client"
                                fill
                                className="object-cover"
                                priority
                            />
                        </motion.div>
                    </div>

                    <div className="w-full md:w-1/2 flex flex-col p-4 md:p-6 space-y-8 overflow-y-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="flex-1"
                        >
                            <Card className="shadow-xl border-0 overflow-hidden">
                                <CardHeader className="bg-linear-to-r from-blue-600 to-blue-700 text-white">
                                    <CardTitle className="text-2xl font-bold flex items-center gap-2">
                                        <User className="w-6 h-6" />
                                        Novo Cliente
                                    </CardTitle>
                                    <CardDescription className="text-blue-100">
                                        Preencha os dados do novo cliente mensal
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-6 md:p-8">
                                    <Form {...form}>
                                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

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

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="valorInicial"
                                                    render={() => (
                                                        <FormItem>
                                                            <FormLabel className="flex items-center gap-2">
                                                                <DollarSign className="w-4 h-4" /> Valor Inicial
                                                            </FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Input
                                                                        placeholder="R$ 0,00"
                                                                        value={valorInicial}
                                                                        onChange={(e) => {
                                                                            const formatted = formatCurrencyRegister(e.target.value);
                                                                            setValorInicial(formatted);
                                                                            form.setValue('valorInicial', formatted);
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
                                                    name="valorJuros"
                                                    render={() => (
                                                        <FormItem>
                                                            <FormLabel className="flex items-center gap-2">
                                                                <DollarSign className="w-4 h-4" /> Juros
                                                            </FormLabel>
                                                            <FormControl>
                                                                <div className="relative">
                                                                    <Input
                                                                        placeholder="R$ 0,00"
                                                                        value={valorJuros}
                                                                        onChange={(e) => {
                                                                            const formatted = formatCurrencyRegister(e.target.value);
                                                                            setValorJuros(formatted);
                                                                            form.setValue('valorJuros', formatted);
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
                                                        <ShoppingBag className="w-4 h-4" /> Valor Total
                                                    </Label>
                                                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                        <p className="text-2xl font-bold text-blue-700">
                                                            {new Intl.NumberFormat('pt-BR', {
                                                                style: 'currency',
                                                                currency: 'BRL',
                                                            }).format(valorTotal)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <FormField
                                                    control={form.control}
                                                    name="telefone"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="flex items-center gap-2">
                                                                <Phone className="w-4 h-4" /> Telefone
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="(00) 00000-0000"
                                                                    className="h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500"
                                                                    {...field}
                                                                    onChange={(e) => {
                                                                        let value = e.target.value.replace(/\D/g, '');
                                                                        if (value.length <= 11) {
                                                                            value = value.replace(/(\d{2})(\d)/, '($1) $2');
                                                                            value = value.replace(/(\d{5})(\d)/, '$1-$2');
                                                                            field.onChange(value);
                                                                        }
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>


                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="dataInicial"
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
            </div>
            <Toaster position="bottom-left" richColors />
        </>
    );
}
