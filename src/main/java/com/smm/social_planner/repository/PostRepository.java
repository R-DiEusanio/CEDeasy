package com.smm.social_planner.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smm.social_planner.model.Post;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {
    // Trova tutti i post di un brand specifico e caricali in ordine di data
    List<Post> findByBrandIdOrderByScheduledDateAsc(UUID brandId);
}