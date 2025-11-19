import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";


export async function POST(req: Request) {
    try {
        const cookieStore = await cookies();
        const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

        const { email, password, action } = await req.json();

        if (action === "login") {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password,
            });

            if (error) {
                return NextResponse.json({ error: error.message }, { status: 400 });
            }

            return NextResponse.json({ message: "Login realizado", user: data.user });
        }

        if (action === "logout") {
            await supabase.auth.signOut();
            return NextResponse.json({ message: "Logout realizado com sucesso" });
        }

        return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
    } catch (err: unknown) {
        console.error("Erro na rota /api/auth:", err);
        return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
    }
}

