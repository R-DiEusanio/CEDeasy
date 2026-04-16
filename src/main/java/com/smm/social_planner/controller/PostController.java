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

    // GET: Visualizza il calendario di un brand
    @GetMapping("/brand/{brandId}")
    public List<Post> getCalendar(@PathVariable UUID brandId) {
        return postService.getBrandCalendar(brandId);
    }

    // POST: Crea un nuovo post (SMM scrive il contenuto e mette il link a Drive)
    @PostMapping
    public Post createPost(@RequestBody Post post) {
        return postService.createPost(post);
    }

    // PATCH: L'approvazione in un click! (Lato Cliente)
    @PatchMapping("/{id}/approve")
    public Post approve(@PathVariable UUID id) {
        return postService.approvePost(id);
    }

    // PATCH: Rifiuto post (Lato Cliente)
    @PatchMapping("/{id}/reject")
    public Post reject(@PathVariable UUID id) {
        return postService.rejectPost(id);
    }
}