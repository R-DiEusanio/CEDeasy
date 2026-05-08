package com.smm.social_planner.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.smm.social_planner.model.Comment;
import com.smm.social_planner.repository.CommentRepository;

@Service
public class CommentService {
    private final CommentRepository commentRepository;

    public CommentService(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    public Comment saveComment(Comment comment) {
        return commentRepository.save(comment);
    }

    // AGGIUNGI QUESTO METODO:
    public List<Comment> getCommentsByPost(UUID postId) {
        return commentRepository.findByPostIdOrderByCreatedAtDesc(postId);
    }
}