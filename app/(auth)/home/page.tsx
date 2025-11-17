"use client"

import Header from "@/components/header"
import { useCallback, useEffect, useMemo, useState } from "react"
import { CashFlowData, ClienteData, ControlData, CreditData, InvestmentData, isDateInPeriod } from "@/utils"
import { fetchDataServer } from "@/server"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
} from "recharts";



export default function HomePage() {
    const [cashFlow, setCashFlow] = useState<CashFlowData[]>([])
    const [clients, setClients] = useState<ClienteData[]>([])
    const [credits, setCredits] = useState<CreditData[]>([])
    const [control, setControl] = useState<ControlData[]>([])
    const [investment, setInvestment] = useState<InvestmentData[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedPeriod, setSelectedPeriod] = useState("Todos")
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const { invest, clients, credits, cashFlow, control } = await fetchDataServer()
            setInvestment(invest)
            setClients(clients)
            setCredits(credits)
            setCashFlow(cashFlow)
            setControl(control)


        } catch (err) {
            console.log("Erro ao buscar dados", err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])


    const investGroup = (dados: InvestmentData[]) => {
        const mapa = new Map<string, number>();

        dados.forEach((item) => {
            const tipo = item.opcao_investimento?.trim() || "Outros";
            const valor = Number(item.valor_total) || 0;
            if (valor > 0) {
                mapa.set(tipo, (mapa.get(tipo) || 0) + valor);
            }
        });
        const CORES = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6"];

        return Array.from(mapa.entries())
            .map(([tipo, valor], index) => ({
                tipo,
                valor,
                fill: CORES[index % CORES.length],
            }))
            .sort((a, b) => b.valor - a.valor);
    };

    const filteredCashFlow = useMemo(() => {
        let filtered = cashFlow

        if (selectedPeriod !== "Todos") {
            filtered = filtered.filter((c) =>
                c.periodo && isDateInPeriod(c.periodo, selectedPeriod))
        }
        return filtered
    }, [selectedPeriod, cashFlow])

    const filteredClients = useMemo(() => {
        let filtered = clients

        if (searchTerm) {
            filtered = filtered.filter((c) =>
                c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.telefone?.includes(searchTerm))
        }

        if (selectedPeriod !== "Todos") {
            filtered = filtered.filter((c) =>
                c.data_final && isDateInPeriod(c.data_final, selectedPeriod))
        }
        return filtered
    }, [selectedPeriod, searchTerm, clients])

    const filteredCredits = useMemo(() => {
        let filtered = credits

        if (searchTerm) {
            filtered = filtered.filter((c) =>
                c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.opcoes_credito?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.telefone?.includes(searchTerm))
        }

        if (selectedPeriod !== "Todos") {
            filtered = filtered.filter((c) =>
                c.data_final && isDateInPeriod(c.data_final, selectedPeriod))
        }
        return filtered
    }, [selectedPeriod, searchTerm, credits])

    const filteredInvestiment = useMemo(() => {
        let filtered = investment;

        if (searchTerm) {
            filtered = filtered.filter((c) =>
                c.instituicao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.opcao_investimento?.toLowerCase().includes(searchTerm.toLowerCase())

            );
        }

        if (selectedPeriod !== "Todos") {
            filtered = filtered.filter((i) =>
                i.periodo && isDateInPeriod(i.periodo, selectedPeriod)
            );
        }
        return filtered;
    }, [searchTerm, selectedPeriod, investment]);


    const filteredControl = useMemo(() => {
        let filtered = control;

        if (selectedPeriod !== "Todos") {
            filtered = filtered.filter((i) =>
                i.periodo && isDateInPeriod(i.periodo, selectedPeriod)
            );
        }
        return filtered;
    }, [selectedPeriod, control]);

    const PIE_COLORS = ["#f43f5e", "#3b82f6", "#8b5cf6", "#f59e0b", "#10b981", "#06b6d4"];


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary " />
                    <p className="text-lg"> Carregando dados ...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen overflow-hidden bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col space-y-2">
            <Header onSearch={setSearchTerm} onPeriod={setSelectedPeriod} bellClients={clients} />
            <main className="grid grid-cols-1 lg:grid-cols-3 p-3 gap-2">

                <div className="grid grid-rows-2 gap-2">
                    <Card className="bg-slate-800/80 backdrop-blur-md border-slate-700 rounded-xl shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-emerald-400">Fluxo de Caixa</CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                                Evolução mensal
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <ResponsiveContainer width="100%" height={270}>
                                <LineChart data={filteredCashFlow.map(i => ({ ...i, mes: new Date(i.periodo!).toLocaleString("pt-BR", { month: "short" }) }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="mes" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                                        labelStyle={{ color: "#e5e7eb" }}
                                        formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                                    <Line type="monotone" dataKey="valor_entrada" stroke="#10b981" strokeWidth={2} dot={false} name="Entradas" />
                                    <Line type="monotone" dataKey="valor_saida" stroke="#ef4444" strokeWidth={2} dot={false} name="Saídas" />
                                    <Line type="monotone" dataKey="valor_saldo" stroke="#3b82f6" strokeWidth={2} dot={false} name="Saldo" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-800/80 backdrop-blur-md border-slate-700 rounded-xl shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-emerald-400">Controle de Gastos</CardTitle>
                            <CardDescription className="text-xs text-slate-400">
                                Evolução mensal
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <ResponsiveContainer width="100%" height={270}>
                                <LineChart data={filteredControl.map(i => ({ ...i, mes: new Date(i.periodo!).toLocaleString("pt-BR", { month: "short" }) }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="mes" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                                        labelStyle={{ color: "#e5e7eb" }}
                                        formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                                    <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} dot={false} name="Receitas" />
                                    <Line type="monotone" dataKey="despesas_obrigatorias" stroke="#ef4444" strokeWidth={2} dot={false} name="Obrigatórias" />
                                    <Line type="monotone" dataKey="despesas_variaveis" stroke="#ef4444" strokeWidth={2} dot={false} name="Variáveis" />
                                    <Line type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={2} dot={false} name="Saldo" />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-rows-2 gap-2">
                    <Card className="bg-slate-800/80 backdrop-blur-md border-slate-700 rounded-xl shadow-lg ">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-emerald-400">
                                Clientes Mensais ({filteredClients.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 overflow-x-auto">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={filteredClients} margin={{ top: 10, right: 10, bottom: 50, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="nome" angle={-45} textAnchor="end" height={70} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                                    <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                                        labelStyle={{ color: "#e5e7eb" }}
                                        formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 10 }} />
                                    <Bar dataKey="valor_inicial" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="valor_juros" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="valor_total" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-800/80 backdrop-blur-md border-slate-700 rounded-xl shadow-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-emerald-400">
                                Clientes Longo Prazo ({filteredCredits.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 overflow-x-auto">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={filteredCredits} margin={{ top: 10, right: 10, bottom: 50, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="nome" angle={-45} textAnchor="end" height={70} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                                    <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                                        labelStyle={{ color: "#e5e7eb" }}
                                        formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 10 }} />
                                    <Bar dataKey="valor_inicial" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="valor_juros" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="valor_total" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col gap-6 h-full ">
                    <Card className="flex-1 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-emerald-400">Investimentos</CardTitle>
                            <CardDescription className="text-xs text-slate-400">Distribuição por tipo</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-12">

                            <ResponsiveContainer width="100%" height={260}>
                                <PieChart>
                                    <Pie
                                        data={investGroup(filteredInvestiment)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="valor"
                                        nameKey="tipo"
                                    >
                                        {investGroup(filteredInvestiment).map((_, i) => (
                                            <Cell key={`cell-${i}`} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                                        labelStyle={{ color: "#e5e7eb" }}
                                        formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`}
                                    />
                                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 10 }} />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="w-full h-px bg-slate-700/50 rounded-full" />
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={filteredInvestiment} margin={{ top: 10, right: 10, bottom: 50, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis
                                        dataKey="instituicao"
                                        angle={-45}
                                        textAnchor="end"
                                        height={70}
                                        tick={{ fill: "#9ca3af", fontSize: 10 }}
                                    />
                                    <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                                        labelStyle={{ color: "#e5e7eb" }}
                                        formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}`}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 10 }} />
                                    <Bar dataKey="valor_inicial" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="valor_juros" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="valor_total" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );

}