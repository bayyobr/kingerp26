import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, api-key, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const PARTNER_ID = 1224946;
const PARTNER_KEY = "shpk6d6d68525459726d5a7348534376724b516c576d5061744e6d5345536a59";

// O Redirect URL da Shopee agora aponta de volta para esta própria função
const FUNCTION_URL = "https://wygvuhfmfhqrmejnhjkr.supabase.co/functions/v1/shopee-auth";
const APP_URL = "https://kingerp26-qlnl.vercel.app";

async function generateSignature(path: string, timestamp: number) {
    const baseString = `${PARTNER_ID}${path}${timestamp}`;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(PARTNER_KEY);
    const data = encoder.encode(baseString);

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
    return Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
}

serve(async (req) => {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // GET Handler: Callback Direto da Shopee
        if (req.method === "GET") {
            const code = url.searchParams.get("code");
            const shopId = url.searchParams.get("shop_id");

            if (code && shopId) {
                console.log(`[INFO] Processando callback Shopee para shopId: ${shopId}`);
                const timestamp = Math.floor(Date.now() / 1000);
                const host = "https://partner.test-stable.shopeemobile.com";
                const path = "/api/v2/auth/token/get";
                const sign = await generateSignature(path, timestamp);

                const response = await fetch(`${host}${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code, partner_id: PARTNER_ID, shop_id: Number(shopId) }),
                });

                const data = await response.json();
                if (data.error) throw new Error(`Shopee Error: ${data.message || data.error}`);

                // Salva no banco usando Service Role (pula RLS)
                const { error: dbError } = await supabase
                    .from("integrations")
                    .upsert({
                        provider: "shopee",
                        shop_id: String(data.shop_id),
                        access_token: data.access_token,
                        refresh_token: data.refresh_token,
                        expires_at: new Date(Date.now() + data.expire_in * 1000).toISOString(),
                        updated_at: new Date().toISOString(),
                    }, { onConflict: 'shop_id' });

                if (dbError) throw dbError;

                // Sucesso! Redireciona para o app
                return new Response(null, {
                    status: 302,
                    headers: { Location: `${APP_URL}/#/integracoes/shopee?success=true` }
                });
            }
        }

        // POST Handler: Gerar URL ou Ações do App
        if (req.method === "POST") {
            const body = await req.json();
            const { action } = body;

            if (action === "get_auth_url") {
                console.log("[INFO] Gerando URL de Autorização");
                const timestamp = Math.floor(Date.now() / 1000);
                const host = "https://partner.test-stable.shopeemobile.com";
                const path = "/api/v2/shop/auth_partner";
                const sign = await generateSignature(path, timestamp);

                const authUrl = `${host}${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(FUNCTION_URL)}`;
                
                return new Response(JSON.stringify({ url: authUrl }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
        }

        return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400, headers: corsHeaders });

    } catch (error: any) {
        console.error(`[FATAL] ${error.message}`);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }
});
