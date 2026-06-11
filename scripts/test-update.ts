import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const supabaseUrl = 'https://wygvuhfmfhqrmejnhjkr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5Z3Z1aGZtZmhxcm1lam5oamtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc1NzQzMTMsImV4cCI6MjA4MzE1MDMxM30.K9xS0s-vK_lT-3O6vKzB4tY0K00fO5t94XzK8T7_E58';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpdate() {
    const { data: products, error: fetchError } = await supabase.from('products').select('*').limit(1);
    if (fetchError) {
        console.error('Fetch error:', fetchError);
        return;
    }
    
    if (!products || products.length === 0) {
        console.log('No products found');
        return;
    }
    
    const product = products[0];
    console.log('Updating product:', product.id);
    
    const { error: updateError } = await supabase.from('products').update({ tiktok_fee_brl: 1.5 }).eq('id', product.id);
    if (updateError) {
        console.error('Update error:', updateError);
    } else {
        console.log('Update successful!');
    }
}

testUpdate();
