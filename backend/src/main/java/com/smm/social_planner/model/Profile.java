package com.smm.social_planner.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity
@Table(name = "profiles")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE) // Una sola tabella per entrambi
@DiscriminatorColumn(name = "role", discriminatorType = DiscriminatorType.STRING)
@Data
public abstract class Profile {
    @Id
    private UUID id;

    @Column(name = "full_name")
    private String fullName;

    private String email;
}