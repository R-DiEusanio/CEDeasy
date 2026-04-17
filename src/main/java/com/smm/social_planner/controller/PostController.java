package com.smm.social_planner.controller;

import com.smm.social_planner.model.Post;
import com.smm.social_planner.service.PostService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    // 1. LISTA: Visualizza tutti i post di un brand per il calendario
    @GetMapping("/brand/{brandId}")
    public List<Post> getCalendar(@PathVariable UUID brandId) {
        return postService.getBrandCalendar(brandId);
    }

    // 2. READ: Visualizza i dettagli di un singolo post
    @GetMapping("/{id}")
    public Post getPost(@PathVariable UUID id) {
        return postService.getPostById(id);
    }

    // 3. CREATE: Crea un nuovo post
    @PostMapping
    public Post createPost(@RequestBody Post post) {
        return postService.createPost(post);
    }

    // 4. UPDATE: Modifica un post esistente (o lo sposta nel calendario)
    @PutMapping("/{id}")
    public Post updatePost(@PathVariable UUID id, @RequestBody Post post) {
        return postService.updatePost(id, post);
    }

    // 5. DELETE: Elimina un post
    @DeleteMapping("/{id}")
    public void deletePost(@PathVariable UUID id) {
        postService.deletePost(id);
    }

    // 6. APPROVAZIONE (Lato Cliente)
    @PatchMapping("/{id}/approve")
    public Post approve(@PathVariable UUID id) {
        return postService.approvePost(id);
    }

    @PatchMapping("/{id}/reject")
    public Post reject(@PathVariable UUID id) {
        return postService.rejectPost(id);
    }
}