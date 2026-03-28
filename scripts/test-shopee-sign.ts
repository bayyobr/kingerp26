import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

async function testSignature() {
    const PARTNER_ID = 1224946;
    const PARTNER_KEY = "SHPK6D6D68525459726D5A7348534376724B516C576D5061744E6D5345536A59";
    const path = "/api/v2/shop/auth_partner";
    const REDIRECT_URL = "https://wygvuhfmfhqrmejnhjkr.supabase.co/functions/v1/shopee-auth";

    // Simulate what happens in the Edge Function
    const timestamp = Math.floor(Date.now() / 1000);

    // As per Shopee V2 Auth Partner Docs: base_string = partner_id + api_path + timestamp
    const baseString = `${PARTNER_ID}${path}${timestamp}`;

    console.log("Base String:", baseString);

    const encoder = new TextEncoder();
    const keyBuffer = encoder.encode(PARTNER_KEY);
    const dataBuffer = encoder.encode(baseString);

    // Generates HMAC-SHA256
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        cryptoKey,
        dataBuffer
    );

    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const sign = signatureArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    console.log("Generated Sign:", sign);

    const authUrl = `https://partner.test-stable.shopeemobile.com/api/v2/shop/auth_partner?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(REDIRECT_URL)}`;
    console.log("Final URL:", authUrl);
}

testSignature();
