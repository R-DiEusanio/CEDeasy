package com.smm.social_planner.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smm.social_planner.model.Post;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {
    List<Post> findByBrandIdOrderByScheduledDateAsc(UUID brandId);

    // NUOVO: Cerca i post di tutti i brand che appartengono a un certo SMM
    // Ordinati per l'ultima modifica (il più recente in alto)
    List<Post> findByBrand_SmmIdOrderByUpdatedAtDesc(UUID smmId);
}