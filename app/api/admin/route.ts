import { supabase } from "@/lib/supabaseClient";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const allowesTables = ["investimento", "cliente", "credito_longo"]

const serverClientSchema = z.object({
    nome: z.string().min(2),
    valorInicial: z.union([z.string(), z.number()]),
    valorJuros: z.union([z.string(), z.number()]),
    valorTotal: z.union([z.string(), z.number()]).optional(),
    dataInicial: z.string().min(1),
    dataEntrega: z.string().optional(),
    telefone: z.string().min(10),
})

const serverCreditSchema = z.object({
    nome: z.string().min(2),
    opcoes_credito: z.string().min(2),
    valorInicial: z.union([z.string(), z.number()]),
    qntParcelas: z.union([z.string(), z.number()]),
    valorParcelas: z.union([z.string(), z.number()]),
    valorJuros: z.union([z.string(), z.number()]).optional(),
    valorTotal: z.union([z.string(), z.number()]),
    txJuros: z.union([z.string(), z.number()]).optional(),
    dataInicio: z.string().min(1),
    dataEntrega: z.string().optional(),
    telefone: z.string().min(10),
})

const serverCashFlowSchema = z.object({
    periodo: z.string().min(1),
    valorEntrada: z.number(),
    valorSaida: z.number(),
    valorSaldo: z.number().optional(),
})

const serverControlSchema = z.object({
    periodo: z.string().min(1),
    valorReceita: z.union([z.string(), z.number()]),
    despesaObrigatoria: z.union([z.string(), z.number()]),
    despesaVariaveis: z.union([z.string(), z.number()]),
    valorSaldo: z.union([z.string(), z.number()]).optional(),
})

const serverInvestmentSchema = z.object({
    instituicao: z.string().min(2),
    opcoes_investimento: z.string().min(2),
    valorInicial: z.union([z.string(), z.number()]),
    valorJuros: z.union([z.string(), z.number()]).optional(),
    valorTotal: z.union([z.string(), z.number()]),
    txJuros: z.union([z.string(), z.number()]).optional(),
    periodo: z.string().min(1),
})

const registerSchema = z.object({
    type: z.enum(["cashFlow", "client", "investment", "credit", "control"]),
    data: z.union([
        serverCashFlowSchema,
        serverClientSchema,
        serverCreditSchema,
        serverControlSchema,
        serverInvestmentSchema,

    ]),
})



/* Select */
export async function GET() {
    try {

        const { data: serverClients, error: errorCliente } = await supabase
            .from("cliente")
            .select("*")
            .order("data_final");

        if (errorCliente) {
            console.error("Erro ao buscar clientes:", errorCliente.message);
            return NextResponse.json(
                { error: "Erro ao buscar dados de clientes", details: errorCliente.message },
                { status: 500 }
            );
        }

        const { data: serverCredits, error: errorCredito } = await supabase
            .from("credito_longo")
            .select("*")
            .order("data_final");

        if (errorCredito) {
            console.error("Erro ao buscar crédito longo:", errorCredito.message);
            return NextResponse.json(
                { error: "Erro ao buscar dados de crédito longo", details: errorCredito.message },
                { status: 500 }
            );
        }

        const { data: serverCashFlow, error: errorcashFlow } = await supabase
            .from("fluxo_caixa")
            .select("*");

        if (errorcashFlow) {
            console.error("Erro ao buscar fluxo caixa:", errorcashFlow.message);
            return NextResponse.json(
                { error: "Erro ao buscar dados de fluxo caixa", details: errorcashFlow.message },
                { status: 500 }
            );
        }

        const { data: serverControl, error: errorcontrol } = await supabase
            .from("controle_gasto")
            .select("*");

        if (errorcontrol) {
            console.error("Erro ao buscar controle de gastos:", errorcontrol.message);
            return NextResponse.json(
                { error: "Erro ao buscar dados de controle de gastos", details: errorcontrol.message },
                { status: 500 }
            );
        }

        const { data: serverInvestment, error: errorinvestimneto } = await supabase
            .from("investimento")
            .select("*");

        if (errorinvestimneto) {
            console.error("Erro ao buscar investimneto:", errorinvestimneto.message);
            return NextResponse.json(
                { error: "Erro ao buscar dados de investimneto", details: errorinvestimneto.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { serverClients, serverCredits, serverCashFlow, serverControl, serverInvestment },
            { status: 200 }
        );
    } catch (err: unknown) {
        console.error("Erro inesperado:", err);
        const errorMessage = err instanceof Error ? err.message : String(err);
        return NextResponse.json(
            { error: "Erro inesperado", details: errorMessage },
            { status: 500 }
        );
    }
}

/* Update */
export async function PUT(request: NextRequest) {

    try {
        const body = await request.json()
        const { id, table, ...updateData } = body
        if (!table) {
            return NextResponse.json({ error: 'Nome da tabela é obrigatório' }, { status: 400 });
        } if (!id) {
            return NextResponse.json({ error: 'Nome da id é obrigatório' }, { status: 400 });
        } if (!allowesTables.includes(table)) {
            return NextResponse.json({ error: 'Tabela não permitida' }, { status: 403 });
        }
        const { data, error } = await supabase
            .from(table)
            .update(updateData)
            .eq('id', id)
            .select()
            .single()
        if (error) {
            console.error('Erro no Supabase:', error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ success: data });
    } catch (err: unknown) {
        console.error('Erro na API update:', err);
        return NextResponse.json({ error: 'Erro ao atualizar dados' }, { status: 500 });
    }
}

/* Dellete */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const table = searchParams.get("table");

        if (!table) {
            return NextResponse.json({ error: "Tabela é obrigatória" }, { status: 400 });
        }

        if (!id) {
            return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
        }


        if (!allowesTables.includes(table)) {
            return NextResponse.json({ error: "Tabela não permitida" }, { status: 403 });
        }

        const { error } = await supabase.from(table).delete().eq("id", id);

        if (error) {
            console.error("Erro no Supabase:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Erro na API DELETE:", err);
        return NextResponse.json({ error: "Erro ao excluir dados" }, { status: 500 });
    }
}

/* Registe */
export async function POST(req: Request) {
    try {
        const json = await req.json()

        const unifiedParse = registerSchema.safeParse(json)
        if (unifiedParse.success) {
            const { type, data } = unifiedParse.data

            if (type === "client") {
                const clientData = data as z.infer<typeof serverClientSchema>
                const {
                    nome,
                    valorInicial,
                    valorJuros,
                    valorTotal,
                    dataInicial,
                    dataEntrega,
                    telefone,
                } = clientData
                const { data: result, error } = await supabase.from("cliente").insert([
                    {
                        nome,
                        valor_inicial: valorInicial,
                        valor_juros: valorJuros,
                        valor_total: valorTotal,
                        data_inicial: dataInicial,
                        data_final: dataEntrega,
                        telefone,
                    },
                ])
                if (error)
                    return NextResponse.json(
                        { error: "Erro ao inserir cliente", details: error.message },
                        { status: 500 }
                    )

                return NextResponse.json({ ok: true, type: "client", data: result }, { status: 201 })
            }

            if (type === "credit") {
                const creditData = data as z.infer<typeof serverCreditSchema>
                const {
                    nome,
                    opcoes_credito,
                    valorInicial,
                    qntParcelas,
                    valorParcelas,
                    valorJuros,
                    valorTotal,
                    txJuros,
                    dataInicio,
                    dataEntrega,
                    telefone,
                } = creditData

                const { data: result, error } = await supabase.from("credito_longo").insert([
                    {
                        nome,
                        opcoes_credito,
                        valor_inicial: valorInicial,
                        qnt_parcelas: qntParcelas,
                        valor_parcelas: valorParcelas,
                        valor_juros: valorJuros,
                        valor_total: valorTotal,
                        taxa_juros: txJuros,
                        data_inicial: dataInicio,
                        data_final: dataEntrega,
                        telefone,
                    },
                ])

                if (error)
                    return NextResponse.json(
                        { error: "Erro ao inserir crédito longo", details: error.message },
                        { status: 500 }
                    )
                return NextResponse.json({ ok: true, type: "credit", data: result }, { status: 201 })



            }

            if (type === "cashFlow") {
                const cashFlowData = data as z.infer<typeof serverCashFlowSchema>
                const { periodo, valorEntrada, valorSaida, valorSaldo } = cashFlowData

                const { data: result, error } = await supabase.from("fluxo_caixa").insert([
                    {
                        periodo,
                        valor_entrada: valorEntrada,
                        valor_saida: valorSaida,
                        valor_saldo: valorSaldo,
                    },
                ])

                if (error)
                    return NextResponse.json(
                        { error: "Erro ao inserir fluxo de caixa", details: error },
                        { status: 500 }
                    )

                return NextResponse.json({ ok: true, type: "cashFlow", data: result }, { status: 201 })
            }

            if (type === "control") {
                const controlData = data as z.infer<typeof serverControlSchema>
                const {
                    periodo,
                    valorReceita,
                    despesaObrigatoria,
                    despesaVariaveis,
                    valorSaldo
                } = controlData
                const { data: result, error } = await supabase.from("controle_gasto").insert([
                    {

                        periodo: periodo,
                        receita: valorReceita,
                        despesas_obrigatorias: despesaObrigatoria,
                        despesas_variaveis: despesaVariaveis,
                        saldo: valorSaldo,
                    }
                ])
                if (error)
                    return NextResponse.json(
                        { error: "Erro ao inserir controle de gastos pessoais", details: error.message },
                        { status: 500 }
                    )
                return NextResponse.json({ ok: true, type: "control", data: result }, { status: 201 })
            }

            if (type === "investment") {
                const investmentData = data as z.infer<typeof serverInvestmentSchema>
                const {
                    instituicao,
                    opcoes_investimento,
                    valorInicial,
                    valorJuros,
                    valorTotal,
                    txJuros,
                    periodo,
                } = investmentData

                const { data: result, error } = await supabase.from("investimento").insert([
                    {
                        instituicao,
                        opcao_investimento: opcoes_investimento,
                        valor_inicial: valorInicial,
                        valor_juros: valorJuros,
                        valor_total: valorTotal,
                        taxa_juros: txJuros,
                        periodo,
                    },
                ])

                if (error)
                    return NextResponse.json(
                        { error: "Erro ao inserir investimento", details: error.message },
                        { status: 500 }
                    )

                return NextResponse.json({ ok: true, type: "investment", data: result }, { status: 201 })
            }

        } const trySchemas = [
            { schema: serverClientSchema, type: "client", table: "cliente" },
            { schema: serverCreditSchema, type: "credit", table: "credito_longo" },
            { schema: serverCashFlowSchema, type: "cashFlow", table: "fluxo_caixa" },
            { schema: serverControlSchema, type: "control", table: "controle_gasto" },
            { schema: serverInvestmentSchema, type: "investment", table: "investimento" },
        ]

        for (const { schema, type, table } of trySchemas) {
            const parse = schema.safeParse(json)
            if (parse.success) {
                const data = parse.data
                const { data: result, error } = await supabase.from(table).insert([data])

                if (error)
                    return NextResponse.json(
                        { error: `Erro ao inserir ${type}`, details: error.message },
                        { status: 500 }
                    )

                return NextResponse.json({ ok: true, type, data: result }, { status: 201 })
            }
        }

    } catch (err) {
        console.error("💥 Erro interno:", err)
        return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
    }
}



