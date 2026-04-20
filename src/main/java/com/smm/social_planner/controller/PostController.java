package com.smm.social_planner.controller;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    // 1. LISTA: Tutti i post di un brand
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

    // 4. UPDATE (SMM sposta o modifica il post)
    @PutMapping("/{id}")
    public Post updatePost(@PathVariable UUID id, @RequestBody Post post) {
        return postService.updatePost(id, post);
    }

    // 5. DELETE
    @DeleteMapping("/{id}")
    public void deletePost(@PathVariable UUID id) {
        postService.deletePost(id);
    }

    // 6. UPDATE STATUS (Sincronizzato con il client-dashboard.js)
    // Riceve un body JSON: { "status": "APPROVED" }
    @PatchMapping("/{id}/status")
    public Post updateStatus(@PathVariable UUID id, @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        return postService.updateStatus(id, newStatus);
    }

    // 7. AGGIUNGI COMMENTO (Nuovo!)
    @PostMapping("/{id}/comments")
    public Comment addComment(
            @PathVariable UUID id, 
            @RequestBody Comment comment,
            @AuthenticationPrincipal Jwt jwt) {
        
        // Estraiamo l'ID utente dal token JWT di Supabase
        UUID authorId = UUID.fromString(jwt.getSubject());
        
        comment.setPostId(id);
        comment.setAuthorId(authorId);
        
        return commentService.saveComment(comment);
    }

    // 8. LISTA COMMENTI: Recupera tutti i commenti di un post
    @GetMapping("/{id}/comments")
    public List<Comment> getComments(@PathVariable UUID id) {
        return commentService.getCommentsByPost(id);
    }
}