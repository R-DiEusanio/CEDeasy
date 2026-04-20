package com.smm.social_planner.controller;

import com.smm.social_planner.model.Post;
import com.smm.social_planner.service.PostService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
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
}