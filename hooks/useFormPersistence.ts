import { useState, useEffect, useCallback } from 'react';

export function useFormPersistence<T>(key: string, initialValue: T, isNew: boolean) {
    const [draftRequest, setDraftRequest] = useState<T | null>(null);

    // Initial check for draft
    useEffect(() => {
        if (isNew) {
            const saved = localStorage.getItem(`draft_${key}`);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    // Only set as request if it has some data (not just initial)
                    if (JSON.stringify(parsed) !== JSON.stringify(initialValue)) {
                        setDraftRequest(parsed);
                    }
                } catch (e) {
                    console.error('Error parsing draft', e);
                }
            }
        }
    }, [key, isNew, initialValue]);

    // Save draft on changes
    const saveDraft = useCallback((data: T) => {
        if (isNew) {
            localStorage.setItem(`draft_${key}`, JSON.stringify(data));
        }
    }, [key, isNew]);

    // Clear draft
    const clearDraft = useCallback(() => {
        localStorage.removeItem(`draft_${key}`);
        setDraftRequest(null);
    }, [key]);

    return { draftRequest, saveDraft, clearDraft, setDraftRequest };
}
