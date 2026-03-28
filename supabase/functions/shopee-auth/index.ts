import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, api-key, content-type",
};

const PARTNER_ID = 1224946;
const PARTNER_KEY = "shpk6d6d68525459726d5a7348534376724b516c576d5061744e6d5345536a59";
const REDIRECT_URL = "https://kingerp26-qlnl.vercel.app/#/integracoes/shopee/callback";

async function generateSignature(path: string, timestamp: number) {
    const baseString = `${PARTNER_ID}${path}${timestamp}`;
    console.log(`[DEBUG] generateSignature -> path: ${path}, timestamp: ${timestamp}`);
    console.log(`[DEBUG] generateSignature -> baseString: ${baseString}`);

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(PARTNER_KEY),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(baseString)
    );
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    return signatureArray.map((b) => b.toString(16).padStart(2, "0")).join("");
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

        // Keep GET for direct Shopee callback if used
        if (req.method === "GET" && url.searchParams.has("code")) {
            const code = url.searchParams.get("code")!;
            const shopId = url.searchParams.get("shop_id")!;

            const timestamp = Math.floor(Date.now() / 1000);
            const host = "https://partner.test-stable.shopeemobile.com";
            const path = "/api/v2/auth/token/get";

            const sign = await generateSignature(path, timestamp);

            const response = await fetch(
                `${host}${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        code,
                        partner_id: PARTNER_ID,
                        shop_id: Number(shopId),
                    }),
                }
            );

            const data = await response.json();

            if (data.error) {
                return new Response(`Erro Shopee: ${data.message || data.error}`, { status: 400 });
            }

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

            return new Response(null, {
                status: 302,
                headers: {
                    Location: "https://kingerp26-qlnl.vercel.app/#/integracoes/shopee?success=true",
                },
            });
        }

        if (req.method === "POST") {
            const body = await req.json();
            const { action } = body;

            if (action === "get_auth_url") {
                const timestamp = Math.floor(Date.now() / 1000);

                const host = "https://partner.test-stable.shopeemobile.com";
                const path = "/api/v2/shop/auth_partner";

                const sign = await generateSignature(path, timestamp);
                console.log(`[DEBUG] get_auth_url -> generated sign: ${sign}`);

                const authUrl = `${host}${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(REDIRECT_URL)}`;
                console.log(`[DEBUG] get_auth_url -> Final URL: ${authUrl}`);

                return new Response(JSON.stringify({ url: authUrl }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }

            if (action === "callback") {
                const { code, shopId } = body;

                if (!code || !shopId) {
                    throw new Error("Parâmetros code ou shopId ausentes");
                }

                const timestamp = Math.floor(Date.now() / 1000);
                const host = "https://partner.test-stable.shopeemobile.com";
                const path = "/api/v2/auth/token/get";

                const sign = await generateSignature(path, timestamp);

                const response = await fetch(
                    `${host}${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            code,
                            partner_id: PARTNER_ID,
                            shop_id: Number(shopId),
                        }),
                    }
                );

                const data = await response.json();

                if (data.error) {
                    throw new Error(`Erro Shopee: ${data.message || data.error}`);
                }

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

                return new Response(JSON.stringify({ success: true, shop_id: data.shop_id }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        return new Response(JSON.stringify({ error: "Ação inválida" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
