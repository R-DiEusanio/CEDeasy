package com.smm.social_planner.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;
import java.time.OffsetDateTime;

@Entity
@Table(name = "brands")
@Data
public class Brand {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "smm_id", nullable = false)
    private UUID smmId; // L'ID del Social Media Manager che lo gestisce

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}