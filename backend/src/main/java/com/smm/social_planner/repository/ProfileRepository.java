package com.smm.social_planner.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.smm.social_planner.model.Profile; // Aggiungi questo import

@Repository
public interface ProfileRepository extends JpaRepository<Profile, UUID> {
    // AGGIUNGI QUESTA RIGA: permette di cercare il profilo tramite l'email
    Optional<Profile> findByEmail(String email);
}