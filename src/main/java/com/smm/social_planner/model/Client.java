package com.smm.social_planner.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.UUID;

@Entity
@DiscriminatorValue("CLIENT") // Quando il ruolo è CLIENT, Java usa questa classe
@Data
@EqualsAndHashCode(callSuper = true)
public class Client extends Profile {
    
    @Column(name = "brand_id")
    private UUID brandId; // Il cliente appartiene a questo Brand
}