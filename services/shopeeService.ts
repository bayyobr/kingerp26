import { supabase } from './supabase';

export const shopeeService = {
    async getAuthUrl() {
        const { data, error } = await supabase.functions.invoke('shopee-auth', {
            body: { action: 'get_auth_url' },
        });

        if (error) throw error;
        return data.url;
    },

    async handleCallback(code: string, shopId: string, userId: string) {
        const { data, error } = await supabase.functions.invoke('shopee-auth', {
            body: {
                action: 'callback',
                code,
                shopId,
                userId
            },
        });

        if (error) throw error;
        return data;
    },

    async getConnectionStatus() {
        const { data, error } = await supabase
            .from('integrations')
            .select('*')
            .eq('provider', 'shopee')
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return data;
    },

    async disconnect() {
        const { error } = await supabase
            .from('integrations')
            .delete()
            .eq('provider', 'shopee');

        if (error) throw error;
    }
};
