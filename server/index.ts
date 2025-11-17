

 export async function fetchDataServer() {
    try {
        const res = await fetch("/api/admin", { cache: "no-store" })
        if (!res.ok) throw new Error("Error ao carregar dados")
        const json = await res.json()
        return {
            clients: json.serverClients || [],
            credits: json.serverCredits || [],
            cashFlow: json.serverCashFlow || [],
            control: json.serverControl || [],
            invest: json.serverInvestment || [],
        }
    } catch (err) {
        console.error("Erro ao buscar dados", err)
        throw err
    }
} 


