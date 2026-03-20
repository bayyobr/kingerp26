import { supabase } from './supabase';
import { ServiceOrder } from '../types';

export const orderService = {
    async getAll(startDate?: string, endDate?: string): Promise<ServiceOrder[]> {
        let query = supabase
            .from('service_orders')
            .select('*')
            .order('created_at', { ascending: false });

        if (startDate) {
            query = query.gte('entry_date', startDate);
        }
        if (endDate) {
            query = query.lte('entry_date', endDate + 'T23:59:59');
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching orders:', error);
            throw error;
        }

        return data.map(mapToServiceOrder);
    },

    async create(order: Omit<ServiceOrder, 'id'>): Promise<ServiceOrder> {
        const dbOrder = mapToDbOrder(order);
        const { data, error } = await supabase
            .from('service_orders')
            .insert(dbOrder)
            .select()
            .single();

        if (error) {
            console.error('Error creating order:', error);
            const detail = error.details || error.message || 'Erro desconhecido';
            throw new Error(`Falha ao criar OS: ${detail}`);
        }

        return mapToServiceOrder(data);
    },

    async update(order: ServiceOrder): Promise<ServiceOrder> {
        const dbOrder = mapToDbOrder(order);
        const { data, error } = await supabase
            .from('service_orders')
            .update(dbOrder)
            .eq('id', order.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating order:', error);
            const detail = error.details || error.message || 'Erro desconhecido';
            throw new Error(`Falha ao atualizar OS: ${detail}`);
        }

        return mapToServiceOrder(data);
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('service_orders')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting order:', error);
            throw error;
        }
    }
};

function mapToServiceOrder(data: any): ServiceOrder {
    return {
        id: data.id,
        osNumber: data.os_number,
        status: data.status,
        entryDate: data.entry_date,
        expectedExitDate: data.expected_exit_date,
        client: data.client,
        device: data.device,
        problemReported: data.problem_reported,
        technicalDiagnosis: data.technical_diagnosis,
        services: data.services,
        items: data.items,
        checklist: data.checklist,
        warrantyDays: data.warranty_days,
        priceParts: data.price_parts,
        priceTotal: data.price_total,
        technicianId: data.technician_id,
    };
}

function mapToDbOrder(order: any): any {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = order;

    return {
        os_number: order.osNumber,
        status: order.status,
        entry_date: order.entryDate,
        expected_exit_date: order.expectedExitDate,
        client: order.client,
        device: order.device,
        problem_reported: order.problemReported,
        technical_diagnosis: order.technicalDiagnosis, // Fixed key from camelCase key to snake_case key
        services: order.services,
        items: order.items,
        checklist: order.checklist,
        warranty_days: order.warrantyDays,
        price_parts: order.priceParts,
        price_total: order.priceTotal,
        technician_id: order.technicianId || null,
    };
}
