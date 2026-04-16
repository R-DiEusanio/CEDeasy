package com.smm.social_planner.service;

import com.smm.social_planner.model.Post;
import com.smm.social_planner.repository.PostRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.UUID;

@Service
public class PostService {

    private final PostRepository postRepository;

    public PostService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    // 1. Creazione Post con gestione "Work Mode"
    public Post createPost(Post post) {
        // Se è consulenza, potremmo volerlo segnare già come 'INFO' o simile
        // Se è gestione completa, parte di default come 'DRAFT'
        if ("CONSULTANCY".equals(post.getWorkMode())) {
            post.setStatus("APPROVED"); // In consulenza non serve approvazione formale
        } else {
            post.setStatus("DRAFT");
        }
        return postRepository.save(post);
    }

    // 2. Invio al cliente per approvazione
    public Post requestApproval(UUID postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post non trovato"));
        post.setStatus("PENDING");
        return postRepository.save(post);
    }

    // 3. Approvazione "In un Click" (Lato Cliente)
    public Post approvePost(UUID postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post non trovato"));
        post.setStatus("APPROVED");
        return postRepository.save(post);
    }

    // 4. Rifiuto con commento (Lato Cliente)
    public Post rejectPost(UUID postId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new RuntimeException("Post non trovato"));
        post.setStatus("REJECTED");
        return postRepository.save(post);
    }

    // 5. Recupero Calendario
    public List<Post> getBrandCalendar(UUID brandId) {
        return postRepository.findByBrandIdOrderByScheduledDateAsc(brandId);
    }
}