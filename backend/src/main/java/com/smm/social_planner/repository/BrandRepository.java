package com.smm.social_planner.repository;

import com.smm.social_planner.model.Brand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.List;

@Repository
public interface BrandRepository extends JpaRepository<Brand, UUID> {
    
    // Trova tutti i brand gestiti da un determinato SMM
    List<Brand> findBySmmId(UUID smmId);
}