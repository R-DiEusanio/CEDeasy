package com.smm.social_planner.repository;

import com.smm.social_planner.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.List;

@Repository
public interface ClientRepository extends JpaRepository<Client, UUID> {
    
    // Trova tutti i referenti (Clienti) di un determinato Brand
    List<Client> findByBrandId(UUID brandId);
}