"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Bell, Plus, User, LogOut } from "lucide-react"
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
} from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ClienteData, CreditData, InvestmentData, months, navItems } from "@/utils"
import { useMemo } from "react"


interface Props {
    onSearch?: (value: string) => void
    onPeriod?: (value: string) => void
    bellCredit?: CreditData[]
    bellClients?: ClienteData[]
    bellnvest?: InvestmentData[]
}

export default function Header({ onSearch, onPeriod, bellCredit, bellClients, bellnvest }: Props) {
    const pathname = usePathname()
    const router = useRouter()

    const bell = useMemo(() => {
        const hoje = new Date()
        const lista: {
            tipo: string
            nome: string | undefined
            vencimento?: string
            valor?: string | undefined
            juros?: string | undefined
            taxa?: string | undefined
            dias?: number | undefined
        }[] = []

        if (bellCredit && bellCredit.length > 0) {
            const creditVenc = bellCredit
                .filter((c) => c.data_final)
                .map((c) => {
                    const [ano, mes, dia] = c.data_final.split('-').map(Number)
                    const dataVenc = new Date(ano, mes - 1, dia)
                    const finalDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                    return {
                        tipo: "Credit",
                        nome: c.nome,
                        vencimento: dataVenc.toLocaleDateString("pt-BR"),
                        valor: c.valor_total ? `R$ ${Number(c.valor_total).toLocaleString("pt-BR")}` : "_",
                        juros: c.valor_juros ? `R$ ${Number(c.valor_juros).toLocaleString("pt-BR")}` : "_",
                        taxa: "_",
                        dias: finalDias
                    }
                })
                .filter((item) => item.dias >= -10 && item.dias <= 5)
            lista.push(...creditVenc)
        }

        if (bellClients && bellClients.length > 0) {
            const clientsVenc = bellClients
                .filter((c) => c.data_final)
                .map((c) => {
                    const [ano, mes, dia] = c.data_final.split('-').map(Number)
                    const dataVenc = new Date(ano, mes - 1, dia)
                    const finalDias = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
                    return {
                        tipo: "Client",
                        nome: c.nome,
                        vencimento: dataVenc.toLocaleDateString("pt-BR"),
                        valor: c.valor_total ? `R$ ${Number(c.valor_total).toLocaleString("pt-BR")}` : "_",
                        juros: c.valor_juros ? `R$ ${Number(c.valor_juros).toLocaleString("pt-BR")}` : "_",
                        taxa: "_",
                        dias: finalDias
                    }
                })

                .filter((item) => item.dias >= -10 && item.dias <= 5)
            lista.push(...clientsVenc)
        }

        if (bellnvest && bellnvest.length > 0) {
            const investimentos = bellnvest.map((i) => ({
                tipo: "Investimento",
                nome: i.instituicao,
                valor: i.valor_juros ? `R$ ${Number(i.valor_total).toLocaleString("pt-BR")}` : "_",
                taxa: i.taxa_juros ? `${Number(i.taxa_juros).toLocaleString("pt-BR")}%` : "_",
            }))
            lista.push(...investimentos)
        }

        return lista.sort((a, b) => {
            if (a.dias == null) return 1
            if (b.dias == null) return -1
            return a.dias - b.dias
        })
    }, [bellCredit, bellClients, bellnvest])

    const tiposPermitidos = useMemo(() => {
        if (pathname === "/investment") return ["Investimento"]
        if (pathname === "/client") return ["Credit", "Client"]
        return ["Credit", "Client"]
    }, [pathname])

    const onSubmit = async () => {
        try {
            const res = await fetch("/api/auth", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'logout' })
            })
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}))
                throw new Error(errorData.error || `Erro ${res.status}: ${res.statusText}`)
            }
            window.location.href = "/login"
        } catch {
            router.push("/login")
        }
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-linear-to-r from-blue-950 via-blue-900 to-blue-950 backdrop-blur-xl bg-white/5">
            <div className="flex h-16 items-center justify-between px-6 lg:px-8">

                <div className="flex items-center gap-8">

                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item, index) => (
                            <div key={item.href} className="flex items-center">
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "relative px-4 py-2 text-sm font-semibold tracking-wide text-white/90 transition-all duration-300 rounded-lg",
                                        pathname === item.href
                                            ? "text-white bg-white/10 shadow-sm backdrop-blur-sm"
                                            : "hover:text-white hover:bg-white/5"
                                    )}
                                >
                                    {item.name}
                                    {pathname === item.href && (
                                        <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 bg-white rounded-full" />
                                    )}
                                </Link>
                                {index < navItems.length - 1 && (
                                    <div className="mx-3 h-5 w-px bg-white/20" />
                                )}
                            </div>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <div className="relative w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60 transition-colors" />
                            <Input
                                type="text"
                                placeholder={
                                    pathname === "/investment" ? "Buscar investimento..." : "Buscar cliente..."
                                }
                                className="h-10 pl-10 bg-white/10 border border-white/20 text-white placeholder:text-white/50 rounded-xl backdrop-blur-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                                onChange={(e) => onSearch?.(e.target.value)}
                            />
                        </div>

                        <Select onValueChange={onPeriod} defaultValue="Todos">
                            <SelectTrigger className="h-10 w-36 bg-white/10 border border-white/20 text-white rounded-xl backdrop-blur-sm focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all">
                                <SelectValue placeholder="Período" />
                            </SelectTrigger>
                            <SelectContent className="bg-blue-950/95 border border-white/20 backdrop-blur-xl rounded-xl">
                                {months.map((month) => (
                                    <SelectItem
                                        key={month}
                                        value={month}
                                        className="text-white hover:bg-white/10 focus:bg-white/10 rounded-lg"
                                    >
                                        {month}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-2">

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            >
                                <Bell className="h-5 w-5" />
                                {bell.length > 0 && (
                                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-blue-950 animate-pulse" />
                                )}
                            </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-80 p-0 border border-white/10 bg-linear-to-br from-blue-950/95 to-blue-900/95 backdrop-blur-xl rounded-2xl shadow-2xl" align="end">
                            <div className="p-4 border-b border-white/10">
                                <h4 className="text-sm font-bold text-white">Vencimentos Próximos</h4>
                            </div>
                            <ScrollArea className="h-72 p-4">
                                <div className="space-y-3">
                                    {bell
                                        .filter((i) => tiposPermitidos.includes(i.tipo))
                                        .map((i, index) => {
                                            const isVencido = i.dias !== undefined && i.dias < 0 && i.dias >= -10
                                            const isAte5Dias = i.dias !== undefined && i.dias >= 0 && i.dias <= 5

                                            return (
                                                <div
                                                    key={index}
                                                    className={cn(
                                                        "p-3 rounded-xl border transition-all",
                                                        isVencido
                                                            ? "bg-red-500/20 border-red-400/50 hover:bg-red-500/25"
                                                            : isAte5Dias
                                                                ? "bg-emerald-500/10 border-emerald-400/30 hover:bg-emerald-500/15"
                                                                : "bg-white/5 border-white/10 hover:bg-white/10"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className={cn(
                                                            isVencido
                                                                ? "text-red-400"
                                                                : isAte5Dias
                                                                    ? "text-emerald-400"
                                                                    : "text-white/60"
                                                        )}>
                                                            {i.tipo}
                                                        </span>

                                                        {i.dias !== undefined && (
                                                            <span
                                                                className={cn(
                                                                    "font-bold",
                                                                    isVencido
                                                                        ? "text-red-400"
                                                                        : isAte5Dias
                                                                            ? "text-emerald-400"
                                                                            : "text-emerald-400"
                                                                )}
                                                            >
                                                                {i.dias < 0
                                                                    ? `Vencido há ${Math.abs(i.dias)} dias`
                                                                    : i.dias === 0
                                                                        ? "Vence hoje"
                                                                        : `${i.dias} dias`}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className={cn(
                                                        "mt-1 font-medium",
                                                        isVencido
                                                            ? "text-red-300"
                                                            : isAte5Dias
                                                                ? "text-emerald-300"
                                                                : "text-white"
                                                    )}>
                                                        {i.nome}
                                                    </p>

                                                    <div className="flex items-center justify-between mt-2 text-xs">
                                                        <span className={cn(
                                                            isVencido
                                                                ? "text-red-400/80"
                                                                : isAte5Dias
                                                                    ? "text-emerald-400/80"
                                                                    : "text-white/60"
                                                        )}>
                                                            {i.vencimento}
                                                        </span>

                                                        {(i.valor || i.juros || i.taxa) && (
                                                            <div className="text-right">
                                                                {i.valor && (
                                                                    <p className={cn(
                                                                        "font-semibold",
                                                                        isVencido
                                                                            ? "text-red-300"
                                                                            : isAte5Dias
                                                                                ? "text-emerald-300"
                                                                                : "text-white"
                                                                    )}>
                                                                        {i.valor}
                                                                    </p>
                                                                )}

                                                                {i.juros && (
                                                                    <p className={cn(
                                                                        "text-[10px]",
                                                                        isVencido
                                                                            ? "text-red-400/80"
                                                                            : isAte5Dias
                                                                                ? "text-emerald-400/80"
                                                                                : "text-white/60"
                                                                    )}>
                                                                        Juros: {i.juros}
                                                                    </p>
                                                                )}

                                                                {i.taxa && (
                                                                    <p className={cn(
                                                                        "text-[10px]",
                                                                        isVencido
                                                                            ? "text-red-400/80"
                                                                            : isAte5Dias
                                                                                ? "text-emerald-400/80"
                                                                                : "text-white/60"
                                                                    )}>
                                                                        Taxa: {i.taxa}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}

                                    {bell.filter(i => tiposPermitidos.includes(i.tipo)).length === 0 && (
                                        <p className="text-center text-white/50 text-sm py-8">
                                            Nenhum vencimento próximo
                                        </p>
                                    )}
                                </div>
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="gap-2 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                                <Plus className="h-4 w-4" />
                                Adicionar
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-blue-950/95 border border-white/20 backdrop-blur-xl rounded-xl">
                            <DropdownMenuLabel className="text-white/90">Adicionar Novo</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/20" />
                            {[
                                { href: "/register/client", label: "Cliente Mensal" },
                                { href: "/register/credit", label: "Credito Longo" },
                                { href: "/register/control", label: "Controle de Gastos" },
                                { href: "/register/cashFlow", label: "Fluxo Caixa" },
                                { href: "/register/investment", label: "Investimento" },
                            ].map((item) => (
                                <Link key={item.href} href={item.href}>
                                    <DropdownMenuItem className="text-white hover:bg-white/10 rounded-lg mx-1 my-1">
                                        <Plus className="mr-2 h-4 w-4" />
                                        {item.label}
                                    </DropdownMenuItem>
                                </Link>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden ring-2 ring-white/20 hover:ring-white/40 transition-all">
                                <Avatar className="h-full w-full">
                                    <AvatarImage src="/usuario.jpg" alt="Usuário" className="object-cover" />
                                    <AvatarFallback className="bg-linear-to-br from-blue-600 to-blue-800 text-white">
                                        <User className="h-5 w-5" />
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-64 bg-linear-to-br from-blue-950/95 to-blue-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl" align="end">
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-2 p-2">
                                    <p className="text-sm font-bold text-white">Adm</p>
                                    <p className="text-xs text-white/60">adm@adm.com</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/20" />
                            <DropdownMenuItem
                                onClick={onSubmit}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 focus:bg-red-500/10 rounded-lg mx-1 cursor-pointer transition-colors"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sair
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                </div>
            </div>
        </header>
    )
}