/* "use client" */

import Header from "@/components/header"


import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"




import { fetchDataServer } from "@/server"
import { calculateDateEnd, calculateDateEndLong, CashFlowData, ClienteData, CreditData, formatCurrency, formatPhone, isDateInPeriod } from "@/utils"
import { Check, Loader2, PackageOpen, Pencil, Trash2, Users, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"






export default function ClientsPage() {

    const [cashFlow, setCashFlow] = useState<CashFlowData[]>([])
    const [clients, setClients] = useState<ClienteData[]>([])
    const [credits, setCredits] = useState<CreditData[]>([])

    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedPeriod, setSelectedPeriod] = useState("Todos")
    const [saving, setSaving] = useState<string | null>(null)

    const [editingCredits, setEditingCredits] = useState<CreditData | null>(null)
    const [editingClients, setEditingClients] = useState<ClienteData | null>(null)

    const [deletingClients, setDeletingClients] = useState<string | null>(null)
    const [deletingCredits, setDeletingCredits] = useState<string | null>(null)


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

    const cardCashFlow = useMemo(() => {
        const entrada = filteredCashFlow.reduce((acc, item) => acc + Number(item.valor_entrada || 0), 0)
        const saida = filteredCashFlow.reduce((acc, item) => acc + Number(item.valor_saida || 0), 0)
        const saldo = filteredCashFlow.reduce((acc, item) => acc + Number(item.valor_saldo || 0), 0)
        return { entrada, saida, saldo }
    }, [filteredCashFlow])

    const cardClients = useMemo(() => {
        const receita = filteredClients.reduce((acc, item) => acc + Number(item.valor_inicial || 0), 0)
        const juros = filteredClients.reduce((acc, item) => acc + Number(item.valor_juros || 0), 0)
        const saldo = filteredClients.reduce((acc, item) => acc + Number(item.valor_total || 0), 0)
        return { receita, juros, saldo }
    }, [filteredClients])

    const cardCredits = useMemo(() => {
        const receita = filteredCredits.reduce((acc, item) => acc + Number(item.valor_inicial || 0), 0)
        const qntParcelas = filteredCredits.reduce((acc, item) => acc + Number(item.qnt_parcelas || 0), 0)
        const parcelas = filteredCredits.reduce((acc, item) => acc + Number(item.valor_parcelas || 0), 0)
        const juros = filteredCredits.reduce((acc, item) => acc + Number(item.valor_juros || 0), 0)
        const saldo = filteredCredits.reduce((acc, item) => acc + Number(item.valor_total || 0), 0)
        const restante = saldo - juros
        return { receita, qntParcelas, parcelas, juros, saldo, restante }
    }, [filteredCredits])

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            const { clients, credits, cashFlow } = await fetchDataServer()
            setClients(clients)
            setCredits(credits)
            setCashFlow(cashFlow)
        } catch (err) {
            console.log("Erro ao buscar dados", err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])


    const clientClick = (item: ClienteData) => {
        setEditingClients({ ...item });
    };

    const editingClientsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingClients) return;

        const { name, value } = e.target;
        const isNumericField = name === "valor_inicial" || name === "valor_juros";
        const processedValue = isNumericField ? (value === "" ? "" : Number(value)) : value;

        const updatedItem = {
            ...editingClients,
            [name]: processedValue,
        };

        const vInicial = Number(updatedItem.valor_inicial) || 0;
        const vJuros = Number(updatedItem.valor_juros) || 0;
        const saldo = vInicial + vJuros;
        const currentDataInicial = updatedItem.data_inicial as string;
        const newDataFinal = calculateDateEnd(currentDataInicial)

        setEditingClients({
            ...updatedItem,
            valor_total: saldo.toFixed(2),
            data_final: newDataFinal
        })
    }

    const saveEditClients = async () => {
        if (!editingClients || !editingClients.id) return;

        setSaving(editingClients.id);

        try {
            const res = await fetch(`/api/admin?id=${editingClients.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    table: "cliente",
                    id: editingClients.id,
                    valor_inicial: Number(editingClients.valor_inicial),
                    valor_juros: Number(editingClients.valor_juros),
                    valor_total: editingClients.valor_total,
                    data_inicial: editingClients.data_inicial,
                    data_final: editingClients.data_final,
                    telefone: editingClients.telefone,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || "Erro ao atualizar cliente");
            }

            setClients((prev) =>
                prev.map((item) => (item.id === editingClients.id ? editingClients : item))
            );

            setEditingClients(null);
            await fetchData();
            setSearchTerm("");
            setSelectedPeriod("")

        } catch (err) {
            console.error("❌ Erro ao salvar edição:", err);
        } finally {
            setSaving(null);
        }
    };



    const creditsClick = (item: CreditData) => {
        setEditingCredits({ ...item })
    }

    const editCreditsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editingCredits) return;
        const { name, value } = e.target;
        const isNumericField = name === "qnt_parcelas"
        const processedValue = isNumericField ? (value === "" ? "" : Number(value)) : value;
        const updatedItem = {
            ...editingCredits,
            [name]: processedValue
        };
        const qParcelas = Number(updatedItem.qnt_parcelas) || 0;
        const vParcelas = Number(updatedItem.valor_parcelas) || 0;
        const vTotal = qParcelas * vParcelas
        const currentDataInicial = (name === "data_inicial" ? processedValue : updatedItem.data_inicial) as string;
        updatedItem.data_final = calculateDateEndLong(currentDataInicial, qParcelas);

        setEditingCredits({
            ...updatedItem,
            valor_total: vTotal,
            data_inicial: updatedItem.data_inicial,
            data_final: updatedItem.data_final
        })
    };

    const saveEditCredits = async () => {
        if (!editingCredits || !editingCredits.id) return;

        setSaving(editingCredits.id);

        try {
            const res = await fetch(`/api/admin?id=${editingCredits.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    table: "credito_longo",
                    id: editingCredits.id,
                    qnt_parcelas: Number(editingCredits.qnt_parcelas),
                    valor_parcelas: Number(editingCredits.valor_parcelas),
                    valor_total: editingCredits.valor_total,
                    data_inicial: editingCredits.data_inicial,
                    data_final: editingCredits.data_final,
                    telefone: editingCredits.telefone,
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || "Erro ao atualizar cliente");
            }

            setCredits((prev) =>
                prev.map((item) => (item.id === editingCredits.id ? editingCredits : item))
            );

            setEditingCredits(null);
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

        if (table === "cliente") {
            setDeletingClients(id);
        } else {
            setDeletingCredits(id);
        }

        try {
            const res = await fetch(`/api/admin?id=${id}&table=${table}`, {
                method: "DELETE",
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || `Erro ao deletar ${table}`);
            }

            if (table === "cliente") {
                setClients((prev) => prev.filter((item) => item.id !== id));

            } else if (table === "credito") {
                setCredits((prev) => prev.filter((item) => item.id !== id));
            }

            await fetchData();
            setSearchTerm("");
            setSelectedPeriod("")

        } catch (err) {
            console.error(err);

        } finally {
            setDeletingClients(null);
            setDeletingCredits(null);
        }
    };

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
        <div className="h-screen overflow-hidden bg-linear-to-br  flex flex-col space-y-1 ">
            <Header onSearch={setSearchTerm} onPeriod={setSelectedPeriod} bellClients={clients} bellCredit={credits} />
            <main className="p-2 min-h-screen bg-white   backdrop-blur-xl ">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 ">

                    <div className="lg:col-span-4">
                        <Card className=" border-0 shadow-2xl bg-linear-to-br from-slate-900 via-slate-950 
                        to-slate-900 backdrop-blur-2xl overflow-hidden relative group hover:shadow-cyan-500/40 
                        transition-all duration-500 rounded-3xl ring-1 ring-sdlate-800 h-[870px]">
                            <div className="absolute inset-0 bg-linear-to-t from-cyan-500/10 to-transparent opacity-0 
                  group-hover:opacity-100 transition-opacity duration-700" />
                            <CardHeader className="pb-4 border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-xl">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-3xl font-bold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 
                           bg-clip-text text-transparent">
                                        Clientes Mensais
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-cyan-400">
                                        <Users className="w-6 h-6" />
                                        <span className="text-xl font-semibold">{filteredClients.length}</span>
                                    </div>
                                </div>
                                <CardDescription className="text-slate-400 mt-1">
                                    Créditos mensais • Atualização em tempo real
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b border-slate-800/80 hover:bg-slate-800/50 transition-colors">
                                                {[
                                                    "Nome", "Valor", "Juros", "Saldo", "Data", "Entrega", "Telefone", "Ações"
                                                ].map((head) => (
                                                    <TableHead key={head} className="text-cyan-300 font-bold text-xs uppercase tracking-wider">
                                                        {head}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>

                                            {filteredClients.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={11} className="h-64 text-center">
                                                        <div className="flex flex-col items-center gap-4 text-slate-500">
                                                            <PackageOpen className="w-16 h-16 opacity-30" />
                                                            <p className="text-lg">
                                                                {selectedPeriod !== "Todos"
                                                                    ? `Nenhum cliente longo em ${selectedPeriod}`
                                                                    : "Nenhum cliente longo encontrado"}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredClients.map((i, idx) => {
                                                    const isEditing = editingClients && editingClients.id === i.id
                                                    const currenty = isEditing ? editingClients : i
                                                    const isSaving = saving === i.id
                                                    const isDeleting = deletingClients === i.id

                                                    return (
                                                        <TableRow key={i.id} className="border-b border-slate-800/40 hover:bg-linear-to-r hover:from-cyan-900/20 hover:to-purple-900/20 
                             transition-all duration-300 group/row"
                                                        >
                                                            <TableCell className="font-bold text-white">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm
                        bg-linear-to-br ${idx % 3 === 0 ? 'from-cyan-500 to-blue-600' :
                                                                            idx % 3 === 1 ? 'from-purple-500 to-pink-600' :
                                                                                'from-emerald-500 to-teal-600'}`}>
                                                                        {i.nome!.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    {i.nome}
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="text-emerald-400">{
                                                                isEditing ? (
                                                                    <Input
                                                                        type="number"
                                                                        name="valor_inicial"
                                                                        value={currenty.valor_inicial || ""}
                                                                        onChange={editingClientsChange}
                                                                        className="w-24 h-8 text-right"
                                                                        disabled={isSaving}
                                                                    />
                                                                ) : (formatCurrency(currenty.valor_inicial)
                                                                )}
                                                            </TableCell>

                                                            <TableCell className="text-amber-400">{
                                                                isEditing ? (
                                                                    <Input
                                                                        type="number"
                                                                        name="valor_juros"
                                                                        value={currenty.valor_juros || ""}
                                                                        onChange={editingClientsChange}
                                                                        className="w-24 h-8 text-right"
                                                                        disabled={isSaving}
                                                                    />
                                                                ) : (formatCurrency(currenty.valor_juros)
                                                                )}
                                                            </TableCell>

                                                            <TableCell className="font-bold text-2xl bg-linear-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                                                                {formatCurrency(currenty.valor_total)}
                                                            </TableCell>

                                                            <TableCell className="text-slate-300">
                                                                {isEditing ? (
                                                                    <Input
                                                                        type="date"
                                                                        name="data_inicial"
                                                                        value={currenty.data_inicial || ""}
                                                                        className="w-32 h-8"
                                                                        onChange={editingClientsChange}
                                                                        disabled={isSaving}
                                                                    />
                                                                ) : (
                                                                    i.data_inicial ? (
                                                                        String(currenty.data_inicial)
                                                                            .split('-')
                                                                            .reverse()
                                                                            .join('/')
                                                                    ) : ('-')
                                                                )}
                                                            </TableCell>

                                                            <TableCell className="text-slate-300">
                                                                {currenty.data_final
                                                                    ? (
                                                                        String(currenty.data_final)
                                                                            .split('-')
                                                                            .reverse()
                                                                            .join('/')
                                                                    ) : ('')}
                                                            </TableCell>

                                                            <TableCell className="text-slate-400 font-mono">
                                                                {isEditing ? (
                                                                    <Input
                                                                        type="tel"
                                                                        name="telefone"
                                                                        value={currenty.telefone || ""}
                                                                        className="w-32 h-8"
                                                                        onChange={editingClientsChange}
                                                                        disabled={isSaving}
                                                                    />
                                                                ) : (
                                                                    (i.telefone) ? formatPhone(i.telefone!) : '-'
                                                                )}
                                                            </TableCell>

                                                            <TableCell>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
                                                                    {isEditing ? (
                                                                        <>
                                                                            <Button
                                                                                variant="ghost" size="icon"
                                                                                className="h-9 w-9 text-emerald-400 hover:bg-emerald-500/20"
                                                                                onClick={saveEditClients}
                                                                                disabled={isSaving}
                                                                            >
                                                                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                                            </Button>

                                                                            <Button
                                                                                variant="ghost" size="icon"
                                                                                className="h-9 w-9 text-slate-400 hover:bg-slate-700"
                                                                                onClick={() => setEditingClients(null)}
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
                                                                                onClick={() => clientClick(i)}
                                                                                disabled={!!editingClients}
                                                                            >
                                                                                <Pencil className="h-4 w-4" />
                                                                            </Button>

                                                                            <Button
                                                                                variant="outline" size="icon"
                                                                                className="h-9 w-9 text-red-600 hover:bg-red-500/20"
                                                                                onClick={() => handleDelete(i.id!, "cliente")}
                                                                                disabled={isDeleting || !!editingClients}
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

                    <div className="lg:col-span-5 space-y-2">
                        <Card className="max-w-6xl mx-auto overflow-hidden border-slate-700/50 bg-linear-to-br from-slate-900/95 via-slate-950/98 to-slate-900/95 backdrop-blur-2xl shadow-2xl">
                            <div className="absolute inset-0 bg-linear-to-t from-cyan-900/20 via-transparent to-transparent" />
                            <div className="absolute inset-0  opacity-5" />
                            <CardContent className="p-8">
                                <div className="grid grid-cols-3 divide-x divide-slate-700/80">

                                    <div className="px-8 space-y-6">
                                        <h3 className="text-xl font-bold text-center bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                            FLUXO DE CAIXA
                                        </h3>

                                        <div className="space-y-4 pt-4">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 text-sm">Entrada</span>
                                                <span className="text-2xl font-bold text-slate-100">
                                                    {formatCurrency(cardCashFlow.entrada)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-slate-400 text-sm">Saída</span>
                                                <span className="text-2xl font-bold text-red-400">
                                                    {formatCurrency(cardCashFlow.saida)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between pt-4 border-t border-cyan-500/30">
                                                <span className="text-slate-300 font-semibold">Saldo</span>
                                                <span className="text-3xl font-bold bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                                    {formatCurrency(cardCashFlow.saldo)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-8 space-y-6">
                                        <h3 className="text-xl font-bold text-center bg-linear-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                                            CLIENTES
                                        </h3>

                                        <div className="space-y-4 pt-4">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 text-sm">Receita</span>
                                                <span className="text-2xl font-bold text-slate-100">
                                                    {formatCurrency(cardClients.receita)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-slate-400 text-sm">Juros</span>
                                                <span className="text-2xl font-bold text-amber-400">
                                                    {formatCurrency(cardClients.juros)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between pt-4 border-t border-emerald-500/30">
                                                <span className="text-slate-300 font-semibold">Saldo</span>
                                                <span className="text-3xl font-bold bg-linear-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
                                                    {formatCurrency(cardClients.saldo)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-8 space-y-6">
                                        <h3 className="text-xl font-bold text-center bg-linear-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                                            CLIENTES LONGO PRAZO
                                        </h3>

                                        <div className="space-y-4 pt-4">
                                            <div className="flex justify-between">
                                                <span className="text-slate-400 text-sm">Receita</span>
                                                <span className="text-2xl font-bold text-slate-100">
                                                    {formatCurrency(cardCredits.receita)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between">
                                                <span className="text-slate-400 text-sm">Juros</span>
                                                <span className="text-2xl font-bold text-amber-400">
                                                    {formatCurrency(cardCredits.juros)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between pt-4 border-t border-purple-500/30">
                                                <span className="text-slate-300 font-semibold">Saldo</span>
                                                <span className="text-3xl font-bold bg-linear-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                                                    {formatCurrency(cardCredits.restante)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </CardContent>
                        </Card>

                        <Card className="h-[530px] border-0 shadow-2xl bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 
                  backdrop-blur-2xl overflow-hidden relative group 
                  hover:shadow-cyan-500/40 transition-all duration-500 
                  rounded-3xl ring-1 ring-slate-800">
                            <div className="absolute inset-0 bg-linear-to-t from-cyan-500/10 to-transparent opacity-0 
                  group-hover:opacity-100 transition-opacity duration-700" />
                            <CardHeader className="pb-4 border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-xl">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-3xl font-bold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 
                           bg-clip-text text-transparent">
                                        Clientes Longos
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-cyan-400">
                                        <Users className="w-6 h-6" />
                                        <span className="text-xl font-semibold">{filteredCredits.length}</span>
                                    </div>
                                </div>
                                <CardDescription className="text-slate-400 mt-1">
                                    Créditos parcelados • Atualização em tempo real
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table className="h-[380px]">
                                        <TableHeader>
                                            <TableRow className="border-b border-slate-800/80 hover:bg-slate-800/50 transition-colors">
                                                {[
                                                    "Nome", "Valor", "Parc.", "Parcela", "Juros", "Saldo", "Tx.", "Data", "Entrega", "Telefone", "Ações"
                                                ].map((head) => (
                                                    <TableHead key={head} className="text-cyan-300 font-bold text-xs uppercase tracking-wider">
                                                        {head}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>

                                        <TableBody>
                                            {filteredCredits.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={11} className="h-64 text-center">
                                                        <div className="flex flex-col items-center gap-4 text-slate-500">
                                                            <PackageOpen className="w-16 h-16 opacity-30" />
                                                            <p className="text-lg">
                                                                {selectedPeriod !== "Todos"
                                                                    ? `Nenhum cliente longo em ${selectedPeriod}`
                                                                    : "Nenhum cliente longo encontrado"}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredCredits.map((i, idx) => {
                                                    const isEditing = editingCredits && editingCredits.id === i.id
                                                    const currenty = isEditing ? editingCredits : i
                                                    const isSaving = saving === i.id
                                                    const isDeleting = deletingCredits === i.id

                                                    return (
                                                        <TableRow key={i.id} className="border-b border-slate-800/40 hover:bg-linear-to-r hover:from-cyan-900/20 hover:to-purple-900/20 
                             transition-all duration-300 group/row"
                                                        >
                                                            <TableCell className="font-bold text-white">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm
                        bg-linear-to-br ${idx % 3 === 0 ? 'from-cyan-500 to-blue-600' :
                                                                            idx % 3 === 1 ? 'from-purple-500 to-pink-600' :
                                                                                'from-emerald-500 to-teal-600'}`}>
                                                                        {i.nome!.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                                                                    </div>
                                                                    {i.nome}
                                                                </div>
                                                            </TableCell>

                                                            <TableCell className="text-emerald-400">{formatCurrency(i.valor_inicial)}</TableCell>

                                                            <TableCell className="text-center">
                                                                {isEditing ? (
                                                                    <Input
                                                                        type="number"
                                                                        name="qnt_parcelas"
                                                                        value={currenty.qnt_parcelas || ""}
                                                                        onChange={editCreditsChange}
                                                                        className="w-16 h-8 bg-slate-800/70 border-slate-700 text-white text-center"
                                                                        disabled={isSaving}
                                                                    />
                                                                ) : (
                                                                    <span className="inline-block px-3 py-1 rounded-full bg-slate-800 text-cyan-300 text-xs font-bold">
                                                                        {i.qnt_parcelas}x
                                                                    </span>
                                                                )}
                                                            </TableCell>

                                                            <TableCell className="text-orange-400">{formatCurrency(i.valor_parcelas)}</TableCell>

                                                            <TableCell className="text-amber-400">{formatCurrency(i.valor_juros)}</TableCell>

                                                            <TableCell className="font-bold text-2xl bg-linear-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                                                                {formatCurrency(currenty.valor_total)}
                                                            </TableCell>

                                                            <TableCell>
                                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold
                      ${i.taxa_juros! >= 30 ? 'bg-red-500/20 text-red-400' :
                                                                        i.taxa_juros! >= 20 ? 'bg-orange-500/20 text-orange-400' :
                                                                            'bg-emerald-500/20 text-emerald-400'}`}>
                                                                    {i.taxa_juros}%
                                                                </span>
                                                            </TableCell>

                                                            <TableCell className="text-slate-300">
                                                                {isEditing ? (
                                                                    <Input
                                                                        type="date"
                                                                        name="data_inicial"
                                                                        value={currenty.data_inicial || ""}
                                                                        className="w-32 h-8"
                                                                        onChange={editCreditsChange}
                                                                        disabled={isSaving}
                                                                    />
                                                                ) : (
                                                                    i.data_inicial ? (
                                                                        String(currenty.data_inicial)
                                                                            .split('-')
                                                                            .reverse()
                                                                            .join('/')
                                                                    ) : ('-')
                                                                )}
                                                            </TableCell>



                                                            <TableCell className="text-slate-300">
                                                                {currenty.data_final
                                                                    ? (
                                                                        String(currenty.data_final)
                                                                            .split('-')
                                                                            .reverse()
                                                                            .join('/')
                                                                    ) : ('')}
                                                            </TableCell>

                                                            <TableCell className="text-slate-400 font-mono">
                                                                {isEditing ? (
                                                                    <Input
                                                                        type="tel"
                                                                        name="telefone"
                                                                        value={currenty.telefone || ""}
                                                                        className="w-32 h-8"
                                                                        onChange={editCreditsChange}
                                                                        disabled={isSaving}
                                                                    />
                                                                ) : (
                                                                    (i.telefone) ? formatPhone(i.telefone!) : '-'
                                                                )}
                                                            </TableCell>

                                                            <TableCell>
                                                                <div className="flex items-center gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity duration-300">
                                                                    {isEditing ? (
                                                                        <>
                                                                            <Button
                                                                                size="icon" variant="ghost"
                                                                                className="h-9 w-9 text-emerald-400 hover:bg-emerald-500/20"
                                                                                onClick={saveEditCredits}
                                                                                disabled={isSaving}
                                                                            >
                                                                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                                            </Button>
                                                                            <Button
                                                                                size="icon" variant="ghost"
                                                                                className="h-9 w-9 text-slate-400 hover:bg-slate-700"
                                                                                onClick={() => setEditingCredits(null)}
                                                                                disabled={isSaving}
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </Button>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Button
                                                                                size="icon" variant="ghost"
                                                                                className="h-9 w-9 text-cyan-400 hover:bg-cyan-500/20"
                                                                                onClick={() => creditsClick(i)}
                                                                                disabled={!!editingCredits}
                                                                            >
                                                                                <Pencil className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                size="icon" variant="ghost"
                                                                                className="h-9 w-9 text-red-400 hover:bg-red-500/20"
                                                                                onClick={() => handleDelete(i.id!, "credito_longo")}
                                                                                disabled={isDeleting || !!editingCredits}
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

                    <div className="lg:col-span-3 space-y-6">
                        <Card className="border-slate-700/50 bg-linear-to-br from-slate-900/95 via-slate-950/95 to-slate-900/95 backdrop-blur-2xl shadow-2xl overflow-hidden relative group hover:shadow-cyan-500/30 transition-all duration-500 h-[870px] rounded-2xl">
                            <CardHeader className="space-y-3 pb-8">
                                <CardTitle className="text-4xl font-bold bg-linear-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                                    Clientes Mensais ({filteredClients.length})
                                </CardTitle>
                                <CardDescription className="text-slate-400 text-lg">
                                    Comparação entre valor inicial, juros e total por cliente
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="pt-6">
                                <ResponsiveContainer width="110%" height={800} >
                                    <BarChart data={filteredClients} margin={{ top: 20, right: 40, bottom: 120, left: 50 }}>
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
                                            dataKey="nome"
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
                                                    valor_inicial: "Valor Inicial",
                                                    valor_juros: "Juros",
                                                    valor_total: "Total",
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
    )
}