package com.smm.social_planner.repository;

import com.smm.social_planner.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    
    // Prende tutta la conversazione di un post
    List<Comment> findByPostIdOrderByCreatedAtAsc(UUID postId);
}