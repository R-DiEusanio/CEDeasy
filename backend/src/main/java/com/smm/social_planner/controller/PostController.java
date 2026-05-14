package com.smm.social_planner.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.smm.social_planner.dto.CommentDTO;
import com.smm.social_planner.dto.PostDTO;
import com.smm.social_planner.model.Comment;
import com.smm.social_planner.service.CommentService;
import com.smm.social_planner.service.PostService;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;
    private final CommentService commentService;

    public PostController(PostService postService, CommentService commentService) {
        this.postService = postService;
        this.commentService = commentService;
    }

    // 1. LISTA: Trasformata in DTO per il frontend
    @GetMapping("/brand/{brandId}")
    public List<PostDTO> getCalendar(@PathVariable UUID brandId) {
        return postService.getBrandCalendarDTO(brandId);
    }

    // 2. READ: Singolo post trasformato in DTO
    @GetMapping("/{id}")
    public PostDTO getPost(@PathVariable UUID id) {
        return postService.getPostDTOById(id);
    }

    // 3. CREATE
    @PostMapping
    public PostDTO createPost(@RequestBody PostDTO postDTO) {
        return postService.createPost(postDTO);
    }

    // 4. UPDATE
    @PutMapping("/{id}")
    public PostDTO updatePost(@PathVariable UUID id, @RequestBody PostDTO postDTO) {
        return postService.updatePost(id, postDTO);
    }

    // 5. DELETE
    @DeleteMapping("/{id}")
    public void deletePost(@PathVariable UUID id) {
        postService.deletePost(id);
    }

    // 6. UPDATE STATUS
    @PatchMapping("/{id}/status")
    public PostDTO updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        return postService.updateStatus(id, newStatus);
    }

    // 7. GLOBAL FEED
    @GetMapping("/smm/{smmId}/recent")
    public List<PostDTO> getRecentActivity(@PathVariable UUID smmId) {
        return postService.getRecentPostsDTOBySmm(smmId);
    }

    // 8. AGGIUNGI COMMENTO
    @PostMapping("/{id}/comments")
    public CommentDTO addComment(
            @PathVariable UUID id, 
            @RequestBody CommentDTO commentDTO,
            @AuthenticationPrincipal Jwt jwt) {
        
        UUID authorId = UUID.fromString(jwt.getSubject());
        Comment comment = convertToCommentEntity(commentDTO);
        comment.setPostId(id);
        comment.setAuthorId(authorId);
        
        Comment savedComment = commentService.saveComment(comment);
        return convertToCommentDTO(savedComment);
    }

    // 9. LISTA COMMENTI
    @GetMapping("/{id}/comments")
    public List<CommentDTO> getComments(@PathVariable UUID id) {
        return commentService.getCommentsByPost(id).stream()
                .map(this::convertToCommentDTO)
                .collect(Collectors.toList());
    }

    // METODI HELPER: Conversione DTO <-> Entity
    private CommentDTO convertToCommentDTO(Comment comment) {
        CommentDTO dto = new CommentDTO();
        dto.setId(comment.getId().toString());
        dto.setPostId(comment.getPostId().toString());
        dto.setAuthorId(comment.getAuthorId() != null ? comment.getAuthorId().toString() : null);
        dto.setBody(comment.getBody());
        dto.setCreatedAt(comment.getCreatedAt() != null ? comment.getCreatedAt().toString() : null);
        return dto;
    }

    private Comment convertToCommentEntity(CommentDTO dto) {
        Comment comment = new Comment();
        if (dto.getId() != null) {
            comment.setId(UUID.fromString(dto.getId()));
        }
        if (dto.getPostId() != null) {
            comment.setPostId(UUID.fromString(dto.getPostId()));
        }
        if (dto.getAuthorId() != null) {
            comment.setAuthorId(UUID.fromString(dto.getAuthorId()));
        }
        comment.setBody(dto.getBody());
        return comment;
    }
}