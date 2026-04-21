


// Formato dos dados da coluna no db 
export type ClienteData = {
    id?: string
    nome?: string
    valor_inicial?: number | string
    valor_juros?: number | string
    valor_total?: number | string
    data_inicial?: number | string
    data_final?: number | string | undefined
    telefone?: string
}

export type CreditData = {
    id?: string
    nome?: string | undefined
    opcoes_credito?: string
    valor_inicial?: number | string
    valor_juros?: number | string
    valor_total?: number | string
    data_inicial?: number | string
    data_final?: number | string | undefined
    qnt_parcelas?: number | string
    valor_parcelas?: number | string
    taxa_juros?: number | undefined
    telefone?: string
}

export type CashFlowData = {
    valor_entrada?: number | string
    valor_saida?: number | string
    valor_saldo?: number | string
    periodo?: number | string
}
export type ControlData = {
    receita?: number | string
    despesas_obrigatorias?: number | string
    despesas_variaveis?: number | string
    saldo?: number | string
    periodo?: number | string
}

export type InvestmentData = {
    id?: string
    instituicao?: string
    opcao_investimento?: string
    valor_inicial?: number | string
    valor_juros?: number | string
    valor_total?: number | string
    taxa_juros?: number | undefined
    periodo?: number | string


}

//============= Utilitario r funções usado no Header
export const months = [
    "Todos",
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
]

export const navItems = [
    { name: "HOME", href: "/home" },
    { name: "CLIENT", href: "/clients" },
    { name: "INVESTMENT", href: "/investment" },

]
// Funções de periodos 
export const isDateInPeriod = (dataString: string | number, period: string) => {
    if (period === "Todos") return true

    const months: Record<string, number> = {
        "Janeiro": 0,
        "Fevereiro": 1,
        "Março": 2,
        "Abril": 3,
        "Maio": 4,
        "Junho": 5,
        "Julho": 6,
        "Agosto": 7,
        "Setembro": 8,
        "Outubro": 9,
        "Novembro": 10,
        "Dezembro": 11,
    }
    const selectedMonth = months[period]
    if (selectedMonth === undefined) return true
    const date = new Date(dataString)
    const month = date.getMonth()
    return month === selectedMonth
}

// Funções para q editar o dia mes 1 mes
export const calculateDateEnd = (dataInicial: string): string => {
    if (!dataInicial) return ""
    const data = new Date(dataInicial)
    data.setMonth(data.getMonth() + 1)
    return data.toISOString().split('T')[0]
}

export const calculateDateEndLong = (dataInicial: string, meses: number): string => {
    if (!dataInicial || meses <= 0) return ""
    const data = new Date(dataInicial)
    const dia = data.getDate()
    data.setMonth(data.getMonth() + meses)
    if (data.getDate() !== dia && data.getDate() < dia) {
        data.setDate(0)
    }

    return data.toISOString().split('T')[0]
}

export function formatCurrency(value: string | number | undefined) {
    const num = Number(value) || 0
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export const formatPhone = (phone: string) =>
    phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')


export const formatCurrencyRegister = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(Number(numbers) / 100);
    return formatted;
};

export const toNumber = (value: string) => {
    return Number(value.replace(/\D/g, '')) / 100;
};


export const handleCurrencyInput = (raw: string, setMask: (v: string) => void) => {
    const digits = raw.replace(/\D/g, '');
    const number = digits === '' ? 0 : Number(digits) / 100;
    const formatted = formatCurrency(number);
    setMask(formatted);
};

export const maskedToNumber = (masked: string): number => {
    if (!masked) return 0;
    return Number(masked.replace(/\D+/g, '')) / 100;
};








