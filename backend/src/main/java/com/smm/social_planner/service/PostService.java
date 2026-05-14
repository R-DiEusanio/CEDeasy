package com.smm.social_planner.service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.smm.social_planner.dto.PostDTO;
import com.smm.social_planner.model.Brand;
import com.smm.social_planner.model.Post;
import com.smm.social_planner.repository.BrandRepository;
import com.smm.social_planner.repository.PostRepository;

@Service
public class PostService {

    private final PostRepository postRepository;
    private final BrandRepository brandRepository;

    public PostService(PostRepository postRepository, BrandRepository brandRepository) {
        this.postRepository = postRepository;
        this.brandRepository = brandRepository;
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

    public List<PostDTO> getRecentPostsDTOBySmm(UUID smmId) {
        return postRepository.findByBrand_SmmIdOrderByUpdatedAtDesc(smmId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public PostDTO createPost(PostDTO postDTO) {
        Post post = convertToEntity(postDTO);
        post.setCreatedAt(OffsetDateTime.now());
        post.setUpdatedAt(OffsetDateTime.now());
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
        existingPost.setFeedback(postDTO.getFeedback());
        if (postDTO.getDate() != null) {
            LocalDateTime ldt = LocalDateTime.parse(postDTO.getDate());
            existingPost.setScheduledDate(ldt.toLocalDate());
            existingPost.setScheduledTime(ldt.toLocalTime().toString());
        }
        existingPost.setUpdatedAt(OffsetDateTime.now());
        Post updatedPost = postRepository.save(existingPost);
        return convertToDTO(updatedPost);
    }

    public void deletePost(UUID id) {
        postRepository.deleteById(id);
    }

    public PostDTO updateStatus(UUID id, String newStatus) {
        Post post = getPostById(id);
        post.setStatus(newStatus.toUpperCase());
        post.setUpdatedAt(OffsetDateTime.now());
        Post updatedPost = postRepository.save(post);
        return convertToDTO(updatedPost);
    }

    public PostDTO convertToDTO(Post post) {
        PostDTO dto = new PostDTO();
        dto.setId(post.getId().toString());
        dto.setBrandId(post.getBrand().getId().toString());
        dto.setTitle(post.getTitle());
        dto.setCaption(post.getContent());
        dto.setType(post.getPlatform());
        dto.setMediaLink(post.getMediaLink());
        dto.setInternalNotes(post.getInternalNotes());
        dto.setFeedback(post.getFeedback());

        String time = (post.getScheduledTime() != null) ? post.getScheduledTime() : "09:00:00";
        dto.setDate(post.getScheduledDate().toString() + "T" + time);

        String dbStatus = post.getStatus() != null ? post.getStatus().toUpperCase() : "DRAFT";
        if (dbStatus.equals("REVISION_REQUESTED")) {
            dto.setStatus("pending");
            dto.setHasChangesRequested(true);
        } else {
            dto.setStatus(dbStatus.toLowerCase());
            dto.setHasChangesRequested(false);
        }

        return dto;
    }

    public Post convertToEntity(PostDTO dto) {
        Post post = new Post();
        if (dto.getId() != null) {
            post.setId(UUID.fromString(dto.getId()));
        }
        if (dto.getBrandId() != null) {
            Brand brand = brandRepository.findById(UUID.fromString(dto.getBrandId()))
                    .orElseThrow(() -> new RuntimeException("Brand non trovato: " + dto.getBrandId()));
            post.setBrand(brand);
        }
        post.setTitle(dto.getTitle());
        post.setContent(dto.getCaption());
        post.setPlatform(dto.getType());
        post.setMediaLink(dto.getMediaLink());
        post.setInternalNotes(dto.getInternalNotes());
        post.setFeedback(dto.getFeedback());
        post.setStatus(dto.getStatus() != null ? dto.getStatus().toUpperCase() : "DRAFT");
        if (dto.getDate() != null) {
            LocalDateTime ldt = LocalDateTime.parse(dto.getDate());
            post.setScheduledDate(ldt.toLocalDate());
            post.setScheduledTime(ldt.toLocalTime().toString());
        }
        return post;
    }
}
