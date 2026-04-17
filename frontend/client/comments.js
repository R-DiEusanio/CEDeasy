import { supabase } from '/api/supabase.js'

export async function fetchComments(postId) {
    const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(full_name)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
    
    return data || [];
}

export function renderComments(comments) {
    const list = document.getElementById('comments-list');
    list.innerHTML = comments.map(c => `
        <div class="comment-bubble">
            <p class="comment-author">${c.profiles?.full_name}</p>
            <p class="comment-body">${c.body}</p>
        </div>
    `).join('');
}