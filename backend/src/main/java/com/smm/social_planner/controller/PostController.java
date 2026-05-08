package com.smm.social_planner.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.smm.social_planner.dto.PostDTO;
import com.smm.social_planner.model.Comment;
import com.smm.social_planner.model.Post;
import com.smm.social_planner.service.CommentService;
import com.smm.social_planner.service.PostService;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "http://localhost:5173")
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
        List<Post> posts = postService.getBrandCalendar(brandId);
        return posts.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    // 2. READ: Singolo post trasformato in DTO
    @GetMapping("/{id}")
    public PostDTO getPost(@PathVariable UUID id) {
        Post post = postService.getPostById(id);
        return convertToDTO(post);
    }

    // 3. CREATE
    @PostMapping
    public Post createPost(@RequestBody Post post) {
        return postService.createPost(post);
    }

    // 4. UPDATE
    @PutMapping("/{id}")
    public Post updatePost(@PathVariable UUID id, @RequestBody Post post) {
        return postService.updatePost(id, post);
    }

    // 5. DELETE
    @DeleteMapping("/{id}")
    public void deletePost(@PathVariable UUID id) {
        postService.deletePost(id);
    }

    // 6. UPDATE STATUS
    @PatchMapping("/{id}/status")
    public Post updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        return postService.updateStatus(id, newStatus);
    }

    // 7. GLOBAL FEED (Novità! Risolve l'errore 404)
    @GetMapping("/smm/{smmId}/recent")
    public List<Post> getRecentActivity(@PathVariable UUID smmId) {
        return postService.getRecentPostsBySmm(smmId);
    }

    // 8. AGGIUNGI COMMENTO
    @PostMapping("/{id}/comments")
    public Comment addComment(
            @PathVariable UUID id, 
            @RequestBody Comment comment,
            @AuthenticationPrincipal Jwt jwt) {
        
        UUID authorId = UUID.fromString(jwt.getSubject());
        comment.setPostId(id);
        comment.setAuthorId(authorId);
        
        return commentService.saveComment(comment);
    }

    // 9. LISTA COMMENTI
    @GetMapping("/{id}/comments")
    public List<Comment> getComments(@PathVariable UUID id) {
        return commentService.getCommentsByPost(id);
    }

    // METODO HELPER: La "macchina del caffè" che trasforma i dati
    private PostDTO convertToDTO(Post post) {
        PostDTO dto = new PostDTO();
        dto.setId(post.getId().toString());
        dto.setBrandId(post.getBrand().getId().toString());
        dto.setTitle(post.getTitle());
        dto.setCaption(post.getContent());
        dto.setType(post.getPlatform()); 
        
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
}