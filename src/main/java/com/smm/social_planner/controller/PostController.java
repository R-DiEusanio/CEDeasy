package com.smm.social_planner.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import com.smm.social_planner.model.Comment;
import com.smm.social_planner.model.Post;
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

    // 1. LISTA: Tutti i post di un brand (Calendario Mensile)
    @GetMapping("/brand/{brandId}")
    public List<Post> getCalendar(@PathVariable UUID brandId) {
        return postService.getBrandCalendar(brandId);
    }

    // 2. READ: Singolo post
    @GetMapping("/{id}")
    public Post getPost(@PathVariable UUID id) {
        return postService.getPostById(id);
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
}