import { supabase } from '@/lib/supabaseClient';

async function deleteHistoryById({ table, userId, id }) {
    if (!supabase) {
        throw new Error('Supabase client is not configured.');
    }

    const { error } = await supabase
        .from(table)
        .update({ is_delete: true })
        .eq('id', id)
        .eq('user_id', userId);

    if (error) {
        throw new Error(error.message || 'Failed to delete history item.');
    }
}

export const historyDeletes = {
    deleteQuestionHistoryItem: ({ userId, id }) =>
        deleteHistoryById({
            table: 'user_question_history',
            userId,
            id,
        }),

    deleteBlogHistoryItem: ({ userId, id }) =>
        deleteHistoryById({
            table: 'user_blog_history',
            userId,
            id,
        }),

    deleteAnalysisHistoryItem: ({ userId, id }) =>
        deleteHistoryById({
            table: 'user_analysis_history',
            userId,
            id,
        }),
};
