const supabaseUrl = 'https://wygvuhfmfhqrmejnhjkr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5Z3Z1aGZtZmhxcm1lam5oamtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NzQzMTMsImV4cCI6MjA4MzE1MDMxM30.nedOWDpLXBHNTOQ5LhjleNoACSnT57hqB3DjUk5DiNM';

async function testUpdate() {
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/products?select=*&limit=1`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const products = await response.json();
        
        if (!products || products.length === 0) {
            console.log('No products found');
            return;
        }
        
        const product = products[0];
        console.log('Updating product:', product.id);
        
        const updateResponse = await fetch(`${supabaseUrl}/rest/v1/products?id=eq.${product.id}`, {
            method: 'PATCH',
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify({ tiktok_fee_brl: 1.5 })
        });
        
        const updateResult = await updateResponse.json();
        console.log('Update status:', updateResponse.status);
        console.log('Update result:', updateResult);
    } catch (err) {
        console.error('Error:', err);
    }
}

testUpdate();
