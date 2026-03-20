import { supabase } from './supabase';
import { Campaign, ClientCampaign } from '../types';

export const campaignService = {
  // --- CAMPAIGNS ---
  async getAllCampaigns(): Promise<Campaign[]> {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      return [];
    }
    return data;
  },

  async createCampaign(campaign: Partial<Campaign>): Promise<Campaign | null> {
    const { data, error } = await supabase
      .from('campaigns')
      .insert([campaign])
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      return null;
    }
    return data;
  },

  async toggleCampaignStatus(id: string, status: 'Ativa' | 'Encerrada'): Promise<boolean> {
    const { error } = await supabase
      .from('campaigns')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error toggling campaign status:', error);
      return false;
    }
    return true;
  },

  // --- CLIENT ASSIGNMENTS ---
  async getCampaignsForClient(clientId: string): Promise<ClientCampaign[]> {
    const { data, error } = await supabase
      .from('client_campaigns')
      .select('*')
      .eq('client_id', clientId)
      .order('date_sent', { ascending: false });

    if (error) {
      console.error('Error fetching client campaigns:', error);
      return [];
    }
    return data;
  },

  async assignCampaignToClients(campaignId: string, clientIds: string[]): Promise<boolean> {
    const payloads = clientIds.map(id => ({
      client_id: id,
      campaign_id: campaignId,
      date_sent: new Date().toISOString(),
      converted: false
    }));

    const { error } = await supabase
      .from('client_campaigns')
      .insert(payloads);

    if (error) {
      console.error('Error assigning campaigns to bulk clients:', error);
      return false;
    }
    return true;
  },

  async markAsConverted(clientCampaignId: string): Promise<boolean> {
     const { error } = await supabase
       .from('client_campaigns')
       .update({ converted: true })
       .eq('id', clientCampaignId);

     if (error) {
       console.error('Error marking campaign as converted:', error);
       return false;
     }
     return true;
  }
};
