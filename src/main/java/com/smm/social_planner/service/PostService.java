package com.smm.social_planner.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.smm.social_planner.dto.PostDTO;
import com.smm.social_planner.model.Post;
import com.smm.social_planner.repository.PostRepository;

@Service
public class PostService {

    private final PostRepository postRepository;

    public PostService(PostRepository postRepository) {
        this.postRepository = postRepository;
    }

    public PostDTO getPostDTOById(UUID id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post non trovato con id: " + id));
        return convertToDTO(post);
    }

    public Post getPostById(UUID id) {
        return postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post non trovato con id: " + id));
    }

    public List<PostDTO> getBrandCalendarDTO(UUID brandId) {
        return postRepository.findByBrandIdOrderByScheduledDateAsc(brandId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<Post> getBrandCalendar(UUID brandId) {
        return postRepository.findByBrandIdOrderByScheduledDateAsc(brandId);
    }

    // Recupera l'attività globale per l'SMM
    public List<Post> getRecentPostsBySmm(UUID smmId) {
        return postRepository.findByBrand_SmmIdOrderByUpdatedAtDesc(smmId);
    }

    public PostDTO createPost(PostDTO postDTO) {
        Post post = convertToEntity(postDTO);
        post.setCreatedAt(OffsetDateTime.now());
        post.setUpdatedAt(OffsetDateTime.now());
        if (post.getStatus() == null) post.setStatus("PENDING");
        Post savedPost = postRepository.save(post);
        return convertToDTO(savedPost);
    }

    public PostDTO updatePost(UUID id, PostDTO postDTO) {
        Post existingPost = getPostById(id);

        existingPost.setTitle(postDTO.getTitle());
        existingPost.setContent(postDTO.getCaption());
        existingPost.setPlatform(postDTO.getType());
        existingPost.setMediaLink(postDTO.getMediaLink());
        existingPost.setInternalNotes(postDTO.getInternalNotes());
        
        // Fondamentale per l'ordine del Global Feed
        existingPost.setUpdatedAt(OffsetDateTime.now());

        Post updatedPost = postRepository.save(existingPost);
        return convertToDTO(updatedPost);
    }

    public void deletePost(UUID id) {
        postRepository.deleteById(id);
    }

    public PostDTO updateStatus(UUID id, String newStatus) {
        Post post = getPostById(id);
        post.setStatus(newStatus);
        post.setUpdatedAt(OffsetDateTime.now());
        Post updatedPost = postRepository.save(post);
        return convertToDTO(updatedPost);
    }

    // Metodi helper di conversione
    public PostDTO convertToDTO(Post post) {
        PostDTO dto = new PostDTO();
        dto.setId(post.getId().toString());
        dto.setBrandId(post.getBrand().getId().toString());
        dto.setTitle(post.getTitle());
        dto.setCaption(post.getContent());
        dto.setType(post.getPlatform());
        dto.setMediaLink(post.getMediaLink());
        dto.setInternalNotes(post.getInternalNotes());
        
        // Formato data per FullCalendar: YYYY-MM-DDThh:mm:ss
        String time = (post.getScheduledTime() != null) ? post.getScheduledTime() : "09:00:00";
        dto.setDate(post.getScheduledDate().toString() + "T" + time);

        // Traduzione stati: PENDING -> pending, APPROVED -> approved, ecc.
        String currentStatus = post.getStatus().toLowerCase();
        if (currentStatus.equals("revision_requested")) {
            dto.setStatus("pending");
            dto.setHasChangesRequested(true);
        } else {
            dto.setStatus(currentStatus);
            dto.setHasChangesRequested(false);
        }
        
        return dto;
    }

    public Post convertToEntity(PostDTO dto) {
        Post post = new Post();
        if (dto.getId() != null) {
            post.setId(UUID.fromString(dto.getId()));
        }
        post.setTitle(dto.getTitle());
        post.setContent(dto.getCaption());
        post.setPlatform(dto.getType());
        post.setMediaLink(dto.getMediaLink());
        post.setInternalNotes(dto.getInternalNotes());
        post.setStatus(dto.getStatus() != null ? dto.getStatus().toUpperCase() : "PENDING");
        return post;
    }
}