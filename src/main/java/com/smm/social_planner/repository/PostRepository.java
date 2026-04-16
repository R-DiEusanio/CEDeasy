package com.smm.social_planner.repository;

import com.smm.social_planner.model.Post;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.List;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {
    
    // Prende tutti i post di un brand ordinati cronologicamente
    List<Post> findByBrandIdOrderByScheduledDateAsc(UUID brandId);

    // Trova i post in base allo stato (es. tutti quelli "PENDING" da approvare)
    List<Post> findByBrandIdAndStatus(UUID brandId, String status);
}