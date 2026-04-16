package com.smm.social_planner.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "posts")
@Data
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "brand_id", nullable = false)
    private UUID brandId;

    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "media_link")
    private String mediaLink;

    @Column(name = "scheduled_date")
    private OffsetDateTime scheduledDate;

    private String status = "DRAFT"; // DRAFT, PENDING, APPROVED, REJECTED

    @Column(name = "work_mode")
    private String workMode; // CONSULTANCY, FULL_MANAGEMENT

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();
}