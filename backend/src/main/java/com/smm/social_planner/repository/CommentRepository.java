package com.smm.social_planner.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.smm.social_planner.model.Comment;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
    // Utile per caricare la cronologia dei commenti di un post specifico
    List<Comment> findByPostIdOrderByCreatedAtDesc(UUID postId);
}