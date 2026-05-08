package com.smm.social_planner.repository;

import com.smm.social_planner.model.Smm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface SmmRepository extends JpaRepository<Smm, UUID> {
    // Qui puoi aggiungere metodi specifici se servono, 
    // ma i base (save, findById) sono già inclusi.
}