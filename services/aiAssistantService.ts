import { supabase } from "./supabase";
import { hubEstrategicoService } from "./hubEstrategicoService";
import { stockService } from "./stockService";
import { productService } from "./productService";
import { deviceService } from "./deviceService";
import { noteService } from "./noteService";
import { Note } from "./noteService";
import { StrategicEvent, Product, Aparelho } from "../types";
import { dashboardService } from "./dashboardService";

const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").replace("PLACEHOLDER_API_KEY", "");

const tools = [
    {
        type: "function",
        function: {
            name: "criar_agendamento",
            description: "Cria um novo agendamento, compromisso ou reunião na agenda/calendário do ERP.",
            parameters: {
                type: "object",
                properties: {
                    titulo: { type: "string", description: "Título ou assunto do agendamento" },
                    data: { type: "string", description: "Data do evento (formato ISO YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SS)" },
                    tipo: { type: "string", description: "Tipo do agendamento (ex: reuniao, atendimento, manutencao)" },
                    descricao: { type: "string", description: "Descrição ou notas complementares" }
                },
                required: ["titulo", "data"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "consultar_agendamentos",
            description: "Consulta eventos e agendamentos cadastrados na agenda dentro de um intervalo de datas.",
            parameters: {
                type: "object",
                properties: {
                    data_inicio: { type: "string", description: "Data de início no formato YYYY-MM-DD" },
                    data_fim: { type: "string", description: "Data de fim no formato YYYY-MM-DD" }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "consultar_estoque",
            description: "Consulta a quantidade em estoque e detalhes de um produto ou de um aparelho celular.",
            parameters: {
                type: "object",
                properties: {
                    nome_produto: { type: "string", description: "Nome ou modelo do produto ou celular a pesquisar no estoque" }
                },
                required: ["nome_produto"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "atualizar_estoque",
            description: "Realiza movimentação de estoque (entrada ou saída de itens). Ações irreversíveis como zerar estoque devem ser informadas.",
            parameters: {
                type: "object",
                properties: {
                    item_id: { type: "string", description: "ID do produto ou aparelho a atualizar" },
                    quantidade: { type: "number", description: "Quantidade a movimentar" },
                    tipo_movimentacao: { type: "string", enum: ["entrada", "saida"], description: "Sentido da movimentação: entrada ou saida" },
                    motivo: { type: "string", description: "Motivo da movimentação de estoque" },
                    tipo_item: { type: "string", enum: ["produto", "aparelho"], description: "Se o item é um produto geral ou um aparelho celular" }
                },
                required: ["item_id", "quantidade", "tipo_movimentacao", "motivo", "tipo_item"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "criar_tarefa",
            description: "Cria uma nova tarefa ou afazer (to-do) no ERP.",
            parameters: {
                type: "object",
                properties: {
                    titulo: { type: "string", description: "Título da tarefa" },
                    prazo: { type: "string", description: "Data limite para conclusão no formato YYYY-MM-DD (opcional)" },
                    prioridade: { type: "string", enum: ["low", "medium", "high"], description: "Prioridade da tarefa" }
                },
                required: ["titulo"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "listar_tarefas",
            description: "Lista as tarefas (to-do) cadastradas no sistema.",
            parameters: {
                type: "object",
                properties: {
                    status: { type: "string", enum: ["pending", "in_progress", "completed"], description: "Filtrar tarefas por status" }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "salvar_ideia",
            description: "Salva uma anotação ou ideia no hub estratégico do ERP.",
            parameters: {
                type: "object",
                properties: {
                    titulo: { type: "string", description: "Título da anotação/ideia" },
                    conteudo: { type: "string", description: "Conteúdo detalhado" }
                },
                required: ["titulo", "conteudo"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "listar_ideias",
            description: "Lista todas as ideias e anotações estratégicas salvas.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "consultar_vendas",
            description: "Consulta a lista de vendas e pedidos no ERP, permitindo saber quanto foi vendido, métodos de pagamento, datas e clientes.",
            parameters: {
                type: "object",
                properties: {
                    data_inicio: { type: "string", description: "Data de início da consulta (YYYY-MM-DD)" },
                    data_fim: { type: "string", description: "Data de fim da consulta (YYYY-MM-DD)" }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "consultar_resumo_financeiro",
            description: "Consulta métricas e KPIs financeiros consolidados (faturamento total, quantidade de vendas, ticket médio, lucro estimado, comparação com período anterior).",
            parameters: {
                type: "object",
                properties: {
                    data_inicio: { type: "string", description: "Data de início do período no formato YYYY-MM-DD" },
                    data_fim: { type: "string", description: "Data de fim do período no formato YYYY-MM-DD" }
                },
                required: ["data_inicio", "data_fim"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "consultar_clientes",
            description: "Consulta a lista de clientes cadastrados no ERP, permitindo pesquisar por nome ou CPF.",
            parameters: {
                type: "object",
                properties: {
                    nome: { type: "string", description: "Filtro por parte do nome do cliente" },
                    cpf: { type: "string", description: "Filtro pelo CPF exato do cliente" }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "consultar_ordens_servico",
            description: "Consulta a lista de ordens de serviço (OS) e seus status no sistema (ex: Aberto, Em Análise, Pronto p/ Retirada, Concluído).",
            parameters: {
                type: "object",
                properties: {
                    status: { type: "string", description: "Filtro por status específico da OS (ex: Aberto, Pronto p/ Retirada, Concluído, etc.)" }
                },
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "consultar_ranking_vendedores",
            description: "Consulta o ranking de vendas e desempenho por vendedor, incluindo valor vendido, quantidade de pedidos e progresso de metas.",
            parameters: {
                type: "object",
                properties: {
                    data_inicio: { type: "string", description: "Data de início do período (YYYY-MM-DD)" },
                    data_fim: { type: "string", description: "Data de fim do período (YYYY-MM-DD)" }
                },
                required: ["data_inicio", "data_fim"]
            }
        }
    }
];

const systemInstruction = `Você é o Assistente IA do King ERP, um sistema premium de gerenciamento executando com tecnologia OpenAI.
Você ajuda o administrador a interagir com o ERP por texto e voz de maneira fluida e amigável.
Ao interpretar datas relativas, considere a data atual como sendo a que o usuário indicar ou a data de hoje.
Sempre responda de forma resumida e concisa (ideal para ser falado por voz de retorno).
Suas ferramentas/tools permitem ler e escrever no banco de dados. Sempre que o usuário pedir para agendar, verificar estoque, registrar ideias, consultar vendas, ver faturamento, consultar ranking de vendedores, tarefas ou clientes, utilize as funções/ferramentas reais disponíveis em vez de simular ou dizer que não consegue.
Atenção especial com fuso horário e datas: formate as respostas de data de forma amigável no padrão brasileiro (DD/MM/AAAA).`;

export interface ChatMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string | null;
    tool_calls?: any[];
    tool_call_id?: string;
    name?: string;
}

export const aiAssistantService = {
    isKeyConfigured(): boolean {
        return !!OPENAI_API_KEY && OPENAI_API_KEY !== "PLACEHOLDER_API_KEY";
    },

    // Main interaction endpoint
    async sendMessage(
        message: string,
        history: ChatMessage[],
        onRequireConfirmation?: (actionType: string, actionParams: any, onConfirm: () => Promise<any>) => void
    ): Promise<{ text: string; history: ChatMessage[]; pendingAction?: any }> {
        if (!this.isKeyConfigured()) {
            return {
                text: "Olá! A chave OPENAI_API_KEY não foi configurada no seu arquivo .env.local. Por favor, adicione-a para ativar o Assistente IA da OpenAI.",
                history
            };
        }

        // Add user message to history
        const updatedHistory: ChatMessage[] = [
            ...history,
            { role: "user", content: message }
        ];

        try {
            // Call OpenAI API
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemInstruction },
                        ...updatedHistory
                    ],
                    tools,
                    tool_choice: "auto"
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                console.error("OpenAI API error:", errData);
                throw new Error(errData?.error?.message || "HTTP Error calling OpenAI");
            }

            const data = await response.json();
            const choice = data.choices?.[0];
            const responseMessage = choice?.message;

            if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
                const toolCall = responseMessage.tool_calls[0];
                const name = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments || "{}");

                // Check if action requires confirmation
                const isIrreversible = name === "atualizar_estoque" && (args.quantidade === 0 || args.tipo_movimentacao === "saida");

                if (isIrreversible && onRequireConfirmation) {
                    return {
                        text: `Preciso da sua confirmação para prosseguir com a seguinte ação de estoque: ${args.tipo_movimentacao === "saida" ? "Saída" : "Entrada"} de ${args.quantidade} unidade(s). Confirma?`,
                        history: [
                            ...updatedHistory,
                            {
                                role: "assistant",
                                content: null,
                                tool_calls: responseMessage.tool_calls
                            }
                        ],
                        pendingAction: {
                            name,
                            args,
                            callId: toolCall.id
                        }
                    };
                }

                // If not irreversible, execute immediately
                const result = await this.executeTool(name, args);

                // Send tool result back to OpenAI to get final conversational response
                const toolResponseHistory: ChatMessage[] = [
                    ...updatedHistory,
                    {
                        role: "assistant",
                        content: null,
                        tool_calls: responseMessage.tool_calls
                    },
                    {
                        role: "tool",
                        tool_call_id: toolCall.id,
                        name: name,
                        content: JSON.stringify({ result })
                    }
                ];

                const finalResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${OPENAI_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: "gpt-4o-mini",
                        messages: [
                            { role: "system", content: systemInstruction },
                            ...toolResponseHistory
                        ]
                    })
                });

                if (!finalResponse.ok) {
                    throw new Error("HTTP Error calling OpenAI in tool resolution");
                }

                const finalData = await finalResponse.json();
                const finalChoice = finalData.choices?.[0];
                return {
                    text: finalChoice?.message?.content || "Ação executada com sucesso.",
                    history: [
                        ...toolResponseHistory,
                        {
                            role: "assistant",
                            content: finalChoice?.message?.content || "Ação concluída."
                        }
                    ]
                };
            }

            // Standard text response
            return {
                text: responseMessage?.content || "Não entendi muito bem. Pode repetir?",
                history: [
                    ...updatedHistory,
                    {
                        role: "assistant",
                        content: responseMessage?.content || ""
                    }
                ]
            };

        } catch (error) {
            console.error("OpenAI Assistant Error:", error);
            return {
                text: "Desculpe, ocorreu um erro ao processar sua solicitação no Assistente IA.",
                history: [
                    ...updatedHistory,
                    { role: "assistant", content: "Erro ao processar." }
                ]
            };
        }
    },

    // Confirm and resume action execution
    async confirmAction(
        action: any,
        history: ChatMessage[]
    ): Promise<{ text: string; history: ChatMessage[] }> {
        try {
            const result = await this.executeTool(action.name, action.args);

            // Send confirmation outcome to OpenAI
            const toolResponseHistory: ChatMessage[] = [
                ...history,
                {
                    role: "tool",
                    tool_call_id: action.callId,
                    name: action.name,
                    content: JSON.stringify({ result, status: "Confirmado pelo usuário e executado." })
                }
            ];

            const finalResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemInstruction },
                        ...toolResponseHistory
                    ]
                })
            });

            if (!finalResponse.ok) {
                throw new Error("HTTP Error calling OpenAI in confirmation resolution");
            }

            const finalData = await finalResponse.json();
            const finalChoice = finalData.choices?.[0];
            return {
                text: finalChoice?.message?.content || "Ação confirmada e concluída.",
                history: [
                    ...toolResponseHistory,
                    {
                        role: "assistant",
                        content: finalChoice?.message?.content || "Ação concluída."
                    }
                ]
            };
        } catch (error) {
            console.error("OpenAI confirmation error:", error);
            return {
                text: "Erro ao executar ação confirmada.",
                history
            };
        }
    },

    // Execute actual tools mapped to ERP service functions
    async executeTool(name: string, args: any): Promise<any> {
        console.log(`[ERP OpenAI Agent] Executing tool: ${name}`, args);

        switch (name) {
            case "criar_agendamento": {
                const event: Partial<StrategicEvent> = {
                    titulo: args.titulo,
                    data: args.data,
                    tipo: args.tipo || "reuniao",
                    descricao: args.descricao || ""
                };
                return await hubEstrategicoService.upsertEvent(event);
            }

            case "consultar_agendamentos": {
                const events = await hubEstrategicoService.getEvents();
                if (args.data_inicio || args.data_fim) {
                    const start = args.data_inicio ? new Date(args.data_inicio).getTime() : 0;
                    const end = args.data_fim ? new Date(args.data_fim).getTime() : Infinity;
                    return events.filter(e => {
                        const t = new Date(e.data).getTime();
                        return t >= start && t <= end;
                    });
                }
                return events.slice(0, 10);
            }

            case "consultar_estoque": {
                const queryStr = `%${args.nome_produto}%`;
                
                // Query general products
                const { data: prods } = await supabase
                    .from("products")
                    .select("*")
                    .ilike("name", queryStr);

                // Query devices
                const { data: devs } = await supabase
                    .from("aparelhos")
                    .select("*")
                    .ilike("modelo", queryStr);

                return {
                    produtos: prods || [],
                    celulares: devs || []
                };
            }

            case "atualizar_estoque": {
                // Update stock manual movement
                const isProduct = args.tipo_item === "produto";
                let productName = "";

                if (isProduct) {
                    const { data } = await supabase.from("products").select("name").eq("id", args.item_id).single();
                    productName = data?.name || "Produto Geral";
                } else {
                    const { data } = await supabase.from("aparelhos").select("modelo").eq("id", args.item_id).single();
                    productName = data?.modelo || "Aparelho";
                }

                await stockService.addMovement({
                    productId: isProduct ? args.item_id : undefined,
                    aparelhoId: isProduct ? undefined : args.item_id,
                    productName,
                    type: args.tipo_movimentacao,
                    quantity: args.quantidade,
                    reason: args.motivo || "Ajuste via Assistente IA"
                });

                return { success: true, message: "Movimentação registrada com sucesso!" };
            }

            case "criar_tarefa": {
                const task: Omit<Note, "id" | "created_at" | "user_id"> = {
                    title: args.titulo,
                    content: "",
                    type: "plan",
                    status: "pending",
                    priority: args.prioridade || "medium",
                    deadline: args.prazo || undefined
                };
                return await noteService.create(task);
            }

            case "listar_tarefas": {
                const notes = await noteService.getAll();
                const tasks = notes.filter(n => n.type === "plan");
                if (args.status) {
                    return tasks.filter(t => t.status === args.status);
                }
                return tasks;
            }

            case "salvar_ideia": {
                const idea: Omit<Note, "id" | "created_at" | "user_id"> = {
                    title: args.titulo,
                    content: args.conteudo,
                    type: "idea",
                    status: "pending",
                    priority: "medium"
                };
                return await noteService.create(idea);
            }

            case "listar_ideias": {
                const notes = await noteService.getAll();
                return notes.filter(n => n.type === "idea");
            }

            case "consultar_vendas": {
                let query = supabase.from('vendas').select('*, itens:vendas_itens(*)').order('created_at', { ascending: false });
                if (args.data_inicio) query = query.gte('created_at', args.data_inicio);
                if (args.data_fim) query = query.lte('created_at', args.data_fim + 'T23:59:59');
                const { data, error } = await query;
                if (error) throw error;
                return data || [];
            }

            case "consultar_resumo_financeiro": {
                if (!args.data_inicio || !args.data_fim) {
                    throw new Error("Parâmetros data_inicio e data_fim são necessários.");
                }
                return await dashboardService.getDashboardStats(args.data_inicio, args.data_fim);
            }

            case "consultar_clientes": {
                let query = supabase.from('clients').select('*').order('created_at', { ascending: false });
                if (args.nome) query = query.ilike('nome', `%${args.nome}%`);
                if (args.cpf) query = query.eq('cpf', args.cpf);
                const { data, error } = await query;
                if (error) throw error;
                return data || [];
            }

            case "consultar_ordens_servico": {
                let query = supabase.from('service_orders').select('*').order('created_at', { ascending: false });
                if (args.status) query = query.eq('status', args.status);
                const { data, error } = await query;
                if (error) throw error;
                return data || [];
            }

            case "consultar_ranking_vendedores": {
                if (!args.data_inicio || !args.data_fim) {
                    throw new Error("Parâmetros data_inicio e data_fim são necessários.");
                }
                return await dashboardService.getSellersRanking(args.data_inicio, args.data_fim);
            }

            default:
                throw new Error(`Tool not found: ${name}`);
        }
    }
};
