/* "use client" */

import Header from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { fetchDataServer } from "@/server"
import { formatCurrency, InvestmentData, isDateInPeriod } from "@/utils"
import { Check, Loader2, PackageOpen, Pencil, PiggyBank, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"




export default function DashboardInvestment() {

    const [investment, setInvestment] = useState<InvestmentData[]>([])
    const [deletingInvestment, setDeletingInvestment] = useState<string | null>(null);
    const [editingInvestment, setEditingInvestment] = useState<InvestmentData | null>(null);
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedPeriod, setSelectedPeriod] = useState("Todos")
    const [saving, setSaving] = useState<string | null>(null)

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

    const cardInvetiment = useMemo(() => {
        const receita = filteredInvestiment.reduce(
            (acc, item) => acc + Number(item.valor_inicial || 0),
            0
        );
        const juros = filteredInvestiment.reduce(
            (acc, item) => acc + Number(item.valor_juros || 0),
            0
        );
        const saldo = filteredInvestiment.reduce(
            (acc, item) => acc + Number(item.valor_total || 0),
            0
        );

        const taxa = Number(receita) > 0
            ? ((Number(juros) / Number(receita)) * 100).toFixed(2)
            : "0.00";
        return { receita, juros, saldo, taxa };
    }, [filteredInvestiment]);


    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const { invest } = await fetchDataServer()
            setInvestment(invest)

        } catch (err) {
            console.log("Erro ao buscar dados", err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const invetmentEditClick = (item: InvestmentData) => {
        setEditingInvestment(item);
    };


    const editInvetmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingInvestment) return;

        const { name, value } = e.target;
        const numericValue = value === "" ? "" : Number(value);

        const updatedItem = {
            ...editingInvestment,
            [name]: numericValue,
        };

        const vInicial = Number(updatedItem.valor_inicial) || 0;
        const vJuros = Number(updatedItem.valor_juros) || 0;
        const newValorTotal = vInicial + vJuros;
        const newTaxaJuros = vInicial > 0 ? ((vJuros / vInicial) * 100) : 0


        setEditingInvestment({
            ...updatedItem,
            valor_total: newValorTotal.toFixed(2),
            taxa_juros: Number(newTaxaJuros.toFixed(2)),
        });
    };

    const saveEditInvestment = async () => {
        if (!editingInvestment || !editingInvestment.id) return;

        setSaving(editingInvestment.id)

        const valorInicialNum = Number(editingInvestment.valor_inicial);
        const valorJurosNum = Number(editingInvestment.valor_juros);

        if (isNaN(valorInicialNum) || isNaN(valorJurosNum)) {

            return;
        }

        try {
            const res = await fetch(`/api/admin?id=${editingInvestment.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    table: "investimento",
                    id: editingInvestment.id,
                    valor_inicial: valorInicialNum,
                    valor_juros: valorJurosNum,
                    valor_total: editingInvestment.valor_total,
                    taxa_juros: editingInvestment.taxa_juros,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || "Erro ao atualizar investimento");
            }

            setInvestment((prev) =>
                prev.map((item) => (item.id === editingInvestment.id ? editingInvestment : item))
            );

            setEditingInvestment(null);
            await fetchData();
            setSearchTerm("");
            setSelectedPeriod("")

        } catch (err) {
            console.error("❌ Erro ao salvar edição:", err);
        } finally {
            setSaving(null);
        }
    };

    const handleDelete = async (id: string, table: string) => {
        if (!confirm(`Tem certeza que deseja excluir este ${table}?`)) return;

        setDeletingInvestment(id);

        try {
            const res = await fetch(`/api/admin?id=${id}&table=${table}`, {
                method: "DELETE",
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || `Erro ao deletar ${table}`);
            }

            if (table === "investimento") {
                setInvestment((prev) => prev.filter((item) => item.id !== id));
            }

            await fetchData();
            await fetchData();
            setSearchTerm("");
            setSelectedPeriod("")

        } catch (err) {
            console.error(err);

        } finally {
            setDeletingInvestment(null);
        }
    };


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-lg">Carregando dados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden bg-linear-to-br flex flex-col space-y-1">
            <Header onSearch={setSearchTerm} onPeriod={setSelectedPeriod} bellnvest={investment} />
            <main className=" p-1 min-h-screen bg-white backdrop-blur-xl gap-2">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">

                    <div className="lg:col-span-7 space-y-2">

                        <Card className=" mx-auto overflow-hidden border-slate-700/50 bg-linear-to-br from-slate-900/95 via-slate-950/98 to-slate-900/95 backdrop-blur-2xl shadow-2xl">
                            <div className="absolute inset-0 bg-linear-to-t from-cyan-900/20 via-transparent to-transparent" />
                            <div className="absolute inset-0  opacity-5" />

                            <div className="grid grid-cols-4 divide-x divide-slate-700/80">

                                <div className="px-8 space-y-6">
                                    <h3 className="text-xl font-bold text-center bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                        APLICAÇÃO
                                    </h3>

                                    <div className="space-y-4 pt-4">

                                        <div className="flex justify-center pt-4 border-t border-cyan-500/30">

                                            <span className="text-3xl font-bold bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                                {formatCurrency(cardInvetiment.receita)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8 space-y-6">
                                    <h3 className="text-xl font-bold text-center bg-linear-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
                                        RESGATE
                                    </h3>

                                    <div className="space-y-4 pt-4">
                                        <div className="flex justify-center pt-4 border-t border-amber-500/30">
                                            <span className="text-3xl font-bold bg-linear-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
                                                {formatCurrency(cardInvetiment.saldo)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8 space-y-6">
                                    <h3 className="text-xl font-bold text-center bg-linear-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                                        RETORNO
                                    </h3>
                                    <div className="space-y-4 pt-4">
                                        <div className="flex justify-center  pt-4 border-t border-emerald-500/30">
                                            <span className="text-3xl font-bold bg-linear-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                                                {formatCurrency(cardInvetiment.juros)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-8 space-y-6">
                                    <h3 className="text-xl font-bold text-center bg-linear-to-r from-indigo-400 to-indigo-500 bg-clip-text text-transparent">
                                        TAXA RETORNO
                                    </h3>
                                    <div className="space-y-4 pt-4">
                                        <div className="flex justify-center  pt-4 border-t border-indigo-500/30">
                                            <span className="text-3xl font-bold bg-linear-to-r from-indigo-400 to-indigo-500 bg-clip-text text-transparent">
                                                {cardInvetiment.taxa}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </Card>

                        <Card className=" border-0 shadow-2xl bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 
                          backdrop-blur-2xl overflow-hidden relative group 
                          hover:shadow-cyan-500/40 transition-all duration-500 
                          rounded-3xl ring-1 ring-slate-800 h-[695px]">
                            <div className="absolute inset-0 bg-linear-to-t from-cyan-500/10 to-transparent opacity-0 
                          group-hover:opacity-100 transition-opacity duration-700" />
                            <CardHeader className="pb-4 border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-xl">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-3xl font-bold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 
                                   bg-clip-text text-transparent">
                                        Carteira de Investimento Pessoal
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-cyan-400">
                                        <PiggyBank className="w-6 h-6" />
                                        <span className="text-xl font-semibold">{filteredInvestiment.length}</span>
                                    </div>
                                </div>
                                <CardDescription className="text-slate-400 mt-1">
                                    Invetimentos • Atualização em tempo real
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b border-slate-800/80 hover:bg-slate-800/50 transition-colors">
                                                {[
                                                    "Intituição", "Opções Investimneto", "Aplicação", "Retorno", "Resgate", "Tx.Retrono", "Periodo", "Ações"
                                                ].map((head) => (
                                                    <TableHead key={head} className="text-cyan-300 font-bold text-xs uppercase tracking-wider">
                                                        {head}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>

                                            {filteredInvestiment.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={11} className="h-64 text-center">
                                                        <div className="flex flex-col items-center gap-4 text-slate-500">
                                                            <PackageOpen className="w-16 h-16 opacity-30" />
                                                            <p className="text-lg">
                                                                {selectedPeriod !== "Todos"
                                                                    ? `Nenhum investimento em ${selectedPeriod}`
                                                                    : "Nenhum investimento encontrado"}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredInvestiment.map((i, idx) => {
                                                    const isEditing = editingInvestment && editingInvestment.id === i.id
                                                    const currenty = isEditing ? editingInvestment : i
                                                    const isSaving = saving === i.id
                                                    const isDeleting = deletingInvestment === i.id

                                                    return (
                                                        <TableRow key={i.id} className="border-b border-slate-800/40 hover:bg-linear-to-r hover:from-cyan-900/20 hover:to-purple-900/20 transition-all duration-300 group/row">

                                                            <TableCell className="font-bold text-white">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm bg-linear-to-br ${idx % 3 === 0 ? 'from-cyan-500 to-blue-600' :
                                                                        idx % 3 === 1 ? 'from-purple-500 to-pink-600' :
                                                                            'from-emerald-500 to-teal-600'}`}>
                                                                        {i.instituicao!.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    {i.instituicao}
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="text-slate-400 font-mono">{i.opcao_investimento}</TableCell>

                                                            <TableCell className="text-emerald-400">{
                                                                isEditing ? (
                                                                    <Input
                                                                        type="number"
                                                                        name="valor_inicial"
                                                                        value={currenty.valor_inicial || ""}
                                                                        onChange={editInvetmentChange}
                                                                        className="w-24 h-8 text-right"
                                                                        disabled={isSaving}
                                                                    />
                                                                ) : (formatCurrency(currenty.valor_inicial)
                                                                )}
                                                            </TableCell>

                                                            <TableCell className={"text-amber-400"}>
                                                                {
                                                                    isEditing ? (
                                                                        <Input
                                                                            type="number"
                                                                            name="valor_juros"
                                                                            value={currenty.valor_juros || ""}
                                                                            onChange={editInvetmentChange}
                                                                            className="w-24 h-8 text-right"
                                                                            disabled={isSaving}
                                                                        />
                                                                    ) : (
                                                                        formatCurrency(currenty.valor_juros)
                                                                    )
                                                                }
                                                            </TableCell>

                                                            <TableCell className="font-bold text-2xl bg-linear-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                                                                {formatCurrency(currenty.valor_total)}
                                                            </TableCell>

                                                            <TableCell>
                                                                <span
                                                                    className={`inline-block px-3 py-1 rounded-full text-xs font-bold
                                                                                   ${i.taxa_juros! === 0
                                                                            ? "bg-gray-100 text-gray-600 border border-gray-300"
                                                                            : i.taxa_juros! > 1 && i.taxa_juros! <= 10
                                                                                ? "bg-emerald-500/20 text-emerald-400"
                                                                                : i.taxa_juros! > 10 && i.taxa_juros! <= 20
                                                                                    ? "bg-blue-500/20 text-blue-400" : i.taxa_juros! > 20 && i.taxa_juros! > 20
                                                                                        ? "bg-amber-500/20 text-amber-400"
                                                                                        : i.taxa_juros! >= -10
                                                                                            ? "bg-emerald-500/10 text-emerald-300"
                                                                                            : "bg-red-600/20 text-red-500"
                                                                        }`}
                                                                >
                                                                    {i.taxa_juros}%
                                                                </span>
                                                            </TableCell>

                                                            <TableCell className="text-slate-300">
                                                                {currenty.periodo
                                                                    ? (
                                                                        String(currenty.periodo)
                                                                            .split('-')
                                                                            .reverse()
                                                                            .join('/')
                                                                    ) : ('')}
                                                            </TableCell>

                                                            <TableCell>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
                                                                    {isEditing ? (
                                                                        <>
                                                                            <Button
                                                                                variant="ghost" size="icon"
                                                                                className="h-9 w-9 text-emerald-400 hover:bg-emerald-500/20"
                                                                                onClick={saveEditInvestment}
                                                                                disabled={isSaving}
                                                                            >
                                                                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                                            </Button>

                                                                            <Button
                                                                                variant="ghost" size="icon"
                                                                                className="h-9 w-9 text-slate-400 hover:bg-slate-700"
                                                                                onClick={() => setEditingInvestment(null)}
                                                                                disabled={isSaving}
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Button
                                                                                variant="outline" size="icon"
                                                                                className="h-9 w-9 text-cyan-400 hover:bg-cyan-500/20"
                                                                                onClick={() => invetmentEditClick(i)}
                                                                                disabled={!!editingInvestment}
                                                                            >
                                                                                <Pencil className="h-4 w-4" />
                                                                            </Button>

                                                                            <Button
                                                                                variant="outline" size="icon"
                                                                                className="h-9 w-9 text-red-600 hover:bg-red-500/20"
                                                                                onClick={() => handleDelete(i.id!, "investimento")}
                                                                                disabled={isDeleting || !!editingInvestment}
                                                                            >
                                                                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                                            </Button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </TableCell>

                                                        </TableRow>
                                                    )
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-5 ">
                        <Card className="border-slate-700/50 bg-linear-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 backdrop-blur-2xl shadow-2xl overflow-hidden relative group hover:shadow-cyan-500/30 transition-all duration-500 h-[870px] rounded-2xl">

                            <CardHeader className="space-y-3 pb-8">
                                <CardTitle className="text-4xl font-bold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                                    Carteira de Investimento Pessoal ({filteredInvestiment.length})
                                </CardTitle>
                                <CardDescription className="text-slate-400 text-lg">
                                    Comparação entre valor aplicação, retorno e resgate por instituicao
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-6">
                                <ResponsiveContainer width="110%" height={750} >
                                    <BarChart data={filteredInvestiment} margin={{ top: 20, right: 40, bottom: 120, left: 50 }}>
                                        <defs>
                                            <linearGradient id="gradientInicial" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                                                <stop offset="50%" stopColor="#3b82f6" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#1e40af" stopOpacity={1} />
                                            </linearGradient>

                                            <linearGradient id="gradientJuros" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                                                <stop offset="50%" stopColor="#f59e0b" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                                            </linearGradient>

                                            <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                                                <stop offset="50%" stopColor="#10b981" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                                            </linearGradient>
                                        </defs>

                                        <CartesianGrid
                                            strokeDasharray="4 4"
                                            stroke="#334155"
                                            strokeOpacity={0.5}
                                        />

                                        <XAxis
                                            dataKey="instituicao"
                                            angle={-45}
                                            textAnchor="end"
                                            height={140}
                                            tick={{
                                                fontSize: 13,
                                                fontWeight: 600,
                                                fill: "#94a3b8"
                                            }}
                                            tickLine={{ stroke: "#475569" }}
                                        />

                                        <YAxis
                                            tick={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                fill: "#cbd5e1"
                                            }}
                                            tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`}
                                            tickLine={{ stroke: "#475569" }}
                                        />

                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: "rgba(15, 23, 42, 0.95)",
                                                border: "1px solid #1e293b",
                                                borderRadius: "16px",
                                                backdropFilter: "blur(12px)",
                                                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                                                color: "white",
                                            }}
                                            itemStyle={{ padding: "8px 0" }}
                                            labelStyle={{
                                                fontWeight: "bold",
                                                color: "#60a5fa",
                                                marginBottom: "12px",
                                                fontSize: "15px"
                                            }}
                                            formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                        />

                                        <Legend
                                            wrapperStyle={{ paddingTop: "30px" }}
                                            iconType="rect"
                                            formatter={(value) => {
                                                const labels: Record<string, string> = {
                                                    valor_inicial: "Aplicação",
                                                    valor_juros: "Retorno",
                                                    valor_total: "Resgate",
                                                };
                                                return <span className="text-slate-300 font-semibold">{labels[value] || value}</span>;
                                            }}
                                        />

                                        <Bar
                                            dataKey="valor_inicial"
                                            fill="url(#gradientInicial)"
                                            radius={[12, 12, 0, 0]}
                                            barSize={28}
                                        />
                                        <Bar
                                            dataKey="valor_juros"
                                            fill="url(#gradientJuros)"
                                            radius={[12, 12, 0, 0]}
                                            barSize={28}
                                        />
                                        <Bar
                                            dataKey="valor_total"
                                            fill="url(#gradientTotal)"
                                            radius={[12, 12, 0, 0]}
                                            barSize={28}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main >
        </div >
        /*          <div className="h-screen overflow-hidden bg-linear-to-br  flex flex-col ">
                    <Header onSearch={setSearchTerm} onPeriod={setSelectedPeriod} bellnvest={investment} />
                    <main className=" p-2 min-h-screen bg-white backdrop-blur-xl">
        
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
        
                            <div className="lg:col-span-7 space-y-2">
        
                                <Card className=" mx-auto overflow-hidden border-slate-700/50 bg-linear-to-br from-slate-900/95 via-slate-950/98 to-slate-900/95 backdrop-blur-2xl shadow-2xl">
                                    <div className="absolute inset-0 bg-linear-to-t from-cyan-900/20 via-transparent to-transparent" />
                                    <div className="absolute inset-0  opacity-5" />
        
                                    <div className="grid grid-cols-4 divide-x divide-slate-700/80">
        
                                        <div className="px-8 space-y-6">
                                            <h3 className="text-xl font-bold text-center bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                                APLICAÇÃO
                                            </h3>
        
                                            <div className="space-y-4 pt-4">
        
                                                <div className="flex justify-center pt-4 border-t border-cyan-500/30">
        
                                                    <span className="text-3xl font-bold bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                                        {formatCurrency(cardInvetiment.receita)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
        
                                        <div className="px-8 space-y-6">
                                            <h3 className="text-xl font-bold text-center bg-linear-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
                                                RESGATE
                                            </h3>
        
                                            <div className="space-y-4 pt-4">
                                                <div className="flex justify-center pt-4 border-t border-amber-500/30">
                                                    <span className="text-3xl font-bold bg-linear-to-r from-amber-400 to-amber-500 bg-clip-text text-transparent">
                                                        {formatCurrency(cardInvetiment.saldo)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
        
                                        <div className="px-8 space-y-6">
                                            <h3 className="text-xl font-bold text-center bg-linear-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                                                RETORNO
                                            </h3>
                                            <div className="space-y-4 pt-4">
                                                <div className="flex justify-center  pt-4 border-t border-emerald-500/30">
                                                    <span className="text-3xl font-bold bg-linear-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                                                        {formatCurrency(cardInvetiment.juros)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
        
                                        <div className="px-8 space-y-6">
                                            <h3 className="text-xl font-bold text-center bg-linear-to-r from-indigo-400 to-indigo-500 bg-clip-text text-transparent">
                                                TAXA RETORNO
                                            </h3>
                                            <div className="space-y-4 pt-4">
                                                <div className="flex justify-center  pt-4 border-t border-indigo-500/30">
                                                    <span className="text-3xl font-bold bg-linear-to-r from-indigo-400 to-indigo-500 bg-clip-text text-transparent">
                                                        {cardInvetiment.taxa}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
        
                                    </div>
                                </Card>
        
                                <Card className=" border-0 shadow-2xl bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 
                          backdrop-blur-2xl overflow-hidden relative group 
                          hover:shadow-cyan-500/40 transition-all duration-500 
                          rounded-3xl ring-1 ring-slate-800">
                                    <div className="absolute inset-0 bg-linear-to-t from-cyan-500/10 to-transparent opacity-0 
                          group-hover:opacity-100 transition-opacity duration-700" />
                                    <CardHeader className="pb-4 border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-xl">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-3xl font-bold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 
                                   bg-clip-text text-transparent">
                                                Carteira de Investimento Pessoal
                                            </CardTitle>
                                            <div className="flex items-center gap-2 text-cyan-400">
                                                <PiggyBank className="w-6 h-6" />
                                                <span className="text-xl font-semibold">{filteredInvestiment.length}</span>
                                            </div>
                                        </div>
                                        <CardDescription className="text-slate-400 mt-1">
                                            Invetimentos • Atualização em tempo real
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="border-b border-slate-800/80 hover:bg-slate-800/50 transition-colors">
                                                        {[
                                                            "Intituição", "Opções Investimneto", "Aplicação", "Retorno", "Resgate", "Tx.Retrono", "Periodo", "Ações"
                                                        ].map((head) => (
                                                            <TableHead key={head} className="text-cyan-300 font-bold text-xs uppercase tracking-wider">
                                                                {head}
                                                            </TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
        
                                                    {filteredInvestiment.length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={11} className="h-64 text-center">
                                                                <div className="flex flex-col items-center gap-4 text-slate-500">
                                                                    <PackageOpen className="w-16 h-16 opacity-30" />
                                                                    <p className="text-lg">
                                                                        {selectedPeriod !== "Todos"
                                                                            ? `Nenhum investimento em ${selectedPeriod}`
                                                                            : "Nenhum investimento encontrado"}
                                                                    </p>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        filteredInvestiment.map((i, idx) => {
                                                            const isEditing = editingInvestment && editingInvestment.id === i.id
                                                            const currenty = isEditing ? editingInvestment : i
                                                            const isSaving = saving === i.id
                                                            const isDeleting = deletingInvestment === i.id
        
                                                            return (
                                                                <TableRow key={i.id} className="border-b border-slate-800/40 hover:bg-linear-to-r hover:from-cyan-900/20 hover:to-purple-900/20 transition-all duration-300 group/row">
        
                                                                    <TableCell className="font-bold text-white">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm bg-linear-to-br ${idx % 3 === 0 ? 'from-cyan-500 to-blue-600' :
                                                                                idx % 3 === 1 ? 'from-purple-500 to-pink-600' :
                                                                                    'from-emerald-500 to-teal-600'}`}>
                                                                                {i.instituicao!.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                                            </div>
                                                                            {i.instituicao}
                                                                        </div>
                                                                    </TableCell>
        
                                                                    <TableCell className="text-slate-400 font-mono">{i.opcao_investimento}</TableCell>
        
                                                                    <TableCell className="text-emerald-400">{
                                                                        isEditing ? (
                                                                            <Input
                                                                                type="number"
                                                                                name="valor_inicial"
                                                                                value={currenty.valor_inicial || ""}
                                                                                onChange={editInvetmentChange}
                                                                                className="w-24 h-8 text-right"
                                                                                disabled={isSaving}
                                                                            />
                                                                        ) : (formatCurrency(currenty.valor_inicial)
                                                                        )}
                                                                    </TableCell>
        
                                                                   <TableCell className={"text-amber-400"}>
                                                                        {
                                                                            isEditing ? (
                                                                                <Input
                                                                                    type="number"
                                                                                    name="valor_juros"
                                                                                    value={currenty.valor_juros || ""}
                                                                                    onChange={editInvetmentChange}
                                                                                    className="w-24 h-8 text-right"
                                                                                    disabled={isSaving}
                                                                                />
                                                                            ) : (
                                                                                formatCurrency(currenty.valor_juros)
                                                                            )
                                                                        }
                                                                    </TableCell>
        
                                                                    <TableCell className="font-bold text-2xl bg-linear-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                                                                        {formatCurrency(currenty.valor_total)}
                                                                    </TableCell>
        
                                                                    <TableCell>
                                                                        <span
                                                                            className={`inline-block px-3 py-1 rounded-full text-xs font-bold
                                                                                   ${i.taxa_juros! === 0
                                                                                    ? "bg-gray-100 text-gray-600 border border-gray-300"
                                                                                    : i.taxa_juros! > 1 && i.taxa_juros! <= 10
                                                                                        ? "bg-emerald-500/20 text-emerald-400"
                                                                                        : i.taxa_juros! > 10 && i.taxa_juros! <= 20
                                                                                            ? "bg-blue-500/20 text-blue-400" : i.taxa_juros! > 20 && i.taxa_juros! > 20
                                                                                                ? "bg-amber-500/20 text-amber-400"
                                                                                                : i.taxa_juros! >= -10
                                                                                                    ? "bg-emerald-500/10 text-emerald-300"
                                                                                                    : "bg-red-600/20 text-red-500"
                                                                                }`}
                                                                        >
                                                                            {i.taxa_juros}%
                                                                        </span>
                                                                    </TableCell>
        
                                                                    <TableCell className="text-slate-300">
                                                                        {currenty.periodo
                                                                            ? (
                                                                                String(currenty.periodo)
                                                                                    .split('-')
                                                                                    .reverse()
                                                                                    .join('/')
                                                                            ) : ('')}
                                                                    </TableCell>
        
                                                                    <TableCell>
                                                                        <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
                                                                            {isEditing ? (
                                                                                <>
                                                                                    <Button
                                                                                        variant="ghost" size="icon"
                                                                                        className="h-9 w-9 text-emerald-400 hover:bg-emerald-500/20"
                                                                                        onClick={saveEditInvestment}
                                                                                        disabled={isSaving}
                                                                                    >
                                                                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                                                    </Button>
        
                                                                                    <Button
                                                                                        variant="ghost" size="icon"
                                                                                        className="h-9 w-9 text-slate-400 hover:bg-slate-700"
                                                                                        onClick={() => setEditingInvestment(null)}
                                                                                        disabled={isSaving}
                                                                                    >
                                                                                        <X className="h-4 w-4" />
                                                                                    </Button>
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Button
                                                                                        variant="outline" size="icon"
                                                                                        className="h-9 w-9 text-cyan-400 hover:bg-cyan-500/20"
                                                                                        onClick={() => invetmentEditClick(i)}
                                                                                        disabled={!!editingInvestment}
                                                                                    >
                                                                                        <Pencil className="h-4 w-4" />
                                                                                    </Button>
        
                                                                                    <Button
                                                                                        variant="outline" size="icon"
                                                                                        className="h-9 w-9 text-red-600 hover:bg-red-500/20"
                                                                                        onClick={() => handleDelete(i.id!, "investimento")}
                                                                                        disabled={isDeleting || !!editingInvestment}
                                                                                    >
                                                                                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                                                    </Button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </TableCell>
        
                                                                </TableRow>
                                                            )
                                                        })
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
        
                            <div className="lg:col-span-5 ">
                                <Card className="border-slate-700/50 bg-linear-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 backdrop-blur-2xl shadow-2xl overflow-hidden relative group hover:shadow-cyan-500/30 transition-all duration-500 h-[860px] rounded-2xl">
        
                                    <CardHeader className="space-y-3 pb-8">
                                        <CardTitle className="text-4xl font-bold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                                            Carteira de Investimento Pessoal ({filteredInvestiment.length})
                                        </CardTitle>
                                        <CardDescription className="text-slate-400 text-lg">
                                            Comparação entre valor aplicação, retorno e resgate por instituicao
                                        </CardDescription>
                                    </CardHeader>
        
                                    <CardContent className="pt-6">
                                        <ResponsiveContainer width="110%" height={750} >
                                            <BarChart data={filteredInvestiment} margin={{ top: 20, right: 40, bottom: 120, left: 50 }}>
                                                <defs>
                                                    <linearGradient id="gradientInicial" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                                                        <stop offset="50%" stopColor="#3b82f6" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#1e40af" stopOpacity={1} />
                                                    </linearGradient>
        
                                                    <linearGradient id="gradientJuros" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                                                        <stop offset="50%" stopColor="#f59e0b" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                                                    </linearGradient>
        
                                                    <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                                                        <stop offset="50%" stopColor="#10b981" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                                                    </linearGradient>
                                                </defs>
        
                                                <CartesianGrid
                                                    strokeDasharray="4 4"
                                                    stroke="#334155"
                                                    strokeOpacity={0.5}
                                                />
        
                                                <XAxis
                                                    dataKey="instituicao"
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={140}
                                                    tick={{
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        fill: "#94a3b8"
                                                    }}
                                                    tickLine={{ stroke: "#475569" }}
                                                />
        
                                                <YAxis
                                                    tick={{
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        fill: "#cbd5e1"
                                                    }}
                                                    tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`}
                                                    tickLine={{ stroke: "#475569" }}
                                                />
        
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "rgba(15, 23, 42, 0.95)",
                                                        border: "1px solid #1e293b",
                                                        borderRadius: "16px",
                                                        backdropFilter: "blur(12px)",
                                                        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                                                        color: "white",
                                                    }}
                                                    itemStyle={{ padding: "8px 0" }}
                                                    labelStyle={{
                                                        fontWeight: "bold",
                                                        color: "#60a5fa",
                                                        marginBottom: "12px",
                                                        fontSize: "15px"
                                                    }}
                                                    formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                                                />
        
                                                <Legend
                                                    wrapperStyle={{ paddingTop: "30px" }}
                                                    iconType="rect"
                                                    formatter={(value) => {
                                                        const labels: Record<string, string> = {
                                                            valor_inicial: "Aplicação",
                                                            valor_juros: "Retorno",
                                                            valor_total: "Resgate",
                                                        };
                                                        return <span className="text-slate-300 font-semibold">{labels[value] || value}</span>;
                                                    }}
                                                />
        
                                                <Bar
                                                    dataKey="valor_inicial"
                                                    fill="url(#gradientInicial)"
                                                    radius={[12, 12, 0, 0]}
                                                    barSize={28}
                                                />
                                                <Bar
                                                    dataKey="valor_juros"
                                                    fill="url(#gradientJuros)"
                                                    radius={[12, 12, 0, 0]}
                                                    barSize={28}
                                                />
                                                <Bar
                                                    dataKey="valor_total"
                                                    fill="url(#gradientTotal)"
                                                    radius={[12, 12, 0, 0]}
                                                    barSize={28}
                                                />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </main >
                </div > */
    )
}