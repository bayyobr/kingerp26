
import { supabase } from '../services/supabase';

async function test() {
    const startDate = '2026-03-20';
    const endDate = '2026-03-20';
    
    console.log('Fetching salesItems with join...');
    const { data: salesItems, error } = await supabase
        .from('vendas_itens')
        .select('tipo_item, item_id, quantidade, subtotal, vendas!inner(created_at)')
        .gte('vendas.created_at', startDate)
        .lte('vendas.created_at', endDate + 'T23:59:59');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Items found:', salesItems?.length);
    if (salesItems && salesItems.length > 0) {
        console.log('First item:', salesItems[0]);
    }
}

test();
