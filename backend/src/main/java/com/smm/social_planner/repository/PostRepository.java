package com.smm.social_planner.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smm.social_planner.model.Post;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {
    List<Post> findByBrandIdOrderByScheduledDateAsc(UUID brandId);

    List<Post> findByBrand_SmmIdOrderByUpdatedAtDesc(UUID smmId);

    // Post visibili al cliente: tutto tranne le bozze
    List<Post> findByBrand_IdAndStatusNotIgnoreCaseOrderByScheduledDateAsc(UUID brandId, String status);
}