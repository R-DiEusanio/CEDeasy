package com.smm.social_planner.model;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "brands")
@Data
public class Brand {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String category;

    @Column(name = "smm_id", nullable = false)
    private UUID smmId;

    // --- CAMPI CRM CLIENTE ---
    @Column(name = "owner_name")
    private String ownerName; // Nome e Cognome proprietario

    private String email;

    private String phone;

    // --- SOCIAL ACCOUNT ---
    @Column(name = "tiktok_url")
    private String tiktokUrl;

    @Column(name = "instagram_url")
    private String instagramUrl;

    @Column(name = "facebook_url")
    private String facebookUrl;

    @Column(name = "telegram_url")
    private String telegramUrl;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
