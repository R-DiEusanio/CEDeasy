package com.smm.social_planner.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.smm.social_planner.model.Post;
import com.smm.social_planner.repository.PostRepository;

@Service
public class PostService {

    private final PostRepository postRepository;

    public PostService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    public Post getPostById(UUID id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post non trovato con id: " + id));
    }

    public List<Post> getBrandCalendar(UUID brandId) {
        return postRepository.findByBrandIdOrderByScheduledDateAsc(brandId);
    }

    // Recupera l'attività globale per l'SMM
    public List<Post> getRecentPostsBySmm(UUID smmId) {
        return postRepository.findByBrand_SmmIdOrderByUpdatedAtDesc(smmId);
    }

    public Post createPost(Post post) {
        post.setCreatedAt(OffsetDateTime.now());
        post.setUpdatedAt(OffsetDateTime.now());
        if (post.getStatus() == null) post.setStatus("PENDING");
        return postRepository.save(post);
    }

    public Post updatePost(UUID id, Post details) {
        Post existingPost = getPostById(id);

        existingPost.setTitle(details.getTitle());
        existingPost.setContent(details.getContent());
        existingPost.setPlatform(details.getPlatform());
        existingPost.setScheduledDate(details.getScheduledDate());
        existingPost.setScheduledTime(details.getScheduledTime());
        existingPost.setMediaLink(details.getMediaLink());
        existingPost.setInternalNotes(details.getInternalNotes());
        
        // Fondamentale per l'ordine del Global Feed
        existingPost.setUpdatedAt(OffsetDateTime.now());

        return postRepository.save(existingPost);
    }

    public void deletePost(UUID id) {
        postRepository.deleteById(id);
    }

    public Post updateStatus(UUID id, String newStatus) {
        Post post = getPostById(id);
        post.setStatus(newStatus);
        post.setUpdatedAt(OffsetDateTime.now());
        return postRepository.save(post);
    }
}