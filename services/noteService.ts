import { supabase } from './supabase';

export type NoteType = 'idea' | 'goal' | 'plan';
export type NoteStatus = 'pending' | 'in_progress' | 'completed';
export type NotePriority = 'low' | 'medium' | 'high';

export interface Note {
    id: string;
    created_at: string;
    title: string;
    content: string | null;
    type: NoteType;
    status: NoteStatus;
    priority: NotePriority;
    user_id: string;
    target_value?: number;
    current_value?: number;
    deadline?: string;
    responsible?: string;
    category?: string;
    unit?: string;
}

export const noteService = {
    async getAll(): Promise<Note[]> {
        const { data, error } = await supabase
            .from('notes')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching notes:', error);
            throw error;
        }

        return data || [];
    },

    async create(note: Omit<Note, 'id' | 'created_at' | 'user_id'>): Promise<Note> {
        const sanitizedNote = {
            ...note,
            deadline: note.deadline || null,
        };
        const { data, error } = await supabase
            .from('notes')
            .insert(sanitizedNote)
            .select()
            .single();

        if (error) {
            console.error('Error creating note:', error);
            throw error;
        }

        return data;
    },

    async update(id: string, updates: Partial<Note>): Promise<Note> {
        const sanitizedUpdates = {
            ...updates,
            deadline: updates.deadline || (updates.deadline === '' ? null : undefined),
        };
        const { data, error } = await supabase
            .from('notes')
            .update(sanitizedUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating note:', error);
            throw error;
        }

        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('notes')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting note:', error);
            throw error;
        }
    }
};
